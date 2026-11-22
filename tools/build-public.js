/* build-public.js — 只把需要发布的内容复制到 public/
 * 仓库里的开发工具、文档不会被发布。
 *
 * 发布内容：index.html + assets/
 * 排除：README.md、check-region-icons.js、.gitignore、.github 等
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public');

const INCLUDE_FILES = ['index.html'];
const INCLUDE_DIRS = ['assets'];

/* 递归复制目录 */
function copyDir(src, dest, skip = new Set()) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d, skip);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

function mb(n) {
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

// ---------- 清理 ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ---------- 复制 ----------
for (const f of INCLUDE_FILES) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(OUT, f));
    console.log('  复制', f);
  } else {
    console.error('  ✗ 缺少必需文件:', f);
    process.exit(1);
  }
}

for (const d of INCLUDE_DIRS) {
  const src = path.join(ROOT, d);
  if (fs.existsSync(src)) {
    copyDir(src, path.join(OUT, d));
    console.log('  复制', d + '/');
  }
}

// ---------- 报告 ----------
const files = walk(OUT);
const total = files.reduce((s, f) => s + fs.statSync(f).size, 0);
console.log('\n构建完成：' + files.length + ' 个文件，' + mb(total));
console.log('输出目录：' + OUT);

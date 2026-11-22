# 部署

纯静态站点，推送代码即自动部署，**不需要任何 API 令牌**。

生产分支均为 `main`。

---

## 在线地址

| 平台 | 地址 | 说明 |
|---|---|---|
| **Cloudflare Pages** | https://queens-domain-eom.pages.dev | 国内访问较快，无限带宽 |
| **GitHub Pages** | https://heyuze-rain.github.io/queens-domain/ | 备份 |

> Cloudflare 的域名带 `-eom` 后缀，是因为 `queens-domain` 这个子域名已被其他 Cloudflare 用户占用，
> 创建项目时系统自动追加了后缀。GitHub 仓库名仍是 `queens-domain`，两者不必一致。

---

## Cloudflare Pages

### 首次配置

⚠ **先看这条：别建错类型。** Cloudflare 控制台里 **Workers** 和 **Pages** 是两个不同入口。
建错了会报 `Missing entry-point to Worker script or to assets directory`——因为 Workers 默认跑
`npx wrangler deploy`，它不认 Pages 的 `pages_build_output_dir`。

**必须走 Pages 页签。** 具体步骤：

1. 打开 https://dash.cloudflare.com/?to=/%3Aaccount/workers-and-pages
2. 点 **Create application**
3. **切到 `Pages` 页签**（关键，默认可能停在 Workers）
4. 选 **Import an existing Git repository**
5. 授权 GitHub，选 `HEYUZE-RAIN/queens-domain`
6. **Begin setup**，按下表填：

| 字段 | 值 |
|---|---|
| Project name | `queens-domain` |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `node tools/build-public.js` |
| Build output directory | `public` |

7. **Save and Deploy**

### 构建配置

`tools/build-public.js` 只把 `index.html` + `assets/` 复制到 `public/`，
仓库里的开发工具（`check-region-icons.js`、`tools/`）和文档不会被发布。

修改构建配置：Cloudflare 控制台 → 项目 → **Settings** → **Build**。

### 自动部署

推送到 `main` 即触发构建，日志在项目的 **Deployments** 页签。
其他分支会生成预览地址。

---

## GitHub Pages

在仓库 **Settings → Pages** 里设置：

| 字段 | 值 |
|---|---|
| Source | `Deploy from a branch` |
| Branch | `main` |
| 目录 | `/ (root)` |

保存后约 1 分钟可访问，推送后自动更新。

注意：GitHub Pages 会发布仓库根目录的所有文件（`README.md`、`check-region-icons.js`
也能通过网页访问）。仓库本身是公开的，这不构成额外泄露，故未处理。

---

## 本地开发

不需要构建，直接打开即可：

```bash
# 方式一：双击 index.html
# 方式二：起个静态服务器
python -m http.server 8000
```

预览发布产物（确认 `public/` 内容完整）：

```bash
node tools/build-public.js
cd public && python -m http.server 8899
```

### 区域图标校验

改动区域位置后运行，确认图标没有跑出区域：

```bash
npm i playwright-core
node check-region-icons.js
```

会检查：锚点 / 地标 / 区域名标签是否都在各自轮廓内、所有区域是否在视野内、
任意两块区域轮廓是否相交。退出码 0 表示全部通过。

---

## 换到其他托管

站点是纯静态的，`public/`（或仓库根目录的 `index.html` + `assets/`）可直接部署到任何静态托管：

| 平台 | 免费额度 | 特点 |
|---|---|---|
| Cloudflare Pages | 无限带宽 | 国内相对快 |
| Netlify | 100GB/月 | 拖拽部署最省事 |
| Vercel | 100GB/月 | 与 Next.js 生态好 |
| 自建 nginx | — | 完全可控 |

换平台不需要改 `index.html` 任何一行。

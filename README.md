# 青意传媒官网 · Qingyi Media

青意贸易（福建福清市）有限公司旗下传媒公会官方网站。包含公司主页、签约主播展示、动态资讯博客，以及一套完整的后台管理系统。所有前台内容均由数据库驱动，可在后台随时更新，无需重新部署。

A data-driven official website for the Qingyi Media guild, featuring a homepage, streamer roster, dynamic blog, and a full administration back office. All public content is editable from the admin panel without redeploying.

## 技术栈 / Tech Stack

- **框架**：Next.js 16（App Router）+ React 19 + TypeScript
- **样式**：Tailwind CSS v4
- **数据库**：PostgreSQL + Prisma ORM
- **认证**：基于 `jose` 的签名会话（httpOnly Cookie）+ `bcryptjs` 密码哈希
- **内容渲染**：Markdown（`marked`）+ 服务端净化（`isomorphic-dompurify`）
- **部署**：Render（Web Service + Managed PostgreSQL）

## 功能 / Features

- 首页：主视觉、数据统计、核心亮点、推荐主播、最新资讯（均可后台编辑）
- 签约主播：分类筛选、分页列表与主播详情页
- 动态资讯：Markdown 博客，标签筛选与分页
- 关于我们 / 加入我们 / 联系我们：文案与结构均可后台编辑
- 后台管理：主播、资讯的增删改查，以及各页面文案编辑
- 可选 Cloudinary 图片上传

## 本地开发 / Local Development

1. 安装依赖：

```bash
npm install
```

2. 准备环境变量：复制 `.env.example` 为 `.env`，填入真实值（数据库连接、会话密钥、初始管理员账号）。

```bash
cp .env.example .env
```

3. 初始化数据库并写入种子数据：

```bash
npm run db:migrate
npm run db:seed
```

4. 启动开发服务器：

```bash
npm run dev
```

访问 `http://localhost:3000`，后台位于 `http://localhost:3000/admin`。

## 环境变量 / Environment Variables

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串 |
| `SESSION_SECRET` | 会话签名密钥（≥ 32 字符） |
| `ADMIN_USERNAME` | 初始管理员用户名（仅 seed 使用） |
| `ADMIN_PASSWORD` | 初始管理员密码（仅 seed 使用） |
| `NEXT_PUBLIC_SITE_URL` | 站点公开地址，如 `https://qingyi.onrender.com` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | 可选，Cloudinary 云名称（国内访问建议不配，改用站内上传） |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | 可选，Cloudinary 无签名上传预设 |

真实值仅存放于本地 `.env`（已 gitignore）或 Render 密钥中，绝不提交到仓库。

## 部署到 Render / Deploy to Render

仓库根目录已提供 `render.yaml` 蓝图（区域为 **Singapore**，比美国节点更适合国内访问）：

1. 在 Render 中选择 **New > Blueprint**，连接本仓库。
2. Render 会自动创建 PostgreSQL 数据库与 Web 服务，并注入 `DATABASE_URL`，自动生成 `SESSION_SECRET`。
3. 在 Web 服务的环境变量中手动设置 `ADMIN_USERNAME` 与 `ADMIN_PASSWORD`，并把 `NEXT_PUBLIC_SITE_URL` 设为实际上线地址。
4. 部署时会在预部署阶段执行 `prisma migrate deploy` 与幂等种子脚本。

> 若自动生成的 `SESSION_SECRET` 不足 32 字符，请在控制台手动填入一个足够长的随机字符串。

## 让国内也能稳定打开 / China Access

站点本身**不依赖 Google 字体 / 被墙 CDN**，图片默认存在自家数据库，国内网络可以打开。常见「打不开」其实是 Render **免费实例休眠**后冷启动很慢。

已做的优化：

1. **保活**：`.github/workflows/keep-alive.yml` 每 10 分钟访问 `/api/health`，减少休眠。请在 GitHub 仓库 **Settings → Secrets → Actions** 增加 `SITE_URL`（例如 `https://qingyi.onrender.com`），并确保 Actions 已启用。
2. **新加坡区域**：`render.yaml` 使用 `singapore`。
3. **香港部署备选**：仓库含 `Dockerfile` + `fly.toml`（`primary_region = "hkg"`）。若 Render 仍偏慢，可用 [Fly.io](https://fly.io) 部署到香港：

```bash
fly launch --no-deploy
fly postgres create --region hkg
fly secrets set DATABASE_URL=... SESSION_SECRET=... ADMIN_USERNAME=... ADMIN_PASSWORD=... NEXT_PUBLIC_SITE_URL=https://你的域名
fly deploy
```

4. **自定义域名（推荐）**：在 Render 绑定你自己的域名，再在 Cloudflare 做 DNS 代理，分享链接更正规，也便于以后换主机。

> **备案说明**：若要使用 `.cn` 域名并在中国大陆机房托管（阿里云 / 腾讯云等），需要完成 **ICP 备案**，周期通常数周。未备案前，用海外主机（新加坡 / 香港）+ `.com` / 现有 Render 域名即可给国内访客使用，只是高峰时可能偏慢。

## 常用脚本 / Scripts

- `npm run dev`：本地开发
- `npm run build`：生产构建（含 `prisma generate`）
- `npm run start`：生产启动
- `npm run lint`：代码检查
- `npm run db:migrate` / `db:deploy`：数据库迁移
- `npm run db:seed`：写入种子数据
- `npm run db:studio`：打开 Prisma Studio

## 目录结构 / Project Structure

参见 [`ARCHITECTURE.md`](./ARCHITECTURE.md)。

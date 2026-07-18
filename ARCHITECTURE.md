# 架构说明 / Architecture

本项目按分层架构组织，目录结构映射逻辑层次，依赖方向自上而下（表现层 → 领域层 → 基础设施层）。

The codebase follows a layered architecture. Directory names mirror logical layers, and dependencies flow downward: presentation → domain → infrastructure.

## 分层 / Layers

```
src/
├── app/                      # 表现层：Next.js 路由、页面与服务端 action（保持精简）
│   ├── (public)/             #   公共站点路由组（含共享 header/footer 布局）
│   │   ├── page.tsx          #     首页
│   │   ├── streamers/        #     主播列表与详情
│   │   ├── blog/             #     资讯列表与详情
│   │   ├── about/ join/ contact/
│   ├── admin/                #   后台
│   │   ├── login/            #     独立登录页
│   │   ├── (panel)/          #     已认证后台外壳（概览、主播、资讯、页面内容）
│   │   └── _actions/         #     服务端 action（鉴权、CRUD、内容保存）
│   ├── layout.tsx            #   根布局
│   └── not-found.tsx
├── domain/                   # 领域层：业务规则、校验 schema 与应用服务
│   ├── streamers/            #   主播领域（schema + service）
│   ├── blog/                 #   博客领域
│   ├── site/                 #   可编辑站点内容（类型、注册表、service）
│   ├── auth/                 #   认证用例
│   └── shared/               #   分页等共享契约
├── infrastructure/           # 基础设施层：外部系统适配
│   ├── database/
│   │   ├── prisma/           #     Prisma 客户端单例
│   │   └── repositories/     #     数据访问边界（每个聚合一个仓储）
│   └── auth/
│       ├── password.ts       #     bcrypt 密码哈希
│       └── session/          #     jose 会话签名与当前用户解析
├── ui/                       # 展示组件（无业务逻辑）
│   └── components/
│       ├── layout/           #     header / footer / page-header
│       ├── primitives/       #     container / badge / button / pagination 等
│       ├── cards/            #     主播卡片 / 文章卡片
│       ├── media/            #     远程图片渲染
│       └── admin/            #     后台表单、编辑器与布局组件
├── lib/                      # 通用工具（文本、格式化、UI、Markdown 渲染）
├── config/                   # 站点静态配置与环境变量契约
└── middleware.ts             # 边缘中间件：保护 /admin 路由
```

## 关键设计 / Key Decisions

- **数据驱动内容**：前台所有可变内容来自数据库。页面文案通过 `SiteSetting` 键值表存储，主播与资讯为独立模型。默认值内置于领域层，保证全新部署即可渲染。
- **鉴权纵深防御**：边缘中间件拦截未认证的 `/admin` 请求；服务端 action 与后台布局再次校验会话。
- **信任边界校验**：所有写入操作在服务端使用 Zod 校验；Markdown 输出经 DOMPurify 净化后再渲染。
- **仓储隔离**：领域服务只依赖窄接口仓储，不直接耦合 Prisma 查询细节。
- **密钥管理**：源码与配置仅含环境变量引用，真实值置于本地 `.env` 或 Render 密钥中。

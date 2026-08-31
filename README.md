# Deploy Kit

一个使用 Cloudflare Worker + D1 的绘梦后台起始项目。

## 本地预览

直接用任意静态服务器打开当前目录即可，例如：

```bash
npx serve .
```

## 部署到 Cloudflare

项目使用 Worker Static Assets 和 D1：

- 构建命令：`npm ci`
- 部署命令：`npx wrangler deploy`
- 根目录：`/`

页面入口为 `public/index.html`，数据库绑定名称为 `DB`。

首次创建 D1 表结构后，可使用 `npx wrangler d1 execute huimeng --remote --file=./schema.sql` 执行 SQL。

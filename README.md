# Deploy Kit

一个无需构建的静态 Cloudflare Worker 起始页面。

## 本地预览

直接用任意静态服务器打开当前目录即可，例如：

```bash
npx serve .
```

## 部署到 Cloudflare

将仓库连接到 Cloudflare Pages 时：

- 构建命令：留空
- 输出目录：`.`

如果使用 Worker Static Assets，则将本目录作为 assets 目录上传即可。页面入口为 `index.html`。

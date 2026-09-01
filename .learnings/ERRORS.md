# Errors

## [ERR-20260830-001] browser-client-path

**Logged**: 2026-08-30T00:00:00-07:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
首次本地浏览器验收使用了过时的插件脚本路径。

### Error
```text
Module not found: /Users/yao/.codex/plugins/cache/openai-bundled/browser/26.825.41651/skills/control-in-app-browser/scripts/browser-client.mjs
```

### Context
- 尝试通过本地浏览器检查静态页面渲染
- 当前插件版本将脚本放在 browser 目录根部的 scripts 文件夹

### Suggested Fix
使用 `/Users/yao/.codex/plugins/cache/openai-bundled/browser/26.825.41651/scripts/browser-client.mjs`。

### Metadata
- Reproducible: yes
- Related Files: index.html, styles.css
---

## [ERR-20260831-002] wrangler-remote-auth

**Logged**: 2026-08-31T10:00:00-07:00
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
远程执行 D1 导入时，当前非交互终端没有可用的 Cloudflare API Token。

### Error
```text
In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for wrangler to work.
```

### Context
- 本地 MySQL dump 已转换并通过 SQLite 验证
- 目标命令：`wrangler d1 execute huimeng --remote --file=./migrations/0001_hm_activation_code.sql`

### Suggested Fix
用户在本机完成 `wrangler login`，或配置仅限当前账号的 `CLOUDFLARE_API_TOKEN` 后重新执行导入。

### Metadata
- Reproducible: yes
- Related Files: migrations/0001_hm_activation_code.sql
---

## [ERR-20260901-001] wrangler-remote-preview

**Logged**: 2026-09-01T03:40:00-07:00
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
通过 Wrangler 远程开发通道请求线上 D1 时连接中断。

### Error
```text
Error: Network connection lost.
```

### Context
- 启动 `wrangler dev --remote --port 8788`
- 请求本地远程预览地址的激活码列表
- 尚未执行激活写入

### Suggested Fix
改用已部署 Worker 地址重试，或检查远程预览通道和 Cloudflare 网络状态。

### Metadata
- Reproducible: unknown
- Related Files: src/index.js
---

## [ERR-20260901-002] wrangler-info

**Logged**: 2026-09-01T03:42:00-07:00
**Priority**: low
**Status**: pending
**Area**: infra

### Summary
当前 Wrangler 版本不支持 `wrangler info` 子命令。

### Error
```text
Unknown argument: info
```

### Context
- 尝试读取 Worker 部署信息和访问地址

### Suggested Fix
使用 `wrangler deploy` 输出的部署地址或 Cloudflare Dashboard 查看 Worker URL。

### Metadata
- Reproducible: yes
- Related Files: wrangler.toml
---

## [ERR-20260901-003] worker-connectivity

**Logged**: 2026-09-01T03:50:00-07:00
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
正式部署成功后，当前终端无法连接 Worker 的 HTTPS 地址。

### Error
```text
Node fetch: ECONNREFUSED
curl: (7) Failed to connect to hmadmin.huimeng.workers.dev port 443
```

### Context
- Worker 已成功部署，版本 `0a9126a9-ac8e-4011-b7f1-1c4d2133b805`
- 直连 `https://hmadmin.huimeng.workers.dev/` 失败
- 尚未执行线上激活测试，因此没有改变 D1 数据

### Suggested Fix
检查当前网络出口、代理/VPN、防火墙或 DNS；在浏览器或其他网络环境访问 Worker 后再进行接口闭环测试。

### Metadata
- Reproducible: yes
- Related Files: src/index.js, wrangler.toml
---

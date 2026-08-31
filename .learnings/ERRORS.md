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

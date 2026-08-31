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

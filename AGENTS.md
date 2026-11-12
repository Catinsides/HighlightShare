# AGENTS.md

HighlightShare：Chrome 扩展（Manifest V3），把网页选中的文字/图片生成分享卡片。原生 JavaScript，无构建系统、无框架、无第三方依赖（`html2canvas.min.js`、`qrcode.min.js` 是仓库内 vendored 文件），没有 package.json、测试框架和 CI。

## 验证方式（只能手动）

- 没有 build/lint/test 命令。验证流程：`chrome://extensions/` → 开发者模式 → 「加载已解压的扩展程序」选仓库根目录 → 改动后在扩展卡片点「重新加载」→ 刷新目标网页实测。
- 改过 `manifest.json` 后必须重新加载扩展并刷新页面才生效。

## html2canvas 导出限制

- 避免它不支持的 CSS：部分 filter、conic-gradient 等。
- 模板内 `<img>` 必须设置 `crossorigin="anonymous"`，否则画布污染、导出图片失败。

## 约定

- commit message 用中文 + Conventional Commits，如 `feat(模板): 新增 XX 卡片模板`（见 CONTRIBUTING.md）。
- 功能或模板机制变动时，`README.md` 与 `README_EN.md` 两份都要同步更新。
- 2 空格缩进；代码注释与 UI 文案均为中文。

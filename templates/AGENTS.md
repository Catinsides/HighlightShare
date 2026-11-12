# 站点模板开发指南

新增站点模板必须做两步，缺一不可：

1. 新建 `templates/<站点>/template.js`，用 `window.HighlightShareTemplates.register({ id, name, matches, css?, render })` 自注册（写法见 README「编写新模板」）。
2. 在 `manifest.json` 的 `content_scripts.js` 数组追加该文件路径。

- **漏掉第 2 步模板不会加载，且没有任何报错。**
- manifest 注入顺序是硬约束：`html2canvas.min.js → content.js → templates/registry.js → 各模板 → qrcode.min.js`，模板必须排在 registry 之后。
- 模板只负责卡片内容区；标题栏、二维码、复制/下载由 content.js 通用提供。
- 模板 `render()` 抛异常会静默回退默认渲染（仅 console.warn），调试模板时注意异常被吞。
- 选区快照字段见根目录 README「渲染数据」表：`richFragment` 是 DocumentFragment，使用需 `cloneNode(true)`，可能为 null。

导出图片统一走 html2canvas，相关 CSS 与跨域限制见仓库根目录 `AGENTS.md`「html2canvas 导出限制」。

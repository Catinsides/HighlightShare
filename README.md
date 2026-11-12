<div align="center">

# ✨ HighlightShare

**一个简单优雅的 Chrome 扩展，将网页中的文字和图片生成精美的分享卡片**

[English](./README_EN.md) | 中文

![License](https://img.shields.io/github/license/HeyHuazi/HighlightShare?color=blue)
![Stars](https://img.shields.io/github/stars/HeyHuazi/HighlightShare?style=social)
![Version](https://img.shields.io/badge/version-1.0-brightgreen)
![Manifest](https://img.shields.io/badge/Manifest-V3-orange)

![Demo](https://huazispace.s3.bitiful.net/HightlightShare%2Fintroduce.png?no-wait=on)

</div>

---

## 🌟 功能特色

- 🎯 **一键选择** — 选中网页文字或右键点击图片即可生成卡片
- 🎨 **双主题切换** — 提供明 / 暗两种精美主题风格
- 🧩 **站点模板** — 针对特定网站的专属卡片样式，内置可扩展的模板机制
- 📱 **二维码分享** — 自动生成当前页面二维码，支持显示/隐藏
- 💾 **便捷导出** — 一键复制到剪贴板或下载为 PNG 图片
- 🎭 **优雅界面** — 简洁美观的卡片设计，信息层次清晰
- ⚡ **轻量高效** — 原生 JavaScript 开发，无需额外框架

## 📸 预览

| 明亮主题 | 暗色主题 |
|:---:|:---:|
| Light | Dark |

## 📦 安装

### 方式一：本地安装（开发者模式）

1. 克隆或下载本仓库到本地
   ```bash
   git clone https://github.com/HeyHuazi/HighlightShare.git
   ```
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角 **「开发者模式」**
4. 点击 **「加载已解压的扩展程序」**，选择项目目录

## 🎮 使用方法

1. **选择内容**
   - 在网页中选中文字，或右键点击图片
2. **生成卡片**
   - 点击右键菜单中的 **「生成分享卡片」**
3. **自定义卡片**
   - 点击 **「切换」** 按钮更换明/暗主题风格
   - 在支持站点模板的网站上，点击 **「模板」** 按钮使用该网站的专属卡片样式（可随时切回）
   - 点击 **「二维码」** 按钮显示或隐藏页面二维码
4. **分享卡片**
   - 点击 **「复制」** 按钮复制到剪贴板
   - 点击 **「下载」** 按钮保存为图片

## 🏗️ 项目结构

```
HighlightShare/
├── manifest.json          # Chrome 扩展配置 (Manifest V3)
├── background.js          # Service Worker 后台脚本
├── content.js             # 内容脚本（卡片生成核心逻辑）
├── content.css            # 卡片样式
├── templates/             # 站点模板
│   ├── registry.js        # 模板注册表
│   └── x/                 # X（Twitter）站点模板
│       └── template.js
├── html2canvas.min.js     # html2canvas 库
├── qrcode.min.js          # QRCode.js 库
└── icons/                 # 扩展图标
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🧩 网站模板

针对特定网站定制的卡片渲染模板。当你在匹配的网站上生成卡片时，工具栏会出现 **「模板」** 按钮，一键切换为该网站的专属卡片样式（可随时切回默认渲染）。

已内置：X / Twitter（`templates/x/`）— 在推文上选中任意内容即可生成完整推文卡片，自动提取作者名、头像、发布时间、媒体图与互动统计（replies / shares / likes），提取不到的区块自动省略。

### 编写新模板

1. 新建 `templates/<站点>/template.js`：

   ```js
   (function () {
     window.HighlightShareTemplates.register({
       id: 'my-site',               // 唯一 id
       name: '我的站点模板',         // 工具栏按钮提示名称
       matches: ['example.com'],    // 匹配的域名（自动包含子域）
       css: `.my-card { /* 模板样式 */ }`,
       render(data) {               // data 为选区快照，返回 DOM 节点
         const root = document.createElement('div');
         // ...使用 data 渲染卡片内容
         return root;
       }
     });
   })();
   ```

2. 在 `manifest.json` 的 `content_scripts.js` 数组中追加该文件路径（须位于 `content.js` 与 `templates/registry.js` 之后）。

**渲染数据（选区快照）字段**：

| 字段 | 说明 |
|------|------|
| `pageTitle` / `pageUrl` / `host` / `favicon` | 当前页面信息 |
| `richFragment` | 富文本片段（DocumentFragment，使用时请 `cloneNode(true)`），可能为 null |
| `plainHtml` / `text` | 纯文本兜底（HTML / 原始文本） |
| `imageUrl` | 右键图片地址，可能为空 |

**注意事项**：

- 模板只负责卡片中间的内容区；顶部标题栏、二维码与复制/下载等通用能力由扩展提供
- 导出图片使用 html2canvas 渲染，请避免使用它不支持的 CSS 特性（如部分 filter、conic-gradient）
- 模板内引用图片请设置 `crossorigin="anonymous"`，否则导出会因画布污染失败
- 模板渲染抛出异常时会自动回退默认渲染，不会中断卡片生成

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| 原生 JavaScript | 核心开发，零依赖框架 |
| Chrome Extension Manifest V3 | 扩展标准 |
| [html2canvas](https://html2canvas.hertzen.com/) | DOM 转图片导出 |
| [QRCode.js](https://github.com/davidshimjs/qrcodejs) | 二维码生成 |

## 📋 更新日志

### V1.0
- ✨ 基础卡片生成功能
- ✨ 支持文字和图片选择
- ✨ 明暗双主题切换
- ✨ 二维码生成与显示控制
- ✨ 复制到剪贴板和下载为图片

## 🤝 贡献

欢迎各种形式的贡献！请阅读 [贡献指南](./CONTRIBUTING.md) 了解详情。

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。

## 🙏 致谢

- [html2canvas](https://html2canvas.hertzen.com/) — 截图库
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) — 二维码生成库

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star 支持一下！**

Made with ❤️ by [Huazi](https://github.com/HeyHuazi)

</div>

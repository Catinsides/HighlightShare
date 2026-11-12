<div align="center">

# ✨ HighlightShare

**A simple and elegant Chrome extension that generates beautiful share cards from selected text and images on web pages.**

English | [中文](./README.md)

![License](https://img.shields.io/github/license/HeyHuazi/HighlightShare?color=blue)
![Stars](https://img.shields.io/github/stars/HeyHuazi/HighlightShare?style=social)
![Version](https://img.shields.io/badge/version-1.0-brightgreen)
![Manifest](https://img.shields.io/badge/Manifest-V3-orange)

![Demo](https://huazispace.s3.bitiful.net/HightlightShare%2Fintroduce.png?no-wait=on)

</div>

---

## 🌟 Features

- 🎯 **One-Click Selection** — Select text or right-click images on any webpage
- 🎨 **Dual Themes** — Light and dark theme styles with one-click switching
- 🧩 **Site Templates** — Dedicated card styles for specific websites, powered by an extensible template mechanism
- 📱 **QR Code Sharing** — Auto-generate QR code for the current page, toggle visibility
- 💾 **Easy Export** — Copy to clipboard or download as PNG image
- 🎭 **Elegant UI** — Clean and beautiful card design with clear information hierarchy
- ⚡ **Lightweight** — Built with vanilla JavaScript, no frameworks required

## 📸 Preview

| Light Theme | Dark Theme |
|:---:|:---:|
| Light | Dark |

## 📦 Installation

### Local Install (Developer Mode)

1. Clone or download this repository
   ```bash
   git clone https://github.com/HeyHuazi/HighlightShare.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** in the top right corner
4. Click **Load unpacked** and select the project directory

## 🎮 Usage

1. **Select Content**
   - Select text on a webpage, or right-click an image
2. **Generate Card**
   - Click **"生成分享卡片"** in the context menu
3. **Customize Card**
   - Click **"切换"** button to switch between light/dark themes
   - On websites with site templates, click **"模板"** to use the dedicated card style for that site (switch back anytime)
   - Click **"二维码"** button to show/hide the QR code
4. **Share Card**
   - Click **"复制"** button to copy to clipboard
   - Click **"下载"** button to save as image

## 🏗️ Project Structure

```
HighlightShare/
├── manifest.json          # Chrome extension config (Manifest V3)
├── background.js          # Service worker background script
├── content.js             # Content script (core card generation logic)
├── content.css            # Card styles
├── templates/             # Site templates
│   ├── registry.js        # Template registry
│   └── x/                 # X (Twitter) site template
│       └── template.js
├── html2canvas.min.js     # html2canvas library
├── qrcode.min.js          # QRCode.js library
└── icons/                 # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🧩 Site Templates

Customized card rendering templates for specific websites. When you generate a card on a matching website, a **"模板"** (Template) button appears in the toolbar, letting you switch to the site's dedicated card style (and back to the default rendering anytime).

Built-in templates live in the `templates/` directory — one subdirectory per site (e.g. `templates/x/`, `templates/v2ex/`). Check that directory to see which sites are supported.

### Writing a New Template

1. Create `templates/<site>/template.js`:

   ```js
   (function () {
     window.HighlightShareTemplates.register({
       id: 'my-site',               // Unique id
       name: 'My Site Template',    // Toolbar button tooltip
       matches: ['example.com'],    // Matching domains (subdomains included automatically)
       css: `.my-card { /* template styles */ }`,
       render(data) {               // data is the selection snapshot; return a DOM node
         const root = document.createElement('div');
         // ...build the card content from data
         return root;
       }
     });
   })();
   ```

2. Append the file path to the `content_scripts.js` array in `manifest.json` (it must come after `content.js` and `templates/registry.js`).

**Selection snapshot fields passed to `render`**:

| Field | Description |
|-------|-------------|
| `pageTitle` / `pageUrl` / `host` / `favicon` | Current page info |
| `richFragment` | Rich-text fragment (DocumentFragment, use `cloneNode(true)` when inserting), may be null |
| `plainHtml` / `text` | Plain-text fallback (HTML / raw text) |
| `imageUrl` | Right-clicked image URL, may be empty |

**Notes**:

- Templates only render the card's content area; the header, QR code, copy/download and other shared capabilities are provided by the extension
- Exported images are rendered by html2canvas; avoid CSS features it does not support (e.g. some filters, conic-gradient)
- Set `crossorigin="anonymous"` on images inside templates, otherwise export fails due to canvas tainting
- If a template's render throws, the extension automatically falls back to the default rendering

## 🛠️ Tech Stack

| Tech | Purpose |
|------|----------|
| Vanilla JavaScript | Core development, zero framework dependency |
| Chrome Extension Manifest V3 | Extension standard |
| [html2canvas](https://html2canvas.hertzen.com/) | DOM-to-image export |
| [QRCode.js](https://github.com/davidshimjs/qrcodejs) | QR code generation |

## 📋 Changelog

### V1.0
- ✨ Basic card generation
- ✨ Text and image selection support
- ✨ Light/Dark theme switching
- ✨ QR code generation and visibility control
- ✨ Copy to clipboard and download as image

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

## 🙏 Acknowledgements

- [html2canvas](https://html2canvas.hertzen.com/) — Screenshot library
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) — QR code generation library

---

<div align="center">

**If this project helps you, please consider giving it a ⭐ Star!**

Made with ❤️ by [Huazi](https://github.com/HeyHuazi)

</div>

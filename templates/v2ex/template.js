// ============ V2EX 站点模板 ============
// 匹配 v2ex.com（含子域）。卡片布局对照 V2EX 主题页（/t/{id}）：
// 面包屑 + 站点 logo、主题标题、投票按钮 + 作者/时间/点击数行、
// 分隔线、正文（选区优先，整帖兜底）、底部水印。
// 提取策略：主题容器是 .box，内含 .header（面包屑/标题/投票/作者行）
// 与 .topic_content（正文）。选区锚点向上 closest('.box') 定位；
// 若选区落在回复区（无 .header 的 .box），回退到页面第一个主题容器。
// 非主题页（首页/节点页/列表页）提取不到标题时抛异常，由扩展自动回退默认渲染。
(function () {
  const CSS = `
    .hs-tpl-v2ex {
      font-family: -apple-system, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      color: #333;
    }
    .hs-tpl-v2ex-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .hs-tpl-v2ex-crumbs {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      line-height: 1.5;
      color: #778087;
    }
    .hs-tpl-v2ex-crumbs .hs-tpl-v2ex-site {
      font-weight: 700;
      color: #333;
    }
    .hs-tpl-v2ex-crumbs .hs-tpl-v2ex-chevron {
      color: #b0b7bb;
      margin: 0 4px;
    }
    .hs-tpl-v2ex-crumbs .hs-tpl-v2ex-node {
      font-weight: 700;
      color: #333;
    }
    .hs-tpl-v2ex-logo {
      width: 18px;
      height: 18px;
      border-radius: 3px;
      flex: none;
      object-fit: cover;
    }
    .hs-tpl-v2ex-titlerow {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-top: 12px;
    }
    .hs-tpl-v2ex-title {
      flex: 1;
      min-width: 0;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.4;
      color: #222;
      word-break: break-word;
      /* 不用 nowrap 截断：html2canvas 重绘时对裁切边界计算不准，会把文字底部切掉 */
    }
    .hs-tpl-v2ex-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 14px 0 0;
    }
    .hs-tpl-v2ex-avatar {
      width: 44px;
      height: 44px;
      border-radius: 6px;
      object-fit: cover;
      flex: none;
    }
    .hs-tpl-v2ex-reply-author {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 12px;
    }
    .hs-tpl-v2ex-reply-avatar {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      object-fit: cover;
      flex: none;
    }
    .hs-tpl-v2ex-reply-name {
      font-weight: 700;
      color: #555;
      font-size: 14px;
      line-height: 1.5;
    }
    .hs-tpl-v2ex-reply-meta {
      font-size: 13px;
      line-height: 1.5;
      color: #999;
    }
    .hs-tpl-v2ex-byline {
      font-size: 13px;
      line-height: 1.5;
      color: #999;
      min-width: 0;
    }
    .hs-tpl-v2ex-byline .hs-tpl-v2ex-author {
      font-weight: 700;
      color: #555;
    }
    .hs-tpl-v2ex-byline .hs-tpl-v2ex-sep {
      margin: 0 6px;
      color: #c2c8cb;
    }
    .hs-tpl-v2ex-divider {
      height: 1px;
      background: #e8e8e8;
      margin: 16px 0 14px;
    }
    .hs-tpl-v2ex-text {
      font-size: 16px;
      line-height: 1.7;
      color: #333;
      word-break: break-word;
    }
    .hs-tpl-v2ex-text p {
      margin: 0 0 12px;
    }
    .hs-tpl-v2ex-text p:last-child {
      margin-bottom: 0;
    }
    .hs-tpl-v2ex-text ul,
    .hs-tpl-v2ex-text ol {
      margin: 0 0 12px;
      padding-left: 22px;
    }
    .hs-tpl-v2ex-text li {
      margin-bottom: 4px;
    }
    .hs-tpl-v2ex-text a {
      color: #778087;
      text-decoration: none;
    }
    .hs-tpl-v2ex-text blockquote {
      margin: 0 0 12px;
      padding: 4px 12px;
      border-left: 3px solid #e2e2e2;
      color: #555;
    }
    .hs-tpl-v2ex-text pre,
    .hs-tpl-v2ex-text code {
      font-family: Menlo, Consolas, monospace;
      font-size: 14px;
    }
    .hs-tpl-v2ex-text pre {
      background: #f5f5f5;
      padding: 10px 12px;
      border-radius: 6px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .hs-tpl-v2ex-text img {
      max-width: 100%;
    }

    /* 选中内容突出 + 上下文淡化：行级结构，淡化一律用 opacity（html2canvas 兼容） */
    .hs-tpl-v2ex-dimmer .hs-tpl-v2ex-line {
      margin: 0 0 6px;
    }
    .hs-tpl-v2ex-dimmer .hs-tpl-v2ex-line p,
    .hs-tpl-v2ex-dimmer .hs-tpl-v2ex-line ul,
    .hs-tpl-v2ex-dimmer .hs-tpl-v2ex-line ol,
    .hs-tpl-v2ex-dimmer .hs-tpl-v2ex-line blockquote,
    .hs-tpl-v2ex-dimmer .hs-tpl-v2ex-line pre,
    .hs-tpl-v2ex-dimmer .hs-tpl-v2ex-line li {
      margin: 0 0 6px;
    }
    .hs-tpl-v2ex-dimmer .hs-tpl-v2ex-line p:last-child,
    .hs-tpl-v2ex-dimmer .hs-tpl-v2ex-line ul:last-child,
    .hs-tpl-v2ex-dimmer .hs-tpl-v2ex-line ol:last-child,
    .hs-tpl-v2ex-dimmer .hs-tpl-v2ex-line blockquote:last-child,
    .hs-tpl-v2ex-dimmer .hs-tpl-v2ex-line pre:last-child {
      margin-bottom: 0;
    }
    .hs-tpl-v2ex-footer {
      margin-top: 16px;
      font-size: 13px;
      color: #999;
    }

    /* 暗色主题联动（卡片外壳切换主题时，模板文字颜色跟随） */
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex {
      color: #e7e9ea;
    }
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-title {
      color: #f2f3f4;
    }
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-byline,
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-crumbs,
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-footer {
      color: #8b98a5;
    }
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-crumbs .hs-tpl-v2ex-site,
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-crumbs .hs-tpl-v2ex-node,
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-byline .hs-tpl-v2ex-author {
      color: #c6cbd1;
    }
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-divider {
      background: #3a3a3a;
    }
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-reply-name {
      color: #c6cbd1;
    }
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-reply-meta {
      color: #8b98a5;
    }
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-text {
      color: #e7e9ea;
    }
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-text a {
      color: #8b98a5;
    }
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-text blockquote {
      border-left-color: #4a4a4a;
      color: #c6cbd1;
    }
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-text pre {
      background: #3a3a3a;
    }
  `;

  // 从选区锚点定位主题容器（含 .header 与 .topic_content 的 .box）。
  // 选区落在回复区时其 .box 没有 .header，回退到页面第一个主题容器。
  function findTopicBox(anchor) {
    if (anchor && anchor.closest) {
      const near = anchor.closest('.box');
      if (near && near.querySelector('.header h1')) return near;
    }
    return document.querySelector('#Main .box') || document.querySelector('.box');
  }

  // 提取主题信息：面包屑、标题、作者、时间、点击数、是否有投票按钮
  function extractTopic(anchor) {
    const box = findTopicBox(anchor);
    if (!box) return null;
    const header = box.querySelector('.header');
    if (!header) return null;
    const titleEl = header.querySelector('h1');
    if (!titleEl) return null;

    // 面包屑：flex-one-row 内第一个链接为站点名，最后一个 /go/ 链接为节点名
    let site = 'V2EX';
    let node = '';
    const crumbBox = header.querySelector('.flex-one-row > div');
    if (crumbBox) {
      const links = Array.from(crumbBox.querySelectorAll('a'));
      const first = (links[0] && links[0].textContent || '').trim();
      if (first) site = first;
      const goLink = links.filter((a) => (a.getAttribute('href') || '').includes('/go/')).pop();
      if (goLink) node = (goLink.textContent || '').trim();
    }
    // 兜底：直接在 header 内找 /go/ 链接
    if (!node) {
      const goLink = header.querySelector('a[href*="/go/"]');
      if (goLink) node = (goLink.textContent || '').trim();
    }

    // 头像：header 内 /member/ 链接下的 avatar 图（V2EX 原站主题页右上角方图）
    let avatarUrl = '';
    const avatarImg = header.querySelector('a[href*="/member/"] img.avatar')
      || header.querySelector('a[href*="/member/"] img');
    if (avatarImg) avatarUrl = avatarImg.src;

    // 作者行：作者链接 + 时间 span[title] + 点击数文本
    let author = '';
    let timeText = '';
    let views = '';
    const gray = header.querySelector('small.gray');
    if (gray) {
      const authorLink = gray.querySelector('a[href*="/member/"]');
      if (authorLink) author = (authorLink.textContent || '').trim();
      const timeSpan = gray.querySelector('span[title]');
      timeText = timeSpan ? formatTime(timeSpan.getAttribute('title'), timeSpan.textContent) : '';
      const viewsMatch = (gray.textContent || '').match(/([\d,]+)\s*(?:views|次点击|点击)/i);
      if (viewsMatch) views = viewsMatch[1];
    }

    // 投票按钮：主题页 votes 容器（含 up/down 两个 vote 链接）
    const votes = !!header.querySelector('.votes');

    const topic = {
      site, node,
      title: (titleEl.textContent || '').trim(),
      author, avatarUrl, timeText, views, votes
    };
    console.debug('HighlightShare V2EX 模板提取结果', topic);
    return topic;
  }

  // 解析 V2EX 时间戳（"2025-09-09 16:11:15 +08:00"），按本地时区构造
  function parseV2exTime(s) {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  }

  // 优先用完整时间戳计算相对时间（与 V2EX 中文界面"23 小时 17 分钟前"一致），
  // 解析失败时退回页面显示文本
  function formatTime(titleTime, displayText) {
    const date = parseV2exTime(titleTime);
    if (!date) return (displayText || '').trim();
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours < 48) return rest > 0 ? `${hours} 小时 ${rest} 分钟前` : `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} 天前`;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 整帖正文兜底：克隆 .topic_content 内的 markdown 结构并清洗
  // （规则与选区快照 sanitize 一致：去 id/class/事件属性、链接禁用跳转、图片加 CORS）
  function cloneTopicContent(box) {
    const content = box.querySelector('.topic_content');
    if (!content) return null;
    const node = content.cloneNode(true);
    node.querySelectorAll('script, style, noscript, iframe, object, embed, form, button, input, textarea, select').forEach((el) => el.remove());
    [node, ...node.querySelectorAll('*')].forEach((el) => {
      el.removeAttribute('id');
      el.removeAttribute('class');
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.toLowerCase().startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      }
      if (el.tagName === 'A') {
        el.removeAttribute('href');
        el.removeAttribute('target');
        el.removeAttribute('rel');
        el.removeAttribute('name');
      }
      if (el.tagName === 'IMG') {
        el.setAttribute('crossorigin', 'anonymous');
        el.removeAttribute('srcset');
        el.removeAttribute('sizes');
        el.removeAttribute('loading');
      }
    });
    return node;
  }

  // ============ 选中内容突出 + 上下文淡化 ============
  // 参考 x.log 经验：淡化一律用 opacity（html2canvas 兼容）；行拆分按真实 DOM 结构，
  // V2EX 纯文本帖是"文本节点 + <br>"分隔，markdown 帖是块级元素，两种都要支持。

  // 淡化档位：离选中内容越远越淡（对照微信选中分享样式）
  const DIM_OPACITY = [0.5, 0.32, 0.18, 0.08];

  // 获取选区 Range：快照携带优先（content.js 打包），实时选区兜底
  function getDimRange(data) {
    if (data.selectionRange && data.selectionRange.startContainer && !data.selectionRange.collapsed) {
      return data.selectionRange;
    }
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        return sel.getRangeAt(0);
      }
    } catch (e) {
      // 忽略异常
    }
    return null;
  }

  // 正文容器：选区所在 reply_content / markdown_body / topic_content，兜底主题容器。
  // reply_content 在最前：选区在回帖里时优先用回帖内容做淡化，头部信息仍取自主帖
  function findBodyContainer(anchor, box) {
    if (anchor && anchor.closest) {
      const c = anchor.closest('.reply_content') || anchor.closest('.markdown_body') || anchor.closest('.topic_content');
      if (c) return c;
    }
    if (box) {
      return box.querySelector('.markdown_body') || box.querySelector('.topic_content');
    }
    return null;
  }

  // 把正文容器拆成行数组。两种结构：
  // A. 纯文本帖：直接子节点 = 文本节点 + <br>，<br> 是行分隔符
  // B. markdown 帖：直接子元素 = 块级元素（p/ul/...），一行一块
  function splitLines(container) {
    const lines = [];
    const direct = Array.from(container.childNodes);
    const hasBr = direct.some((n) => n.nodeName === 'BR');
    const hasText = direct.some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim());

    if (hasBr || (hasText && !direct.some((n) => n.nodeType === Node.ELEMENT_NODE && n.nodeName !== 'BR'))) {
      // 结构 A：按 <br> 分组成行
      let group = [];
      const flush = () => {
        if (group.length) { lines.push({ kind: 'text', nodes: group }); group = []; }
      };
      for (const node of direct) {
        if (node.nodeName === 'BR') {
          flush();
        } else {
          group.push(node);
        }
      }
      flush();
    } else {
      // 结构 B：直接子元素为行，顶层裸文本/行内节点攒成一行
      let group = [];
      const flush = () => {
        if (group.length) { lines.push({ kind: 'block', nodes: group }); group = []; }
      };
      for (const node of direct) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          flush();
          lines.push({ kind: 'block', nodes: [node] });
        } else {
          group.push(node);
        }
      }
      flush();
    }
    return lines;
  }

  // 找节点所在的行索引（端点 container 落在哪一行）
  function lineIndexOfNode(lines, node) {
    if (!node) return -1;
    for (let i = 0; i < lines.length; i++) {
      for (const n of lines[i].nodes) {
        if (n === node || (n.nodeType === Node.ELEMENT_NODE && n.contains(node))) return i;
      }
    }
    return -1;
  }

  // 计算每行状态：full（整行选中）/ partial（部分选中）/ none（上下文，淡化）
  // 算法：选区起点行与终点行之间为选中行；起点/终点落在行中间时该行为 partial
  function buildDimPlan(lines, range) {
    const startLine = lineIndexOfNode(lines, range.startContainer);
    const endLine = lineIndexOfNode(lines, range.endContainer);
    const plan = lines.map((line) => ({ line, status: 'none', opacity: 1 }));
    if (startLine < 0 || endLine < 0) return plan; // 端点不在正文行内，全部清晰

    const lo = Math.min(startLine, endLine);
    const hi = Math.max(startLine, endLine);
    for (let i = lo; i <= hi; i++) {
      const line = lines[i];
      // 单文本节点行的部分选中：端点落在行中间（偏移非 0 且非全长）
      let partial = false;
      if (line.kind === 'text' && line.nodes.length === 1 && line.nodes[0].nodeType === Node.TEXT_NODE) {
        const t = line.nodes[0];
        const len = t.data.length;
        if (range.startContainer === t && (range.startOffset > 0 || range.endContainer !== t)) partial = true;
        if (range.endContainer === t && (range.endOffset < len || range.startContainer !== t)) partial = true;
      } else {
        // 块级行：端点落在元素内部视为部分选中
        const node = line.nodes[0];
        if (node && node.nodeType === Node.ELEMENT_NODE) {
          const startIn = node.contains(range.startContainer);
          const endIn = node.contains(range.endContainer);
          const wholeStart = startIn && range.startContainer === node && range.startOffset === 0;
          const wholeEnd = endIn && range.endContainer === node && range.endOffset === node.childNodes.length;
          if ((startIn && !wholeStart) || (endIn && !wholeEnd)) partial = true;
        }
      }
      // 选中行若端点正好覆盖整行（起点在行首、终点在行尾）应为 full
      plan[i].status = partial ? 'partial' : 'full';
    }

    // 上下文淡化：按与选中行的最小距离分配档位
    for (let i = 0; i < plan.length; i++) {
      if (plan[i].status !== 'none') continue;
      let dist = Infinity;
      for (let j = lo; j <= hi; j++) dist = Math.min(dist, Math.abs(i - j));
      plan[i].opacity = DIM_OPACITY[Math.min(dist - 1, DIM_OPACITY.length - 1)] || 0.08;
    }
    return plan;
  }

  // 清洗克隆节点：去 id/class/事件属性、链接禁用跳转、图片加 CORS（与选区快照同规则）
  function sanitizeClone(root) {
    root.querySelectorAll('script, style, noscript, iframe, object, embed, form, button, input, textarea, select').forEach((el) => el.remove());
    [root, ...root.querySelectorAll('*')].forEach((el) => {
      el.removeAttribute('id');
      el.removeAttribute('class');
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.toLowerCase().startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      }
      if (el.tagName === 'A') {
        el.removeAttribute('href');
        el.removeAttribute('target');
        el.removeAttribute('rel');
        el.removeAttribute('name');
      }
      if (el.tagName === 'IMG') {
        el.setAttribute('crossorigin', 'anonymous');
        el.removeAttribute('srcset');
        el.removeAttribute('sizes');
        el.removeAttribute('loading');
      }
    });
  }

  // 选区是否落在正文容器内（端点在回复等别处时不启用淡化）
  function containerContainsRange(container, range) {
    if (!container || !range) return false;
    const root = range.commonAncestorContainer;
    return container === root || container.contains(root);
  }

  // 整行克隆渲染（上下文行 / 整行选中行共用）
  function appendClonedLine(lineEl, line) {
    if (line.kind === 'text') {
      for (const node of line.nodes) {
        lineEl.appendChild(node.cloneNode(true));
      }
    } else {
      for (const node of line.nodes) {
        const clone = node.cloneNode(true);
        sanitizeClone(clone);
        lineEl.appendChild(clone);
      }
    }
  }

  // 渲染淡化正文：选中行清晰，上下文行 opacity 递减
  function renderDimBody(container, range) {
    const lines = splitLines(container);
    const plan = buildDimPlan(lines, range);
    const wrapper = document.createElement('div');
    wrapper.className = 'hs-tpl-v2ex-dimmer';
    for (const item of plan) {
      const lineEl = document.createElement('div');
      lineEl.className = 'hs-tpl-v2ex-line';
      if (item.status === 'none') {
        appendClonedLine(lineEl, item.line);
        lineEl.style.opacity = item.opacity;
      } else if (item.status === 'full') {
        appendClonedLine(lineEl, item.line);
      } else {
        appendPartialLine(lineEl, item.line, range);
      }
      if (lineEl.childNodes.length) wrapper.appendChild(lineEl);
    }
    return wrapper;
  }

  // 部分选中行：拆成"前段淡化 + 选中段清晰 + 后段淡化"
  function appendPartialLine(lineEl, line, range) {
    if (line.kind === 'text' && line.nodes.length === 1 && line.nodes[0].nodeType === Node.TEXT_NODE) {
      // 单文本节点行：按端点偏移直接切三段（V2EX 纯文本帖最常见）
      const t = line.nodes[0];
      let s = 0;
      let e = t.data.length;
      if (range.startContainer === t) s = range.startOffset;
      if (range.endContainer === t) e = range.endOffset;
      const mk = (from, to, opacity) => {
        if (to <= from) return;
        const seg = t.cloneNode(false);
        seg.data = t.data.substring(from, to);
        const span = document.createElement('span');
        span.style.opacity = opacity;
        span.appendChild(seg);
        lineEl.appendChild(span);
      };
      mk(0, s, 0.5);
      mk(s, e, 1);
      mk(e, t.data.length, 0.5);
      return;
    }
    // 块级行：用 Range 拆三段，异常回退整行清晰
    try {
      const node = line.nodes[0];
      const r = document.createRange();
      const before = document.createDocumentFragment();
      const mid = document.createDocumentFragment();
      const after = document.createDocumentFragment();
      const startIn = node.contains(range.startContainer);
      const endIn = node.contains(range.endContainer);
      if (startIn) {
        r.setStart(node, 0);
        r.setEnd(range.startContainer, range.startOffset);
        before.appendChild(r.cloneContents());
        r.setStart(range.startContainer, range.startOffset);
        r.setEnd(node, node.childNodes.length);
        mid.appendChild(r.cloneContents());
      } else if (endIn) {
        r.setStart(node, 0);
        r.setEnd(range.endContainer, range.endOffset);
        mid.appendChild(r.cloneContents());
        r.setStart(range.endContainer, range.endOffset);
        r.setEnd(node, node.childNodes.length);
        after.appendChild(r.cloneContents());
      }
      const wrap = (frag, opacity) => {
        if (!frag.childNodes.length) return;
        const div = document.createElement('div');
        div.style.opacity = opacity;
        div.appendChild(frag);
        sanitizeClone(div);
        lineEl.appendChild(div);
      };
      wrap(before, 0.5);
      wrap(mid, 1);
      wrap(after, 0.5);
    } catch (e) {
      lineEl.innerHTML = '';
      appendClonedLine(lineEl, line);
    }
  }

  // 回帖作者信息：选区在回帖楼层时提取头像/用户名/楼层/时间（楼层 cell 结构）
  function extractReplyInfo(anchor) {
    if (!anchor || !anchor.closest) return null;
    const replyContent = anchor.closest('.reply_content');
    if (!replyContent) return null;
    const cell = replyContent.closest('.cell');
    if (!cell) return null;
    const avatarImg = cell.querySelector('img.avatar');
    const nameLink = cell.querySelector('a[href*="/member/"]');
    const agoEl = cell.querySelector('span.ago[title]');
    const noEl = cell.querySelector('span.no');
    const info = {
      avatarUrl: avatarImg ? avatarImg.src : '',
      username: nameLink ? (nameLink.textContent || '').trim() : '',
      timeText: agoEl ? formatTime(agoEl.getAttribute('title'), agoEl.textContent) : '',
      floor: noEl ? (noEl.textContent || '').trim() : ''
    };
    console.debug('HighlightShare V2EX 回帖信息提取结果', info);
    return info;
  }

  window.HighlightShareTemplates.register({
    id: 'v2ex-post',
    name: 'V2EX 帖子卡片',
    matches: ['v2ex.com'],
    css: CSS,

    /**
     * @param {Object} data 选区快照
     *   anchor 选区锚点节点（用于定位选区所在主题）
     *   richFragment 富文本片段（保留原文换行/列表/链接结构）
     *   text 纯文本兜底
     */
    render(data) {
      const topic = extractTopic(data.anchor);
      // 非主题页（首页/节点页）提取不到标题，抛异常让扩展回退默认渲染
      if (!topic || !topic.title) {
        throw new Error('未在 V2EX 主题页提取到主题信息');
      }
      const root = document.createElement('div');
      root.className = 'hs-tpl-v2ex';

      // 顶行：面包屑（左侧含站点 logo）
      const top = document.createElement('div');
      top.className = 'hs-tpl-v2ex-top';

      const crumbs = document.createElement('div');
      crumbs.className = 'hs-tpl-v2ex-crumbs';

      // 站点 logo：优先页面 192x192 icon（彩色几何狮子），兜底固定路径
      const iconLink = document.querySelector('link[rel="icon"][sizes~="192x192"]')
        || document.querySelector('link[rel="apple-touch-icon"]');
      const logo = document.createElement('img');
      logo.className = 'hs-tpl-v2ex-logo';
      logo.src = iconLink ? iconLink.href : '/static/icon-192.png';
      logo.alt = 'V2EX';
      crumbs.appendChild(logo);

      const site = document.createElement('span');
      site.className = 'hs-tpl-v2ex-site';
      site.textContent = topic.site;
      const chevron = document.createElement('span');
      chevron.className = 'hs-tpl-v2ex-chevron';
      chevron.textContent = '›';
      crumbs.appendChild(site);
      crumbs.appendChild(chevron);
      if (topic.node) {
        const node = document.createElement('span');
        node.className = 'hs-tpl-v2ex-node';
        node.textContent = topic.node;
        crumbs.appendChild(node);
      }
      top.appendChild(crumbs);
      root.appendChild(top);

      // 标题行：标题文字 + 发帖人头像并排（头像靠右，与 V2EX 原站主题页一致）
      const titleRow = document.createElement('div');
      titleRow.className = 'hs-tpl-v2ex-titlerow';
      const title = document.createElement('div');
      title.className = 'hs-tpl-v2ex-title';
      title.textContent = topic.title;
      titleRow.appendChild(title);
      if (topic.avatarUrl) {
        const avatar = document.createElement('img');
        avatar.className = 'hs-tpl-v2ex-avatar';
        avatar.src = topic.avatarUrl;
        // 不设 crossorigin：V2EX 图床按请求方 Origin 回显放行，
        // 普通加载（与页面自身头像一致）预览必显示；导出时 html2canvas
        // 的 useCORS 请求图床仍放行，可正常绘制
        avatar.alt = topic.author || 'avatar';
        titleRow.appendChild(avatar);
      }
      root.appendChild(titleRow);

      // 作者行：作者/时间/点击数（原站投票按钮不再渲染）
      const meta = document.createElement('div');
      meta.className = 'hs-tpl-v2ex-meta';
      const bylineParts = [];
      if (topic.author) {
        bylineParts.push(`<span class="hs-tpl-v2ex-author">${escapeHtml(topic.author)}</span>`);
      }
      if (topic.timeText) {
        bylineParts.push(topic.timeText);
      }
      if (topic.views) {
        bylineParts.push(`${topic.views} 次点击`);
      }
      if (bylineParts.length) {
        const byline = document.createElement('div');
        byline.className = 'hs-tpl-v2ex-byline';
        byline.innerHTML = bylineParts.join('<span class="hs-tpl-v2ex-sep">·</span>');
        meta.appendChild(byline);
      }
      root.appendChild(meta);

      // 分隔线
      const divider = document.createElement('div');
      divider.className = 'hs-tpl-v2ex-divider';
      root.appendChild(divider);

      // 回帖场景：正文上方加回帖作者信息行（头像/用户名/楼层/时间）
      const replyInfo = extractReplyInfo(data.anchor);
      if (replyInfo) {
        const rAuthor = document.createElement('div');
        rAuthor.className = 'hs-tpl-v2ex-reply-author';
        if (replyInfo.avatarUrl) {
          const rAvatar = document.createElement('img');
          rAvatar.className = 'hs-tpl-v2ex-reply-avatar';
          rAvatar.src = replyInfo.avatarUrl;
          // 同主帖头像：不设 crossorigin，普通加载保证预览显示
          rAvatar.alt = replyInfo.username || 'avatar';
          rAuthor.appendChild(rAvatar);
        }
        const rName = document.createElement('span');
        rName.className = 'hs-tpl-v2ex-reply-name';
        rName.textContent = replyInfo.username;
        rAuthor.appendChild(rName);
        const rMeta = document.createElement('span');
        rMeta.className = 'hs-tpl-v2ex-reply-meta';
        const rParts = [];
        if (replyInfo.floor) {
          rParts.push('#' + (replyInfo.floor.startsWith('#') ? replyInfo.floor.slice(1) : replyInfo.floor));
        }
        if (replyInfo.timeText) rParts.push(replyInfo.timeText);
        rMeta.textContent = rParts.join(' · ');
        rAuthor.appendChild(rMeta);
        root.appendChild(rAuthor);
      }

      // 正文：有选区且落在正文容器内时，用"选中突出 + 上下文淡化"渲染；
      // 否则退回选区富文本 / 整帖正文
      const dimRange = getDimRange(data);
      const box = findTopicBox(data.anchor);
      const bodyContainer = findBodyContainer(data.anchor, box);
      const canDim = dimRange && bodyContainer && containerContainsRange(bodyContainer, dimRange);
      if (canDim) {
        const body = document.createElement('div');
        body.className = 'hs-tpl-v2ex-text';
        body.appendChild(renderDimBody(bodyContainer, dimRange));
        root.appendChild(body);
      } else if (data.richFragment) {
        const body = document.createElement('div');
        body.className = 'hs-tpl-v2ex-text';
        body.appendChild(data.richFragment.cloneNode(true));
        root.appendChild(body);
      } else {
        const content = cloneTopicContent(box);
        if (content) {
          const body = document.createElement('div');
          body.className = 'hs-tpl-v2ex-text';
          body.appendChild(content);
          root.appendChild(body);
        } else if ((data.text || '').trim()) {
          const body = document.createElement('div');
          body.className = 'hs-tpl-v2ex-text';
          body.textContent = data.text.trim();
          root.appendChild(body);
        }
      }

      // 底部：发布时间 · 水印
      const footerParts = [];
      if (topic.timeText) footerParts.push(topic.timeText);
      footerParts.push('Made with HighlightShare');
      const footer = document.createElement('div');
      footer.className = 'hs-tpl-v2ex-footer';
      footer.textContent = footerParts.join(' · ');
      root.appendChild(footer);

      return root;
    }
  });

  // 作者名等文本来自页面，转义后以 HTML 拼接，避免破坏卡片结构
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
})();
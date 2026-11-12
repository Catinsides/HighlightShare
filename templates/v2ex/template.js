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
    .hs-tpl-v2ex-votes {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: none;
    }
    .hs-tpl-v2ex-vote {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: 1px solid #e2e2e2;
      border-radius: 5px;
      color: #999;
    }
    .hs-tpl-v2ex-vote svg {
      width: 12px;
      height: 12px;
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
    .highlight-share-card[data-style="2"] .hs-tpl-v2ex-vote {
      border-color: #4a4a4a;
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

  // 投票箭头（↑/↓，对照 V2EX 的 fa-chevron-up / fa-chevron-down）
  function createVoteIcon(direction) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', direction === 'up' ? '18 15 12 9 6 15' : '6 9 12 15 18 9');
    svg.appendChild(polyline);
    return svg;
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
      logo.crossOrigin = 'anonymous';
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
        avatar.crossOrigin = 'anonymous';
        avatar.alt = topic.author || 'avatar';
        titleRow.appendChild(avatar);
      }
      root.appendChild(titleRow);

      // 作者行：投票按钮 + 作者/时间/点击数
      const meta = document.createElement('div');
      meta.className = 'hs-tpl-v2ex-meta';
      if (topic.votes) {
        const votes = document.createElement('div');
        votes.className = 'hs-tpl-v2ex-votes';
        ['up', 'down'].forEach((dir) => {
          const btn = document.createElement('span');
          btn.className = 'hs-tpl-v2ex-vote';
          btn.appendChild(createVoteIcon(dir));
          votes.appendChild(btn);
        });
        meta.appendChild(votes);
      }
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

      // 正文：选区富文本优先（保留原换行/列表/链接），整帖正文兜底
      if (data.richFragment) {
        const body = document.createElement('div');
        body.className = 'hs-tpl-v2ex-text';
        body.appendChild(data.richFragment.cloneNode(true));
        root.appendChild(body);
      } else {
        const content = cloneTopicContent(findTopicBox(data.anchor));
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
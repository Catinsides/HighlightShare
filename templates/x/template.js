// ============ X（Twitter）站点模板 ============
// 匹配 x.com 与 twitter.com。卡片布局对照 x-cards.net 风格：
// 头像 + 显示名/@handle + X 标识，推文正文（保留原文换行与链接样式），
// 并排媒体图，时间行与互动统计。
// 提取策略：内部标记（data-testid）优先，链接形状（profile 链接 href）兜底——
// X 前端改版经常变更 testid，但页面导航链接的结构是稳定的。
(function () {
  const CSS = `
    .hs-tpl-x {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .hs-tpl-x-author {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 14px;
    }
    .hs-tpl-x-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      flex: none;
    }
    .hs-tpl-x-authorinfo {
      flex: 1;
      min-width: 0;
    }
    .hs-tpl-x-name {
      font-size: 16px;
      font-weight: 700;
      line-height: 1.45;
      color: #0f1419;
      word-break: break-word;
      /* 不用 nowrap + overflow hidden 做一行截断：
         html2canvas 重绘时对裁切边界计算不准，会把文字底部切掉 */
    }
    .hs-tpl-x-handle {
      font-size: 14px;
      line-height: 1.45;
      margin-top: 2px;
      color: #536471;
    }
    .hs-tpl-x-logo {
      width: 22px;
      height: 22px;
      flex: none;
      margin-top: 2px;
      fill: #536471;
    }
    .hs-tpl-x-text {
      font-size: 17px;
      line-height: 1.55;
      color: #0f1419;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .hs-tpl-x-text p {
      margin: 0 0 1em;
    }
    .hs-tpl-x-text p:last-child {
      margin-bottom: 0;
    }
    .hs-tpl-x-text a {
      color: #1d9bf0;
    }
    .hs-tpl-x-media {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      margin-top: 12px;
      border-radius: 16px;
      overflow: hidden;
    }
    .hs-tpl-x-media.hs-tpl-x-single {
      grid-template-columns: 1fr;
    }
    .hs-tpl-x-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .hs-tpl-x-meta {
      margin-top: 14px;
      font-size: 14px;
      color: #536471;
    }
    .hs-tpl-x-stats {
      margin-top: 10px;
      font-size: 14px;
      color: #536471;
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
    }

    /* 暗色主题联动（卡片外壳切换主题时，模板文字颜色跟随） */
    .highlight-share-card[data-style="2"] .hs-tpl-x-name,
    .highlight-share-card[data-style="2"] .hs-tpl-x-text {
      color: #e7e9ea;
    }
    .highlight-share-card[data-style="2"] .hs-tpl-x-logo,
    .highlight-share-card[data-style="2"] .hs-tpl-x-handle,
    .highlight-share-card[data-style="2"] .hs-tpl-x-meta,
    .highlight-share-card[data-style="2"] .hs-tpl-x-stats {
      color: #8b98a5;
    }
  `;

  // X 官方 logo 路径（24x24 viewBox）
  const X_LOGO_PATH = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';

  // 从选区锚点向上找到推文 article，提取作者/时间/互动/媒体
  function extractTweet(anchor, pageUrl) {
    const article = (anchor && anchor.closest ? anchor.closest('article') : null)
      || document.querySelector('article');
    if (!article) return null;

    // profile 链接（href 形如 /handle）：头像链接无文本，名字链接为显示名，handle 链接以 @ 开头
    const profileLinks = collectProfileLinks(article);

    // 显示名：User-Name 区块 → 名字链接 → 页面 meta/标题解析 → handle
    let displayName = extractNameFromUserName(article);
    const handle = profileLinks.handle || handleFromUrl(pageUrl);
    if (!displayName) {
      displayName = profileLinks.name || parseDisplayFromMeta();
    }
    displayName = cleanDisplayName(displayName);
    if (!displayName && handle) {
      displayName = '@' + handle;
    }

    const avatar = article.querySelector('img[src*="pbs.twimg.com/profile_images"]')
      || document.querySelector('img[src*="pbs.twimg.com/profile_images"]');
    const timeEl = article.querySelector('time[datetime]')
      || document.querySelector('article time[datetime]');

    // 互动统计：testid 优先，操作栏按钮数字兜底（顺序：回复、转发、喜欢）
    let replies = statOf(article, 'reply');
    let shares = statOf(article, 'retweet') || statOf(article, 'repost');
    let likes = statOf(article, 'like');
    if (!replies && !shares && !likes) {
      const nums = extractStatNumbers(article);
      replies = nums[0] || null;
      shares = nums[1] || null;
      likes = nums[2] || null;
    }

    // 媒体图：同图不同尺寸参数视为重复
    const seen = new Set();
    const images = [];
    article.querySelectorAll('img[src*="pbs.twimg.com/media"]').forEach((img) => {
      const base = img.src.split('?')[0];
      if (seen.has(base)) return;
      seen.add(base);
      images.push(img.src);
    });

    const tweet = {
      displayName,
      handle,
      avatarUrl: avatar ? avatar.src : '',
      timeText: timeEl ? formatTime(timeEl.getAttribute('datetime')) : '',
      replies,
      shares,
      likes,
      images
    };
    console.debug('HighlightShare X 模板提取结果', tweet);
    return tweet;
  }

  // 收集推文内的 profile 链接：名字链接（不以 @ 开头）与 handle 链接（@ 开头）
  function collectProfileLinks(article) {
    const result = { name: '', handle: '' };
    article.querySelectorAll('a[href^="/"]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (!/^\/[A-Za-z0-9_]{1,15}\/?$/.test(href)) return;
      const text = (a.textContent || '').trim();
      if (!text) return;
      if (!result.handle && text.startsWith('@')) {
        result.handle = text.slice(1);
      } else if (!result.name && !text.startsWith('@') && !text.includes('·')) {
        result.name = text;
      }
    });
    return result;
  }

  // User-Name 区块内第一个非 @、非时间的 span 文本（testid 存在时的最优路径）
  function extractNameFromUserName(article) {
    const nameBox = article.querySelector('[data-testid="User-Name"]');
    if (!nameBox) return '';
    for (const span of nameBox.querySelectorAll('span')) {
      const text = (span.textContent || '').trim();
      if (text && !text.startsWith('@') && !text.includes('·')) {
        return text;
      }
    }
    return '';
  }

  // 从页面 meta 或标题解析作者名
  function parseDisplayFromMeta() {
    const og = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const title = og || document.title || '';
    const patterns = [
      /^(.+?)\s+on X[:：]/,              // 英文：Name on X: "..."
      /^X 上的 (.+?)[:：]/,              // 中文：X 上的 Name： "..."
      /^(.+?)\s*\(@[A-Za-z0-9_]+\)/      // og:title 形如 "Name (@handle)"
    ];
    for (const re of patterns) {
      const m = title.match(re);
      if (m && m[1].trim()) return m[1].trim();
    }
    return '';
  }

  // 清理 meta 解析残留的界面文案前缀/后缀
  function cleanDisplayName(name) {
    return String(name || '')
      .replace(/^X 上的\s*/, '')
      .replace(/\s*on X$/, '')
      .trim();
  }

  // 从推文链接解析 handle：https://x.com/<handle>/status/<id>
  function handleFromUrl(url) {
    const m = String(url || '').match(/^https?:\/\/[^/]+\/([A-Za-z0-9_]{1,15})\/status\/\d+/);
    return m ? m[1] : '';
  }

  // 互动统计（testid；转发在部分版本叫 repost）
  function statOf(article, id) {
    const el = article.querySelector(`[data-testid="${id}"]`);
    const value = el ? (el.textContent || '').trim() : '';
    return value || null;
  }

  // 互动统计兜底：操作栏按钮内的数字，顺序为回复/转发/喜欢
  function extractStatNumbers(article) {
    const group = article.querySelector('[role="group"]');
    if (!group) return [];
    const nums = [];
    group.querySelectorAll('button').forEach((btn) => {
      const text = (btn.textContent || '').trim();
      if (text && /\d/.test(text)) {
        nums.push(text);
      }
    });
    return nums;
  }

  function formatTime(datetime) {
    const date = new Date(datetime);
    if (isNaN(date.getTime())) return '';
    const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    const day = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${time} · ${day}`;
  }

  // 选区快照内的图片地址（无推文媒体图时的回退来源）
  function collectSnapshotImages(data) {
    if (!data.richFragment) return [];
    const urls = [];
    data.richFragment.querySelectorAll('img[src]').forEach((img) => {
      const base = img.src.split('?')[0];
      if (!urls.some((u) => u.split('?')[0] === base)) urls.push(img.src);
    });
    return urls;
  }

  window.HighlightShareTemplates.register({
    id: 'x-post',
    name: 'X 帖子卡片',
    matches: ['x.com', 'twitter.com'],
    css: CSS,

    /**
     * @param {Object} data 选区快照
     *   anchor 选区锚点节点（用于定位选区所在推文）
     *   richFragment 富文本片段（保留原文换行/链接/emoji 结构）
     *   text 纯文本兜底 / imageUrl 右键图片地址
     */
    render(data) {
      const tweet = extractTweet(data.anchor, data.pageUrl);
      const root = document.createElement('div');
      root.className = 'hs-tpl-x';

      // 作者行：头像 + （显示名 / @handle 两行，与原推一致）+ X 标识
      if (tweet && (tweet.avatarUrl || tweet.displayName)) {
        const author = document.createElement('div');
        author.className = 'hs-tpl-x-author';
        if (tweet.avatarUrl) {
          const avatar = document.createElement('img');
          avatar.className = 'hs-tpl-x-avatar';
          avatar.src = tweet.avatarUrl;
          avatar.crossOrigin = 'anonymous';
          avatar.alt = 'avatar';
          author.appendChild(avatar);
        }
        const authorInfo = document.createElement('div');
        authorInfo.className = 'hs-tpl-x-authorinfo';
        if (tweet.displayName) {
          const name = document.createElement('div');
          name.className = 'hs-tpl-x-name';
          name.textContent = tweet.displayName;
          authorInfo.appendChild(name);
        }
        if (tweet.handle) {
          const handleEl = document.createElement('div');
          handleEl.className = 'hs-tpl-x-handle';
          handleEl.textContent = '@' + tweet.handle;
          authorInfo.appendChild(handleEl);
        }
        author.appendChild(authorInfo);

        const logo = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        logo.setAttribute('viewBox', '0 0 24 24');
        logo.setAttribute('class', 'hs-tpl-x-logo');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', X_LOGO_PATH);
        path.setAttribute('fill-rule', 'evenodd');
        logo.appendChild(path);
        author.appendChild(logo);
        root.appendChild(author);
      }

      // 正文：优先富文本片段（保留原文换行、链接样式与 emoji），纯文本兜底
      if (data.richFragment) {
        const body = document.createElement('div');
        body.className = 'hs-tpl-x-text';
        body.appendChild(data.richFragment.cloneNode(true));
        root.appendChild(body);
      } else if ((data.text || '').trim()) {
        const body = document.createElement('div');
        body.className = 'hs-tpl-x-text';
        body.textContent = data.text.trim();
        root.appendChild(body);
      }

      // 媒体图：优先推文内媒体图，回退选区内图片，最多 4 张
      const urls = ((tweet && tweet.images.length ? tweet.images : collectSnapshotImages(data)) || []).slice(0, 4);
      if (urls.length) {
        const media = document.createElement('div');
        media.className = 'hs-tpl-x-media' + (urls.length === 1 ? ' hs-tpl-x-single' : '');
        urls.forEach((url) => {
          const img = document.createElement('img');
          img.src = url;
          img.crossOrigin = 'anonymous';
          img.alt = 'tweet media';
          media.appendChild(img);
        });
        root.appendChild(media);
      }

      // 时间行：发布时间 · 水印
      const metaParts = [];
      if (tweet && tweet.timeText) metaParts.push(tweet.timeText);
      metaParts.push('Made with HighlightShare');
      const meta = document.createElement('div');
      meta.className = 'hs-tpl-x-meta';
      meta.textContent = metaParts.join(' · ');
      root.appendChild(meta);

      // 互动统计：replies / shares / likes
      if (tweet) {
        const stats = [['replies', tweet.replies], ['shares', tweet.shares], ['likes', tweet.likes]]
          .filter(([, value]) => value)
          .map(([label, value]) => `${value} ${label}`);
        if (stats.length) {
          const statsEl = document.createElement('div');
          statsEl.className = 'hs-tpl-x-stats';
          stats.forEach((text) => {
            const span = document.createElement('span');
            span.textContent = text;
            statsEl.appendChild(span);
          });
          root.appendChild(statsEl);
        }
      }

      return root;
    }
  });
})();

// ============ 站点模板注册表 ============
// 模板文件（templates/*/template.js）在 content.js 之后由 manifest 注入，
// 通过 window.HighlightShareTemplates.register({...}) 向注册表自注册。
// 新增模板：新建 templates/<站点>/template.js，并在 manifest.json 的
// content_scripts js 数组中追加该文件路径。

(function () {
  const templates = [];

  window.HighlightShareTemplates = {
    /**
     * 注册一个站点模板
     * @param {Object}   def
     * @param {string}   def.id       模板唯一 id
     * @param {string}   def.name     模板显示名称（工具栏按钮提示）
     * @param {string[]} def.matches  匹配的域名列表，如 ['x.com', 'twitter.com']
     * @param {Function} def.render   渲染函数：接收选区快照，返回一个 DOM 节点
     * @param {string}  [def.css]     模板样式（随内容区插入，卸载时自动移除）
     */
    register(def) {
      if (!def || typeof def !== 'object') return;
      if (!def.id || typeof def.render !== 'function' || !Array.isArray(def.matches)) {
        console.warn('HighlightShare: 模板注册不完整（需要 id、matches、render）', def && def.id);
        return;
      }
      const index = templates.findIndex((t) => t.id === def.id);
      if (index >= 0) {
        templates[index] = def;
      } else {
        templates.push(def);
      }
    },

    /** 按主机名查找模板：支持子域（x.com 匹配 mobile.x.com），未命中返回 null */
    findForHost(hostname) {
      const host = String(hostname || '').toLowerCase();
      if (!host) return null;
      return templates.find((t) => t.matches.some((pattern) => {
        const domain = String(pattern).toLowerCase();
        return host === domain || host.endsWith('.' + domain);
      })) || null;
    },

    /** 全部已注册模板（调试用） */
    list() {
      return templates.slice();
    }
  };
})();

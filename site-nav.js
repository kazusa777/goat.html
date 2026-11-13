(() => {
  'use strict';

  const owner = 'kazusa777';
  const repo = 'goat.html';
  const scriptUrl = document.currentScript?.src || new URL('./site-nav.js', location.href).href;
  const siteRoot = new URL('./', scriptUrl);
  const style = document.createElement('style');
  style.textContent = `
    .goat-nav { position: fixed; z-index: 10000; top: 14px; right: 16px; display: flex; gap: 8px; align-items: flex-start; font: 14px/1.4 system-ui, sans-serif; }
    .goat-nav a, .goat-nav button { display: inline-flex; min-height: 40px; align-items: center; justify-content: center; border: 1px solid #56627c; border-radius: 11px; padding: 0 13px; background: #151b28; color: #f3f5ff; font: inherit; text-decoration: none; cursor: pointer; box-shadow: 0 5px 18px #0004; }
    .goat-nav a:hover, .goat-nav button:hover, .goat-nav a:focus-visible, .goat-nav button:focus-visible { border-color: #aabaff; outline: none; }
    .goat-nav-panel { position: absolute; top: 48px; right: 0; display: none; width: min(340px, calc(100vw - 32px)); max-height: min(65vh, 520px); overflow: auto; padding: 8px; border: 1px solid #46516b; border-radius: 14px; background: #151b28; box-shadow: 0 12px 36px #0008; }
    .goat-nav-panel[data-open="true"] { display: block; }
    .goat-nav-panel a { display: block; min-height: 0; margin: 2px 0; padding: 10px 11px; border-color: transparent; border-radius: 8px; box-shadow: none; }
    .goat-nav-panel a:hover { background: #252f43; }
    .goat-nav-panel small { display: block; margin-top: 3px; color: #aab5cc; overflow-wrap: anywhere; }
    .goat-nav-status { padding: 12px; color: #c4cce0; }
    @media (max-width: 520px) { .goat-nav { top: 10px; right: 10px; } }
  `;
  document.head.append(style);

  const nav = document.createElement('nav');
  nav.className = 'goat-nav';
  nav.setAttribute('aria-label', '網站導覽');
  const home = document.createElement('a');
  home.href = new URL('home.html', siteRoot).href;
  home.textContent = 'Home';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = '切換頁面';
  toggle.setAttribute('aria-expanded', 'false');
  const panel = document.createElement('div');
  panel.className = 'goat-nav-panel';
  panel.setAttribute('role', 'menu');
  panel.setAttribute('data-open', 'false');
  panel.innerHTML = '<div class="goat-nav-status">正在讀取網頁清單…</div>';
  toggle.addEventListener('click', () => {
    const open = panel.dataset.open !== 'true';
    panel.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target)) {
      panel.dataset.open = 'false';
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  nav.append(home, toggle, panel);
  document.body.append(nav);

  const titleFor = path => path.split('/').pop().replace(/\.html?$/i, '').replace(/[-_]+/g, ' ') || path;
  const load = async () => {
    try {
      const base = `https://api.github.com/repos/${owner}/${encodeURIComponent(repo)}`;
      const infoResponse = await fetch(base);
      if (!infoResponse.ok) throw new Error(`GitHub API ${infoResponse.status}`);
      const info = await infoResponse.json();
      const treeResponse = await fetch(`${base}/git/trees/${encodeURIComponent(info.default_branch)}?recursive=1`);
      if (!treeResponse.ok) throw new Error(`GitHub API ${treeResponse.status}`);
      const tree = await treeResponse.json();
      const htmlFiles = (tree.tree || []).filter(item => item.type === 'blob' && /\.html?$/i.test(item.path)).sort((a, b) => a.path.localeCompare(b.path));
      panel.replaceChildren();
      for (const file of htmlFiles) {
        const link = document.createElement('a');
        link.setAttribute('role', 'menuitem');
        link.href = new URL(file.path.split('/').map(encodeURIComponent).join('/'), siteRoot).href;
        link.textContent = titleFor(file.path);
        const path = document.createElement('small');
        path.textContent = file.path;
        link.append(path);
        panel.append(link);
      }
      if (!htmlFiles.length) panel.innerHTML = '<div class="goat-nav-status">找不到 HTML 網頁。</div>';
    } catch (error) {
      panel.replaceChildren();
      const status = document.createElement('div');
      status.className = 'goat-nav-status';
      status.textContent = `網頁清單讀取失敗：${error.message}`;
      panel.append(status);
    }
  };
  load();
})();

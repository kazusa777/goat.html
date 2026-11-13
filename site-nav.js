(() => {
  'use strict';

  const owner = 'kazusa777';
  const repo = 'goat.html';
  const storageKey = 'goat-nav-state-v1';
  const scriptUrl = document.currentScript?.src || new URL('./site-nav.js', location.href).href;
  const siteRoot = new URL('./', scriptUrl);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let remembered = {};
  try {
    remembered = JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {}
  let isPinned = remembered.pinned === true;
  let movementTimer;
  let dragState = null;
  let suppressClick = false;

  const style = document.createElement('style');
  style.textContent = `
    .goat-nav { position: fixed; z-index: 10000; top: 24px; right: 16px; display: flex; gap: 10px; align-items: flex-start; font: 20px/1.4 "DFKai-SB", "BiauKai", "標楷體", KaiTi, serif; cursor: grab; user-select: none; transition: left 3.5s ease-in-out, top 3.5s ease-in-out; }
    .goat-nav.goat-nav-home { top: min(510px, calc(100vh - 60px)); }
    .goat-nav.is-pinned .goat-pin-button { background: #dfcda8; box-shadow: inset 0 0 0 2px #8c744e; }
    .goat-nav.is-dragging { z-index: 10001; cursor: grabbing; transition: none !important; }
    .goat-nav a, .goat-nav button { display: inline-flex; min-height: 52px; align-items: center; justify-content: center; border: 2px solid #302e28; border-radius: 14px; padding: 0 17px; background: #fffdf8; color: #24231f; font: inherit; text-decoration: none; cursor: pointer; box-shadow: 4px 4px 0 #dfd2b8; transition: transform .18s ease, box-shadow .18s ease, background .18s ease; }
    .goat-nav a:hover, .goat-nav button:hover, .goat-nav a:focus-visible, .goat-nav button:focus-visible { transform: translate(-2px, -2px); background: #fff; box-shadow: 6px 6px 0 #cfb88d; outline: none; }
    .goat-nav .goat-pin-button { min-width: 46px; min-height: 42px; padding: 0 10px; font: 22px/1 "Segoe UI Emoji", sans-serif; }
    .goat-nav-panel { position: absolute; top: 60px; right: 0; display: none; width: min(380px, calc(100vw - 32px)); max-height: min(65vh, 520px); overflow: auto; padding: 9px; border: 2px solid #302e28; border-radius: 16px; background: #fffdf8; box-shadow: 6px 6px 0 #dfd2b8; }
    .goat-nav-panel[data-open="true"] { display: block; }
    .goat-nav-panel a { display: block; min-height: 0; margin: 2px 0; padding: 10px 11px; border-color: transparent; border-radius: 9px; box-shadow: none; }
    .goat-nav-panel a:hover { background: #eee5d4; box-shadow: none; transform: none; }
    .goat-nav-panel small { display: block; margin-top: 3px; color: #766f62; overflow-wrap: anywhere; font-size: 15px; }
    .goat-nav-status { padding: 12px; color: #5e594f; }
    @media (max-width: 520px) { .goat-nav { gap: 6px; } .goat-nav a, .goat-nav button { min-height: 46px; padding: 0 11px; font-size: 17px; } .goat-nav .goat-pin-button { min-width: 40px; min-height: 38px; } }
    @media (prefers-reduced-motion: reduce) { .goat-nav, .goat-nav a, .goat-nav button { transition: none; } }
  `;
  document.head.append(style);

  const nav = document.createElement('nav');
  nav.className = 'goat-nav';
  const isHome = location.pathname.toLowerCase().endsWith('/home.html');
  if (isHome) nav.classList.add('goat-nav-home');
  nav.setAttribute('aria-label', '網站導覽');

  const home = document.createElement('a');
  home.href = new URL('home.html', siteRoot).href;
  home.textContent = 'Home';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = '切換頁面';
  toggle.setAttribute('aria-expanded', 'false');

  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = 'goat-pin-button';
  pin.setAttribute('aria-pressed', String(isPinned));
  pin.setAttribute('aria-label', isPinned ? '取消固定按鈕' : '固定按鈕位置');
  pin.title = isPinned ? '已固定；按一下恢復自動移動' : '固定目前位置';
  pin.textContent = isPinned ? '📍' : '📌';

  const panel = document.createElement('div');
  panel.className = 'goat-nav-panel';
  panel.setAttribute('role', 'menu');
  panel.setAttribute('data-open', 'false');
  panel.innerHTML = '<div class="goat-nav-status">正在讀取網頁清單…</div>';
  nav.append(home, toggle, pin, panel);
  document.body.append(nav);
  nav.classList.toggle('is-pinned', isPinned);

  function clamp(value, max) {
    return Math.max(12, Math.min(Number.isFinite(value) ? value : 12, Math.max(12, max)));
  }

  function saveState(left, top) {
    const rect = nav.getBoundingClientRect();
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        pinned: isPinned,
        left: Math.round(left ?? rect.left),
        top: Math.round(top ?? rect.top)
      }));
    } catch {}
  }

  function scheduleMovement() {
    clearTimeout(movementTimer);
    if (isPinned || reduceMotion.matches || dragState || panel.dataset.open === 'true') return;
    movementTimer = setTimeout(moveNavigation, 6000 + Math.random() * 2500);
  }

  function moveNavigation() {
    if (isPinned || dragState || reduceMotion.matches || panel.dataset.open === 'true') return;
    const maxLeft = window.innerWidth - nav.offsetWidth - 12;
    const maxTop = window.innerHeight - nav.offsetHeight - 12;
    const left = 12 + Math.random() * Math.max(0, maxLeft - 12);
    const top = 12 + Math.random() * Math.max(0, maxTop - 12);
    nav.style.right = 'auto';
    nav.style.transitionDuration = `${3.2 + Math.random()}s`;
    nav.style.left = `${left}px`;
    nav.style.top = `${top}px`;
    saveState(left, top);
    scheduleMovement();
  }

  const startingPosition = nav.getBoundingClientRect();
  nav.style.right = 'auto';
  nav.style.left = `${clamp(Number(remembered.left ?? startingPosition.left), window.innerWidth - nav.offsetWidth - 12)}px`;
  nav.style.top = `${clamp(Number(remembered.top ?? startingPosition.top), window.innerHeight - nav.offsetHeight - 12)}px`;
  nav.getBoundingClientRect();
  saveState();
  if (!isPinned && !reduceMotion.matches) requestAnimationFrame(moveNavigation);

  pin.addEventListener('click', () => {
    isPinned = !isPinned;
    nav.classList.toggle('is-pinned', isPinned);
    pin.textContent = isPinned ? '📍' : '📌';
    pin.setAttribute('aria-pressed', String(isPinned));
    pin.setAttribute('aria-label', isPinned ? '取消固定按鈕' : '固定按鈕位置');
    pin.title = isPinned ? '已固定；按一下恢復自動移動' : '固定目前位置';
    if (isPinned) clearTimeout(movementTimer);
    saveState();
    if (!isPinned) requestAnimationFrame(moveNavigation);
  });

  toggle.addEventListener('click', () => {
    const open = panel.dataset.open !== 'true';
    panel.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) clearTimeout(movementTimer);
    else scheduleMovement();
  });

  nav.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('.goat-nav-panel')) return;
    const rect = nav.getBoundingClientRect();
    dragState = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top, moved: false };
    clearTimeout(movementTimer);
  });

  document.addEventListener('pointermove', event => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(deltaX, deltaY) > 4) {
      dragState.moved = true;
      nav.classList.add('is-dragging');
    }
    if (!dragState.moved) return;
    event.preventDefault();
    const left = clamp(dragState.left + deltaX, window.innerWidth - nav.offsetWidth - 12);
    const top = clamp(dragState.top + deltaY, window.innerHeight - nav.offsetHeight - 12);
    nav.style.left = `${left}px`;
    nav.style.top = `${top}px`;
  });

  function finishDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const moved = dragState.moved;
    dragState = null;
    nav.classList.remove('is-dragging');
    if (moved) {
      saveState();
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    scheduleMovement();
  }
  document.addEventListener('pointerup', finishDrag);
  document.addEventListener('pointercancel', finishDrag);
  nav.addEventListener('click', event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = false;
  }, true);

  nav.addEventListener('pointerenter', () => clearTimeout(movementTimer));
  nav.addEventListener('pointerleave', scheduleMovement);
  window.addEventListener('resize', () => {
    const left = clamp(parseFloat(nav.style.left), window.innerWidth - nav.offsetWidth - 12);
    const top = clamp(parseFloat(nav.style.top), window.innerHeight - nav.offsetHeight - 12);
    nav.style.left = `${left}px`;
    nav.style.top = `${top}px`;
    saveState(left, top);
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target)) {
      panel.dataset.open = 'false';
      toggle.setAttribute('aria-expanded', 'false');
      scheduleMovement();
    }
  });

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

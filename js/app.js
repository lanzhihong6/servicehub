/**
 * ServiceHub — 主逻辑
 * 加载 config.yaml → 解析 → 渲染服务卡片 → 处理筛选/搜索
 */

(function () {
  'use strict';

  // ---- 预设图标映射（SimpleIcons CDN + emoji 回退） ----
  const ICON_PRESETS = {
    grafana:    { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/grafana.svg', color: '#F46800' },
    jenkins:    { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/jenkins.svg', color: '#D24939' },
    gitlab:     { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitlab.svg', color: '#FC6D26' },
    github:     { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/github.svg', color: '#8B949E' },
    docker:     { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/docker.svg', color: '#2496ED' },
    portainer:  { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/portainer.svg', color: '#13BEF9' },
    nginx:      { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/nginx.svg', color: '#009639' },
    mysql:      { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/mysql.svg', color: '#4479A1' },
    redis:      { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/redis.svg', color: '#DC382D' },
    postgresql: { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/postgresql.svg', color: '#4169E1' },
    mongodb:    { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/mongodb.svg', color: '#47A248' },
    elasticsearch: { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/elasticsearch.svg', color: '#005571' },
    kibana:     { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/kibana.svg', color: '#005571' },
    prometheus: { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/prometheus.svg', color: '#E6522C' },
    minio:      { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/minio.svg', color: '#C72E49' },
    nextcloud:  { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/nextcloud.svg', color: '#0082C9' },
    wordpress:  { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/wordpress.svg', color: '#21759B' },
    homeassistant: { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/homeassistant.svg', color: '#18BCF2' },
    traefik:    { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/traefikproxy.svg', color: '#24A1C1' },
    rabbitmq:   { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/rabbitmq.svg', color: '#FF6600' },
    sonarqube:  { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/sonarqube.svg', color: '#4E9BCD' },
    vault:      { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/vault.svg', color: '#FFEC6E' },
    confluence: { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/confluence.svg', color: '#172B4D' },
    jira:       { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/jira.svg', color: '#0052CC' },
    drone:      { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/drone.svg', color: '#212121' },
    gitea:      { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitea.svg', color: '#609926' },
    syncthing:  { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/syncthing.svg', color: '#0891D1' },
    plex:       { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/plex.svg', color: '#EBAF00' },
    jellyfin:   { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/jellyfin.svg', color: '#00A4DC' },
    bitwarden:  { url: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/bitwarden.svg', color: '#175DDC' },
  };

  // 分组配色方案
  const GROUP_COLORS = [
    '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981',
    '#ef4444', '#ec4899', '#3b82f6', '#14b8a6',
  ];

  // ---- 状态 ----
  let config = null;
  let activeGroup = 'all';
  let searchQuery = '';

  // ---- DOM 元素 ----
  const $ = (sel) => document.querySelector(sel);
  const groupListEl = $('#groupList');
  const cardsGridEl = $('#cardsGrid');
  const emptyStateEl = $('#emptyState');
  const searchInputEl = $('#searchInput');
  const mobileSearchInputEl = $('#mobileSearchInput');
  const pageTitleEl = $('#pageTitle');
  const pageSubtitleEl = $('#pageSubtitle');
  const totalCountEl = $('#totalCount');
  const sidebarEl = $('#sidebar');
  const overlayEl = $('#sidebarOverlay');
  const mobileTabsEl = $('#mobileTabs');
  const mobileManageBtnEl = $('#mobileManageBtn');
  const manageBtnEl = $('#manageBtn');

  // ---- 初始化 ----
  async function init() {
    try {
      const resp = await fetch('config.yaml?t=' + Date.now());
      if (!resp.ok) throw new Error('无法加载 config.yaml');
      const text = await resp.text();
      config = jsyaml.load(text);
      render();
      bindEvents();
      updateSiteInfo();
    } catch (err) {
      cardsGridEl.innerHTML = `
        <div class="empty-state" style="display:flex">
          <p style="color: #ef4444;">⚠️ 加载配置失败：${err.message}</p>
          <p style="margin-top:8px; font-size:0.82rem; color:var(--text-muted)">请确保 config.yaml 存在且格式正确</p>
        </div>`;
    }
  }

  function updateSiteInfo() {
    if (config.site?.title) {
      document.title = config.site.title;
    }
    if (config.site?.subtitle) {
      pageSubtitleEl.textContent = config.site.subtitle;
    }
    const total = getAllServices().length;
    totalCountEl.textContent = total;
  }

  function getAllServices() {
    if (!config?.groups) return [];
    return config.groups.flatMap(g => g.services || []);
  }

  // ---- 渲染 ----
  function render() {
    renderGroups();
    renderCards();
  }

  function renderGroups() {
    // 保留 "全部" 项
    const allItem = groupListEl.querySelector('[data-group="all"]');
    const countAllEl = allItem.querySelector('.group-count');
    const total = getAllServices().length;
    countAllEl.textContent = total;

    // 清除旧的分组项
    groupListEl.querySelectorAll('[data-group]:not([data-group="all"])').forEach(el => el.remove());
    if (mobileTabsEl) {
      mobileTabsEl.querySelectorAll('[data-group]:not([data-group="all"])').forEach(el => el.remove());
    }

    if (!config?.groups) return;

    config.groups.forEach((group, idx) => {
      const color = GROUP_COLORS[idx % GROUP_COLORS.length];
      const count = (group.services || []).length;

      const li = document.createElement('li');
      li.className = 'group-item';
      li.dataset.group = group.name;
      li.innerHTML = `
        <span class="group-indicator" style="background: ${color}"></span>
        <span class="group-icon">${group.icon || '📁'}</span>
        <span class="group-name">${escHtml(group.name)}</span>
        <span class="group-count">${count}</span>
      `;
      li.addEventListener('click', () => setActiveGroup(group.name));
      groupListEl.appendChild(li);

      // 移动端 Tabs
      if (mobileTabsEl) {
        const tab = document.createElement('button');
        tab.className = 'mobile-tab-item';
        tab.dataset.group = group.name;
        tab.textContent = group.name;
        tab.addEventListener('click', () => setActiveGroup(group.name));
        mobileTabsEl.appendChild(tab);
      }
    });
  }

  function renderCards() {
    cardsGridEl.innerHTML = '';
    if (!config?.groups) return;

    const groups = activeGroup === 'all'
      ? config.groups
      : config.groups.filter(g => g.name === activeGroup);

    let hasCards = false;
    const showGroupHeaders = activeGroup === 'all' && config.groups.length > 1;

    groups.forEach((group, gIdx) => {
      let services = group.services || [];

      // 搜索过滤
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        services = services.filter(s =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q) ||
          (s.tags || []).some(t => t.toLowerCase().includes(q))
        );
      }

      if (services.length === 0) return;
      hasCards = true;

      // 分组标题
      if (showGroupHeaders) {
        const colorIdx = config.groups.indexOf(group);
        const header = document.createElement('div');
        header.className = 'group-section-title';
        header.innerHTML = `
          <span class="group-section-icon">${group.icon || '📁'}</span>
          <span class="group-section-name">${escHtml(group.name)}</span>
          <span class="group-section-line"></span>
          <span class="group-section-count">${services.length} 个服务</span>
        `;
        cardsGridEl.appendChild(header);
      }

      // 卡片
      services.forEach((svc, sIdx) => {
        const card = createCardElement(svc, gIdx, sIdx);
        cardsGridEl.appendChild(card);
      });
    });

    emptyStateEl.style.display = hasCards ? 'none' : 'flex';
  }

  function createCardElement(svc, gIdx, sIdx) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.style.animationDelay = `${(gIdx * 5 + sIdx) * 0.03}s`;

    const iconHtml = buildIconHtml(svc.icon);
    const tagsHtml = (svc.tags || []).map(t =>
      `<span class="card-tag">${escHtml(t)}</span>`
    ).join('');

    const hasInternal = !!svc.internalUrl;
    const hasExternal = !!svc.externalUrl;

    card.innerHTML = `
      <div class="card-header">
        <div class="card-icon">${iconHtml}</div>
        <div class="card-info">
          <div class="card-name">${escHtml(svc.name || '未命名')}</div>
          <div class="card-description">${escHtml(svc.description || '')}</div>
        </div>
      </div>
      ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
      <div class="card-actions">
        ${hasInternal
          ? `<a class="card-btn card-btn-internal" href="${escAttr(svc.internalUrl)}" target="_blank" rel="noopener noreferrer" title="内网访问: ${escAttr(svc.internalUrl)}">
              <span class="btn-icon">🏠</span> 内网
            </a>`
          : `<span class="card-btn card-btn-internal card-btn-disabled">
              <span class="btn-icon">🏠</span> 内网
            </span>`
        }
        ${hasExternal
          ? `<a class="card-btn card-btn-external" href="${escAttr(svc.externalUrl)}" target="_blank" rel="noopener noreferrer" title="外网访问: ${escAttr(svc.externalUrl)}">
              <span class="btn-icon">🌐</span> 外网
            </a>`
          : `<span class="card-btn card-btn-external card-btn-disabled">
              <span class="btn-icon">🌐</span> 外网
            </span>`
        }
      </div>
    `;
    return card;
  }

  function buildIconHtml(icon) {
    if (!icon) {
      return `<span class="card-icon-emoji">🔧</span>`;
    }

    // 预设图标名
    const preset = ICON_PRESETS[icon.toLowerCase()];
    if (preset) {
      return `<img src="${preset.url}" alt="${icon}" style="filter: brightness(0) saturate(100%); opacity: 0.9;"
              onerror="this.parentElement.innerHTML='<span class=\\'card-icon-emoji\\'>🔧</span>'"
              data-color="${preset.color}">`;
    }

    // URL（http/https）
    if (icon.startsWith('http://') || icon.startsWith('https://')) {
      return `<img src="${escAttr(icon)}" alt="icon"
              onerror="this.parentElement.innerHTML='<span class=\\'card-icon-emoji\\'>🔧</span>'">`;
    }

    // emoji 或其他文字
    return `<span class="card-icon-emoji">${escHtml(icon)}</span>`;
  }

  // ---- 分组切换 ----
  function setActiveGroup(name) {
    activeGroup = name;

    groupListEl.querySelectorAll('.group-item').forEach(el => {
      el.classList.toggle('active', el.dataset.group === name);
    });
    if (mobileTabsEl) {
      mobileTabsEl.querySelectorAll('.mobile-tab-item').forEach(el => {
        el.classList.toggle('active', el.dataset.group === name);
      });
    }

    const group = config.groups.find(g => g.name === name);
    pageTitleEl.textContent = name === 'all' ? '全部服务' : name;

    renderCards();
  }

  // ---- 搜索 ----
  function handleSearch(e) {
    searchQuery = e.target.value.trim();
    renderCards();
  }

  // ---- 事件绑定 ----
  function bindEvents() {
    // "全部" 按钮
    groupListEl.querySelector('[data-group="all"]')
      .addEventListener('click', () => setActiveGroup('all'));

    // 搜索输入
    searchInputEl.addEventListener('input', debounce(handleSearch, 200));
    if (mobileSearchInputEl) {
      mobileSearchInputEl.addEventListener('input', debounce(handleSearch, 200));
    }

    // 键盘快捷键：/ 聚焦搜索，Esc 关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInputEl && document.activeElement !== mobileSearchInputEl) {
        e.preventDefault();
        // 如果移动端搜索框可见则聚焦移动端，否则桌面端
        if (mobileSearchInputEl && window.innerWidth <= 768) {
          mobileSearchInputEl.focus();
        } else {
          searchInputEl.focus();
        }
      }
      if (e.key === 'Escape') {
        searchInputEl.blur();
        searchInputEl.value = '';
        if (mobileSearchInputEl) {
            mobileSearchInputEl.blur();
            mobileSearchInputEl.value = '';
        }
        searchQuery = '';
        renderCards();
      }
    });

    if (mobileManageBtnEl && manageBtnEl) {
      mobileManageBtnEl.addEventListener('click', () => {
        manageBtnEl.click();
      });
    }
  }

  // ---- 工具函数 ----
  function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // ---- 启动 ----
  init();
})();

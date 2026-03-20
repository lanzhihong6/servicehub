/**
 * ServiceHub — 配置编辑器
 * 表单式管理分组和服务
 */

(function () {
  'use strict';

  // ---- DOM ----
  const overlay = document.getElementById('editorOverlay');
  const modal = document.getElementById('editorModal');
  const closeBtn = document.getElementById('editorClose');
  const cancelBtn = document.getElementById('editorCancel');
  const saveBtn = document.getElementById('editorSave');
  const addGroupBtn = document.getElementById('addGroupBtn');
  const groupsContainer = document.getElementById('groupsContainer');
  const siteTitleInput = document.getElementById('siteTitle');
  const siteSubtitleInput = document.getElementById('siteSubtitle');
  const manageBtn = document.getElementById('manageBtn');

  let editData = null; // 当前编辑的整体配置数据副本

  // ---- 打开 / 关闭 ----
  function open() {
    // 从当前 config.yaml 获取最新数据
    fetch('/api/config')
      .then(r => r.json())
      .then(res => {
        if (!res.ok) throw new Error(res.error);
        editData = jsyaml.load(res.content) || {};
        if (!editData.site) editData.site = {};
        if (!editData.groups) editData.groups = [];
        populateForm();
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
      })
      .catch(err => alert('加载配置失败: ' + err.message));
  }

  function close() {
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    editData = null;
  }

  // ---- 填充表单 ----
  function populateForm() {
    siteTitleInput.value = editData.site.title || '';
    siteSubtitleInput.value = editData.site.subtitle || '';
    renderGroupForms();
  }

  function renderGroupForms() {
    groupsContainer.innerHTML = '';
    editData.groups.forEach((group, gIdx) => {
      groupsContainer.appendChild(createGroupBlock(group, gIdx));
    });
  }

  // ---- 分组块 ----
  function createGroupBlock(group, gIdx) {
    const block = document.createElement('div');
    block.className = 'group-block';
    block.dataset.gidx = gIdx;

    block.innerHTML = `
      <div class="group-block-header">
        <div class="group-block-drag" title="拖拽排序">⠿</div>
        <input type="text" class="group-name-input" value="${esc(group.name || '')}" placeholder="分组名称">
        <input type="text" class="group-icon-input" value="${esc(group.icon || '')}" placeholder="图标 emoji">
        <button class="btn-icon-sm btn-collapse" title="展开/收起">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <button class="btn-icon-sm btn-delete-group" title="删除分组">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
      <div class="group-block-body">
        <div class="services-list" data-gidx="${gIdx}"></div>
        <button class="btn-add-service" data-gidx="${gIdx}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          添加服务
        </button>
      </div>
    `;

    // 绑定事件
    const collapseBtn = block.querySelector('.btn-collapse');
    const body = block.querySelector('.group-block-body');
    collapseBtn.addEventListener('click', () => {
      block.classList.toggle('collapsed');
    });

    block.querySelector('.btn-delete-group').addEventListener('click', () => {
      if (confirm(`确定删除分组「${group.name || '未命名'}」及其所有服务？`)) {
        editData.groups.splice(gIdx, 1);
        renderGroupForms();
      }
    });

    block.querySelector('.group-name-input').addEventListener('input', (e) => {
      editData.groups[gIdx].name = e.target.value;
    });

    block.querySelector('.group-icon-input').addEventListener('input', (e) => {
      editData.groups[gIdx].icon = e.target.value;
    });

    block.querySelector('.btn-add-service').addEventListener('click', () => {
      if (!editData.groups[gIdx].services) editData.groups[gIdx].services = [];
      editData.groups[gIdx].services.push({
        name: '', icon: '', description: '',
        tags: [], internalUrl: '', externalUrl: '',
      });
      renderGroupForms();
      // 滚动到新添加的区域
      setTimeout(() => {
        const lastSvc = groupsContainer.querySelectorAll(`.group-block[data-gidx="${gIdx}"] .service-item`);
        if (lastSvc.length) lastSvc[lastSvc.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    });

    // 渲染服务列表
    const servicesList = block.querySelector('.services-list');
    (group.services || []).forEach((svc, sIdx) => {
      servicesList.appendChild(createServiceItem(svc, gIdx, sIdx));
    });

    return block;
  }

  // ---- 服务条目 ----
  function createServiceItem(svc, gIdx, sIdx) {
    const item = document.createElement('div');
    item.className = 'service-item';

    item.innerHTML = `
      <div class="service-item-header">
        <span class="service-item-num">${sIdx + 1}</span>
        <input type="text" class="svc-name" value="${esc(svc.name || '')}" placeholder="服务名称">
        <button class="btn-icon-sm btn-delete-svc" title="删除服务">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="service-item-body">
        <div class="form-row">
          <div class="form-group">
            <label>图标</label>
            <input type="text" class="svc-icon" value="${esc(svc.icon || '')}" placeholder="预设名 / emoji / URL">
          </div>
          <div class="form-group">
            <label>描述</label>
            <input type="text" class="svc-desc" value="${esc(svc.description || '')}" placeholder="一句话描述">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>🏠 内网地址</label>
            <input type="text" class="svc-internal" value="${esc(svc.internalUrl || '')}" placeholder="http://100.64.x.x:port">
          </div>
          <div class="form-group">
            <label>🌐 外网地址</label>
            <input type="text" class="svc-external" value="${esc(svc.externalUrl || '')}" placeholder="https://xxx.example.com">
          </div>
        </div>
        <div class="form-group">
          <label>标签</label>
          <input type="text" class="svc-tags" value="${esc((svc.tags || []).join(', '))}" placeholder="逗号分隔，如：监控, 运维">
        </div>
      </div>
    `;

    // 双向绑定
    const bind = (sel, key, transform) => {
      item.querySelector(sel).addEventListener('input', (e) => {
        const val = transform ? transform(e.target.value) : e.target.value;
        editData.groups[gIdx].services[sIdx][key] = val;
      });
    };

    bind('.svc-name', 'name');
    bind('.svc-icon', 'icon');
    bind('.svc-desc', 'description');
    bind('.svc-internal', 'internalUrl');
    bind('.svc-external', 'externalUrl');
    bind('.svc-tags', 'tags', v => v.split(/[,，]/).map(s => s.trim()).filter(Boolean));

    item.querySelector('.btn-delete-svc').addEventListener('click', () => {
      editData.groups[gIdx].services.splice(sIdx, 1);
      renderGroupForms();
    });

    return item;
  }

  // ---- 保存 ----
  async function save() {
    // 收集站点信息
    editData.site.title = siteTitleInput.value.trim() || 'ServiceHub';
    editData.site.subtitle = siteSubtitleInput.value.trim();

    // 清理空数据
    editData.groups.forEach(g => {
      if (g.services) {
        g.services = g.services.filter(s => s.name); // 去掉没名字的
        g.services.forEach(s => {
          // 清理空字段
          if (!s.internalUrl) delete s.internalUrl;
          if (!s.externalUrl) delete s.externalUrl;
          if (!s.description) delete s.description;
          if (!s.icon) delete s.icon;
          if (!s.tags || s.tags.length === 0) delete s.tags;
        });
      }
    });
    editData.groups = editData.groups.filter(g => g.name); // 去掉没名字的分组

    const yamlStr = jsyaml.dump(editData, { lineWidth: -1, quotingType: '"', forceQuotes: false });

    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';

    try {
      const resp = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: yamlStr }),
      });
      const result = await resp.json();
      if (!result.ok) throw new Error(result.error);

      close();
      // 刷新面板
      location.reload();
    } catch (err) {
      alert('保存失败: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        保存配置`;
    }
  }

  // ---- 事件绑定 ----
  manageBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  saveBtn.addEventListener('click', save);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  addGroupBtn.addEventListener('click', () => {
    editData.groups.push({ name: '', icon: '📁', services: [] });
    renderGroupForms();
    // 滚动到底部
    setTimeout(() => {
      const blocks = groupsContainer.querySelectorAll('.group-block');
      if (blocks.length) blocks[blocks.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  });

  // Esc 关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('show')) {
      close();
    }
  });

  // ---- 工具 ----
  function esc(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();

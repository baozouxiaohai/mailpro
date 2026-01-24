// 移动端初始化逻辑拆分
(function () {
  try {
    if (!(window.matchMedia && window.matchMedia('(max-width: 900px)').matches)) return;
    try { document.body.classList.add('is-mobile'); } catch (_) { }
    const els = {
      sidebar: document.querySelector('.sidebar'),
      container: document.querySelector('.container'),
      main: document.querySelector('.main'),
    };
    // 隐藏主侧栏开关
    try { const st = document.getElementById('sidebar-toggle'); if (st) st.style.display = 'none'; } catch (_) { }
    // 生成/配置布局——移动端配置常显、生成按钮吸底（移除配置折叠切换）
    try {
      const cfg = document.querySelector('.mailbox-config-section');
      const cfgHeader = cfg ? cfg.querySelector('.section-header') : null;
      const cfgBtn = document.getElementById('config-toggle');
      if (cfg && cfgHeader) {
        cfg.classList.remove('collapsed');
        // 隐藏切换按钮并禁用点击折叠
        try { if (cfgBtn) cfgBtn.style.display = 'none'; } catch (_) { }
        try { if (cfgHeader) cfgHeader.style.cursor = 'default'; } catch (_) { }
        try {
          const ga = document.querySelector('.generate-action');
          if (ga) { ga.style.position = 'sticky'; ga.style.bottom = '8px'; }
        } catch (_) { }
      }
    } catch (_) { }
    // 历史邮箱：移动端不需要折叠，强制展开并隐藏折叠按钮
    try {
      const sidebar = document.querySelector('.sidebar');
      const header = sidebar ? sidebar.querySelector('.sidebar-header') : null;
      const btn = document.getElementById('mb-toggle');
      if (sidebar) { sidebar.classList.remove('list-collapsed'); }
      if (btn) { btn.style.display = 'none'; }
      if (header) { header.style.cursor = 'default'; }
    } catch (_) { }

    // 顶部主功能切换：历史邮箱 / 生成邮箱（仅移动端）
    try {
      var setupMainSwitch = function () {
        // 已存在则不重复创建
        if (document.getElementById('mobile-main-switch')) return true;
        var mainEl = document.querySelector('.main');
        if (!mainEl) return false;

        var switchWrap = document.createElement('div');
        switchWrap.className = 'view-switch';
        switchWrap.id = 'mobile-main-switch';
        switchWrap.style.margin = '6px 0 10px 0';
        switchWrap.innerHTML = '<button id="m-tab-generate" class="seg-btn" aria-pressed="true">生成邮箱</button><button id="m-tab-history" class="seg-btn" aria-pressed="false">历史邮箱</button>';
        mainEl.prepend(switchWrap);


        var tabGen = document.getElementById('m-tab-generate');
        var tabHis = document.getElementById('m-tab-history');
        var genCard = document.querySelector('.generate-card');
        var inboxCard = document.getElementById('list-card');
        var sidebarEl = document.querySelector('.sidebar');
        var enterBtn = null;
        var lastMainView = 'gen';
        var mailActionsWrap = null;

        var showGen = function () {
          if (tabGen) tabGen.setAttribute('aria-pressed', 'true');
          if (tabHis) tabHis.setAttribute('aria-pressed', 'false');
          if (genCard) genCard.style.display = '';
          if (inboxCard) inboxCard.style.display = 'none';
          if (sidebarEl) { sidebarEl.style.display = 'none'; try { sidebarEl.classList.remove('history-inline'); sidebarEl.classList.remove('list-collapsed'); } catch (_) { } }
          if (switchWrap) switchWrap.style.display = '';
          lastMainView = 'gen';
          // 仅在非首页直达时更新锚点；避免首页首次访问被强制设为 #gen
          try { if (location.hash && location.hash !== '#generate') { history.replaceState({ mfView: 'generate' }, '', '#generate'); } } catch (_) { }
          // 生成页：仅展示复制与“进入邮箱”，隐藏发送/清空/刷新
          try {
            var btnCopy = document.getElementById('copy');
            var btnCompose = document.getElementById('compose');
            var btnClear = document.getElementById('clear');
            var btnRefresh = document.getElementById('refresh');
            if (btnCompose) btnCompose.style.display = 'none';
            if (btnClear) btnClear.style.display = 'none';
            if (btnRefresh) btnRefresh.style.display = 'none';
            // 移除顶部刷新图标（若存在）
            try { var mri = document.getElementById('m-refresh-icon'); if (mri) mri.remove(); } catch (_) { }
            // 显示或创建“进入邮箱”按钮
            var actions = document.getElementById('email-actions');
            var existingEnter = document.getElementById('enter-mailbox');
            if (!existingEnter && genCard && actions) {
              existingEnter = document.createElement('button');
              existingEnter.id = 'enter-mailbox';
              existingEnter.className = 'btn btn-primary';
              existingEnter.style.width = '100%';
              existingEnter.style.marginTop = '0';
              existingEnter.innerHTML = '<span class="btn-icon">📬</span><span>进入邮箱</span>';
              actions.appendChild(existingEnter);
              existingEnter.onclick = function () {
                try {
                  // 无邮箱时提示，而不是进入
                  if (!window.currentMailbox) {
                    try { window.showToast && window.showToast('请先生成或选择一个邮箱', 'warn'); } catch (_) { }
                    return;
                  }
                  showMailboxView();
                } catch (_) { }
              };
            }
            if (existingEnter) existingEnter.style.display = '';
            if (btnCopy) btnCopy.style.display = '';
          } catch (_) { }
          try { sessionStorage.setItem('mf:m:mainTab', 'gen'); } catch (_) { }
        };
        var showHis = function () {
          if (tabGen) tabGen.setAttribute('aria-pressed', 'false');
          if (tabHis) tabHis.setAttribute('aria-pressed', 'true');
          if (genCard) genCard.style.display = 'none';
          // 移动端“历史邮箱”显示侧栏列表到主区域下方，而非显示收件箱卡片
          if (inboxCard) inboxCard.style.display = 'none';
          try { var mainWrap = document.querySelector('.main'); if (mainWrap && sidebarEl) { mainWrap.appendChild(sidebarEl); } } catch (_) { }
          if (sidebarEl) { sidebarEl.style.display = ''; try { sidebarEl.classList.add('history-inline'); sidebarEl.classList.remove('collapsed'); sidebarEl.classList.remove('list-collapsed'); } catch (_) { } }
          if (switchWrap) switchWrap.style.display = '';
          lastMainView = 'his';
          try { if (location.hash !== '#history') { history.replaceState({ mfView: 'history' }, '', '#history'); } } catch (_) { }
          try { sessionStorage.setItem('mf:m:mainTab', 'his'); } catch (_) { }
        };
        // 二级页：全屏展示收件/发件箱
        var showMailboxView = function () {
          try { sessionStorage.setItem('mf:m:lastMain', lastMainView); } catch (_) { }
          try { sessionStorage.setItem('mf:m:mainTab', 'mail'); } catch (_) { }
          if (genCard) genCard.style.display = 'none';
          if (sidebarEl) sidebarEl.style.display = 'none';
          if (inboxCard) inboxCard.style.display = '';
          if (switchWrap) switchWrap.style.display = 'none';
          // 确保选中“收件箱”标签为默认
          try { var ti = document.getElementById('tab-inbox'), ts = document.getElementById('tab-sent'); if (ti) { ti.setAttribute('aria-pressed', 'true'); } if (ts) { ts.setAttribute('aria-pressed', 'false'); } } catch (_) { }
          // 为浏览器“返回”建立历史记录，并更新锚点
          try { history.pushState({ mfView: 'inbox' }, '', '#inbox'); } catch (_) { }

          // 移动操作按钮到二级页：显示 发送/清空/刷新，隐藏复制与进入
          try {
            var actions = document.getElementById('email-actions');
            if (actions) {
              var btnCopy = document.getElementById('copy');
              var btnCompose = document.getElementById('compose');
              var btnClear = document.getElementById('clear');
              var btnRefresh = document.getElementById('refresh');
              // 隐藏进入按钮
              try { var enter = document.getElementById('enter-mailbox'); if (enter) enter.style.display = 'none'; } catch (_) { }
              // 在标题右侧放置"切换邮箱"按钮和刷新按钮（移动端）
              try {
                var header = inboxCard ? inboxCard.querySelector('.listcard-header') : null;
                if (header) {
                  // 添加"切换邮箱"按钮
                  var existingSwitch = document.getElementById('m-switch-mailbox');
                  if (!existingSwitch) {
                    var switchBtn = document.createElement('button');
                    switchBtn.id = 'm-switch-mailbox';
                    switchBtn.className = 'btn btn-secondary btn-sm';
                    switchBtn.title = '切换邮箱';
                    switchBtn.style.display = 'inline-flex';
                    switchBtn.style.alignItems = 'center';
                    switchBtn.style.justifyContent = 'center';
                    switchBtn.style.padding = '6px 12px';
                    switchBtn.style.marginLeft = 'auto';
                    switchBtn.innerHTML = '<span class="btn-icon" style="margin:0 4px 0 0">📨</span><span>切换</span>';
                    header.appendChild(switchBtn);
                    switchBtn.onclick = function (e) {
                      try {
                        e.preventDefault(); e.stopPropagation();
                        showHis();
                      } catch (_) { }
                    };
                  }
                  // 添加刷新按钮
                  var existing = document.getElementById('m-refresh-icon');
                  if (!existing) {
                    var iconBtn = document.createElement('button');
                    iconBtn.id = 'm-refresh-icon';
                    iconBtn.className = 'btn btn-ghost btn-sm';
                    iconBtn.title = '刷新';
                    iconBtn.style.width = '34px';
                    iconBtn.style.height = '34px';
                    iconBtn.style.display = 'inline-flex';
                    iconBtn.style.alignItems = 'center';
                    iconBtn.style.justifyContent = 'center';
                    iconBtn.style.padding = '0';
                    iconBtn.innerHTML = '<span class="btn-icon" style="margin:0">🔄</span>';
                    header.appendChild(iconBtn);
                    iconBtn.onclick = function (e) {
                      try {
                        e.preventDefault(); e.stopPropagation();
                        var ll = document.getElementById('list-loading');
                        if (ll) ll.style.display = 'inline-flex';
                        if (typeof window.refreshEmails === 'function') { window.refreshEmails().finally(function () { try { if (ll) ll.style.display = 'none'; } catch (_) { } }); }
                        else if (typeof refresh === 'function') { refresh(); }
                      } catch (_) { }
                    };
                  }
                }
              } catch (_) { }
              if (!mailActionsWrap) {
                mailActionsWrap = document.getElementById('mail-actions-mobile');
                if (!mailActionsWrap) {
                  mailActionsWrap = document.createElement('div');
                  mailActionsWrap.id = 'mail-actions-mobile';
                  mailActionsWrap.className = 'mail-actions-mobile';
                  // 插入到 list-card 的头部下方
                  try { var header = inboxCard ? inboxCard.querySelector('.listcard-header') : null; if (header && header.parentNode) { header.parentNode.insertBefore(mailActionsWrap, header.nextSibling); } } catch (_) { }
                }
              }
              if (btnCompose) mailActionsWrap.appendChild(btnCompose);
              if (btnClear) mailActionsWrap.appendChild(btnClear);
              // 移动视图不再在下方显示刷新按钮，统一使用右上角图标
              if (btnRefresh) btnRefresh.style.display = 'none';
              if (btnCopy) btnCopy.style.display = 'none';
              try { var enter = document.getElementById('enter-mailbox'); if (enter) enter.style.display = 'none'; } catch (_) { }
              if (btnCompose) btnCompose.style.display = '';
              if (btnClear) btnClear.style.display = '';
              // 刷新按钮隐藏（仅保留右上角图标）
            }
          } catch (_) { }
        };

        // 监听浏览器返回：从二级页返回一级页，并根据锚点恢复
        try {
          window.addEventListener('popstate', function () {
            try {
              var curHash = (location.hash || '').replace('#', '');
              if (curHash === 'inbox' || curHash === 'sent') {
                // 保持在二级页。
                return;
              }
              var cur = sessionStorage.getItem('mf:m:mainTab');
              if (cur === 'inbox' || cur === 'sent' || curHash === 'generate' || curHash === 'history') {
                var prev = sessionStorage.getItem('mf:m:lastMain') || 'generate';
                if (curHash === 'history' || prev === 'history') showHis(); else showGen();
              }
            } catch (_) { }
          });
        } catch (_) { }

        // 历史邮箱列表点击时，自动进入二级页
        try {
          var mbList = document.getElementById('mb-list');
          if (mbList) { mbList.addEventListener('click', function () { setTimeout(function () { try { showMailboxView(); } catch (_) { } }, 0); }, true); }
        } catch (_) { }
        if (tabGen) tabGen.onclick = showGen;
        if (tabHis) tabHis.onclick = showHis;
        // 恢复上次选择或根据锚点恢复（默认显示生成）
        try {
          var last = sessionStorage.getItem('mf:m:mainTab');
          var hash = (location.hash || '').replace('#', '');
          // 优先检查保存的hash（用于刷新恢复）
          if (!hash) {
            try {
              var preservedHash = sessionStorage.getItem('mf:preservedHash');
              if (preservedHash) hash = preservedHash.replace('#', '');
            } catch (_) { }
          }

          if (hash === 'history') showHis();
          else if (hash === 'inbox' || hash === 'sent') {
            // 路由明确指定 inbox/sent 时，直接显示邮箱视图，不检查 currentMailbox
            // 因为 currentMailbox 在刷新后会丢失，但用户明确要访问邮箱页面
            showMailboxView();
          }
          else if (hash === 'generate') showGen();
          else if (last === 'history') showHis();
          else if (last === 'inbox' || last === 'sent') {
            // 对于恢复的会话，如果没有当前邮箱，回到生成页面是合理的
            if (window.currentMailbox) showMailboxView(); else showGen();
          }
          // 默认显示生成页面
          else showGen();
        } catch (_) { showGen(); }
        return true;
      };

      // 立即尝试，若未就绪则观察 DOM 直到可用
      if (!setupMainSwitch()) {
        var __mf_mo = new MutationObserver(function () { if (setupMainSwitch()) { try { __mf_mo.disconnect(); } catch (_) { } } });
        try { __mf_mo.observe(document.body || document.documentElement, { childList: true, subtree: true }); } catch (_) { }
        // 兜底：页面 load 后或一定延时再尝试一次
        try { window.addEventListener('load', function () { setupMainSwitch(); }, { once: true }); } catch (_) { }
        try { setTimeout(function () { setupMainSwitch(); }, 1200); } catch (_) { }
      }
    } catch (_) { }
  } catch (_) { }
})();



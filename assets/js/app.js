/* App shell: router, navigation, login, notifications, live platform sync */
window.App = (function () {
  const { L, N, esc, icon, icons, avatar, ago, toast } = UI;
  const pages = {};
  let current = { page: null, params: [] };
  let syncTimer = null;

  const NAV = [
    { group: ['الرئيسية', 'Overview'], items: [['dashboard', 'لوحة التحكم', 'Dashboard', 'layout-dashboard']] },
    { group: ['العمليات اليومية', 'Daily operations'], items: [['bookings', 'الحجوزات', 'Bookings', 'calendar-check-2'], ['patients', 'المرضى', 'Patients', 'users'], ['records', 'التقارير الطبية', 'Medical records', 'file-heart'], ['prescriptions', 'الروشتات', 'Prescriptions', 'file-text'], ['lab', 'المعمل', 'Laboratory', 'flask-conical']] },
    { group: ['الإدارة الطبية', 'Medical setup'], items: [['departments', 'الأقسام والعيادات', 'Departments', 'building-2'], ['doctors', 'الأطباء', 'Doctors', 'stethoscope'], ['shifts', 'الشيفتات', 'Shifts', 'clock-3'], ['services', 'الخدمات والأسعار', 'Services & prices', 'list-checks'], ['packages', 'الباقات', 'Packages', 'package'], ['insurance', 'شركات التأمين', 'Insurance', 'shield-plus']] },
    { group: ['المخزون والمبيعات', 'Inventory & sales'], items: [['inventory', 'المخزون والمنتجات', 'Inventory', 'boxes'], ['sales', 'المبيعات والفواتير', 'Sales & invoices', 'receipt-text'], ['finance', 'المالية', 'Finance', 'wallet']] },
    { group: ['التقارير والأداء', 'Reports & performance'], items: [['performance', 'أداء الأطباء', 'Doctor performance', 'trophy'], ['reports', 'مركز التقارير', 'Report center', 'chart-column']] },
    { group: ['النظام', 'System'], items: [['integrations', 'ربط المنصات', 'Platform integrations', 'plug-zap'], ['logs', 'سجل العمليات', 'Activity logs', 'history'], ['users', 'المستخدمين والصلاحيات', 'Users & permissions', 'user-cog'], ['settings', 'الإعدادات', 'Settings', 'settings']] }
  ];

  function theme(t) {
    if (t) { try { localStorage.setItem('nabd_theme', t); } catch (e) { } }
    let v = 'light'; try { v = localStorage.getItem('nabd_theme') || 'light'; } catch (e) { }
    document.documentElement.setAttribute('data-theme', v); return v;
  }

  function parse() {
    const h = (location.hash || '#/dashboard').replace(/^#\/?/, '');
    const [page, ...params] = h.split('/').map(decodeURIComponent);
    return { page: page || 'dashboard', params };
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  function render() {
    UI.destroyCharts();
    const root = document.getElementById('root');
    if (!Store.me()) { stopSync(); renderLogin(root); return; }
    current = parse();
    if (!pages[current.page]) current = { page: 'dashboard', params: [] };
    if (!Store.can(current.page)) { current = { page: 'dashboard', params: [] }; }
    if (!root.querySelector('.app')) renderShell(root);
    renderNav();
    const el = document.getElementById('content');
    el.innerHTML = '';
    try { pages[current.page].render(el, current.params); }
    catch (e) { console.error(e); el.innerHTML = `<div class="card card-body">${L('حدث خطأ في عرض الصفحة', 'Something went wrong rendering this page')}<pre class="pre">${esc(e.stack || e)}</pre></div>`; }
    icons(el);
    document.querySelector('.app').classList.remove('nav-open');
    window.scrollTo(0, 0);
    startSync();
  }
  // re-render the current page in place (no scroll jump) — used after live events / actions
  function refresh() {
    if (!Store.me() || document.querySelector('.modal-root')) { renderNav(); updateBell(); return; }
    const y = window.scrollY; UI.destroyCharts();
    const el = document.getElementById('content'); el.innerHTML = '';
    try { pages[current.page].render(el, current.params); } catch (e) { console.error(e); }
    icons(el); renderNav(); updateBell(); window.scrollTo(0, y);
  }

  function counts() {
    const db = Store.db; const today = UI.isoDay(new Date());
    const waiting = Store.appointments().filter(a => UI.sameDay(a.start, today) && ['pending', 'confirmed', 'arrived'].includes(a.status)).length;
    const low = db.products.filter(p => p.qty <= p.min).length;
    const unpaid = db.invoices.filter(i => i.status !== 'paid').length;
    return { bookings: waiting, inventory: low, sales: unpaid };
  }

  function renderShell(root) {
    const u = Store.me(); const db = Store.db;
    root.innerHTML = `
    <div class="app">
      <div class="backdrop" id="backdrop"></div>
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">${icon('activity')}</div><div><div class="brand-name">${L('نبض', 'Nabd')} <span class="muted" style="font-weight:500">HMS</span></div><div class="brand-sub">${L('نظام إدارة المستشفيات', 'Hospital Management System')}</div></div></div>
        <div class="hospital-chip"><span class="dot"></span><div class="grow"><div style="font-weight:600;font-size:13px">${esc(N(db.hospital.name))}</div><div class="xs muted">${esc(Store.isDoctor() ? N(Store.get.dept(Store.get.doctor(u.doctorId).dept).name) : L('جميع الفروع والعيادات', 'All branches & clinics'))}</div></div></div>
        <nav class="nav" id="nav"></nav>
        <div class="sidebar-foot"><div class="row">${avatar(u.name)}<div class="grow"><div style="font-weight:600;font-size:13px">${esc(N(u.name))}</div><div class="xs muted">${esc(N(Store.role().name))}</div></div><button class="btn ghost icon sm" id="logoutBtn" title="${L('تسجيل الخروج', 'Sign out')}">${icon('log-out')}</button></div></div>
      </aside>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn menu-toggle" id="menuBtn" aria-label="menu">${icon('menu')}</button>
          <div class="search"><span>${icon('search')}</span><input id="gsearch" placeholder="${L('ابحث عن مريض بالاسم أو الرقم أو الهاتف...', 'Search patient by name, ID or phone...')}" autocomplete="off"><div class="search-results hidden" id="gresults"></div></div>
          <div class="grow"></div>
          <div class="sync-pill" title="${L('المزامنة مع منصات الحجز تعمل', 'Booking platforms sync is live')}"><span class="pulse"></span><span class="sync-text">${L('مزامنة حية: فيزيتا · كلينيدو · إكشف', 'Live sync: Vezeeta · CliniDo · Ekshef')}</span></div>
          <button class="icon-btn hide-sm" id="langBtn" title="Language">${UI.lang === 'ar' ? 'EN' : 'ع'}</button>
          <button class="icon-btn hide-sm" id="themeBtn" title="${L('الوضع الليلي', 'Dark mode')}">${icon(theme() === 'dark' ? 'sun' : 'moon')}</button>
          <div style="position:relative"><button class="icon-btn" id="bellBtn" aria-label="notifications">${icon('bell')}<span class="badge-dot hidden" id="bellCount"></span></button><div id="bellDD"></div></div>
          <div style="position:relative"><button class="user-btn" id="userBtn">${avatar(u.name)}<span class="user-meta" style="text-align:start"><div style="font-weight:600;font-size:13px;line-height:1.2">${esc(N(u.name))}</div><div class="xs muted">${esc(N(Store.role().name))}</div></span>${icon('chevron-down', 'ic-sm')}</button><div id="userDD"></div></div>
        </header>
        <main class="content" id="content"></main>
      </div>
    </div>`;
    root.querySelector('#logoutBtn').onclick = logout;
    root.querySelector('#menuBtn').onclick = () => root.querySelector('.app').classList.toggle('nav-open');
    root.querySelector('#backdrop').onclick = () => root.querySelector('.app').classList.remove('nav-open');
    root.querySelector('#langBtn').onclick = () => { UI.setLang(UI.lang === 'ar' ? 'en' : 'ar'); rebuild(); };
    root.querySelector('#themeBtn').onclick = () => { theme(theme() === 'dark' ? 'light' : 'dark'); rebuild(); };
    root.querySelector('#bellBtn').onclick = e => { e.stopPropagation(); toggleBell(); };
    root.querySelector('#userBtn').onclick = e => { e.stopPropagation(); toggleUser(); };
    document.addEventListener('click', closeDropdowns);
    setupSearch(root);
    icons(root); updateBell();
  }
  function rebuild() { const root = document.getElementById('root'); root.innerHTML = ''; render(); }
  function closeDropdowns(e) {
    ['bellDD', 'userDD'].forEach(id => { const d = document.getElementById(id); if (d && !d.contains(e.target)) d.innerHTML = ''; });
    const r = document.getElementById('gresults'); if (r && !e.target.closest('.search')) r.classList.add('hidden');
  }

  function renderNav() {
    const nav = document.getElementById('nav'); if (!nav) return;
    const c = counts();
    nav.innerHTML = NAV.map(g => {
      const items = g.items.filter(i => Store.can(i[0]));
      if (!items.length) return '';
      return `<div class="nav-group">${L(g.group[0], g.group[1])}</div>` + items.map(i => {
        const n = c[i[0]]; const label = i[0] === 'performance' && Store.isDoctor() ? L('أدائي', 'My performance') : L(i[1], i[2]);
        return `<a href="#/${i[0]}" class="${current.page === i[0] ? 'active' : ''}">${icon(i[3])}<span>${label}</span>${n ? `<span class="count${i[0] === 'bookings' ? ' soft' : ''}">${UI.nf(n)}</span>` : ''}</a>`;
      }).join('');
    }).join('');
    icons(nav);
  }

  function setupSearch(root) {
    const inp = root.querySelector('#gsearch'), box = root.querySelector('#gresults');
    inp.addEventListener('input', () => {
      const q = inp.value.trim().toLowerCase(); if (q.length < 2) { box.classList.add('hidden'); return; }
      const res = Store.patients().filter(p => p.name.ar.includes(q) || p.name.en.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.phone.includes(q)).slice(0, 8);
      box.innerHTML = res.length ? res.map(p => `<a href="#/patients/${p.id}">${avatar(p.name)}<div><div style="font-weight:600">${esc(N(p.name))}</div><div class="xs muted"><span class="ltr">${p.id}</span> · <span class="ltr">${p.phone}</span></div></div></a>`).join('') : `<div class="empty" style="padding:20px">${L('لا توجد نتائج', 'No results')}</div>`;
      box.classList.remove('hidden'); box.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { box.classList.add('hidden'); inp.value = ''; }));
    });
  }

  function updateBell() {
    const b = document.getElementById('bellCount'); if (!b) return;
    const n = Store.myNotifications().filter(x => !x.read).length;
    b.textContent = n > 9 ? '9+' : n; b.classList.toggle('hidden', !n);
  }
  function toggleBell() {
    const dd = document.getElementById('bellDD'); document.getElementById('userDD').innerHTML = '';
    if (dd.innerHTML) { dd.innerHTML = ''; return; }
    const list = Store.myNotifications().slice(0, 20);
    dd.innerHTML = `<div class="dropdown"><div class="dd-head"><span>${L('الإشعارات', 'Notifications')}</span><button class="btn ghost sm" id="markRead">${L('تحديد الكل كمقروء', 'Mark all read')}</button></div><div class="dd-body">${list.length ? list.map(n => `
      <div class="dd-item ${n.read ? '' : 'unread'}" data-n="${n.id}"><div class="k-icon tone-${n.kind === 'stock' ? 'warning' : n.kind === 'invoice' ? 'accent' : 'primary'}" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center">${icon(n.kind === 'stock' ? 'package-x' : n.kind === 'invoice' ? 'receipt' : 'calendar-plus')}</div>
      <div class="grow"><div style="font-weight:600;font-size:13px">${esc(N(n.title))}</div><div class="xs muted">${esc(N(n.body))}</div><div class="xs muted">${ago(n.at)}</div></div></div>`).join('') : `<div class="empty">${icon('bell-off')}<div>${L('لا توجد إشعارات حالياً', 'No notifications yet')}</div><div class="xs">${L('ستظهر هنا الحجوزات الواردة من المنصات', 'Incoming platform bookings appear here')}</div></div>`}</div></div>`;
    icons(dd);
    dd.querySelector('#markRead').onclick = e => { e.stopPropagation(); Store.myNotifications().forEach(n => n.read = true); Store.save(); updateBell(); dd.innerHTML = ''; };
    dd.querySelectorAll('[data-n]').forEach(el => el.onclick = () => {
      const n = Store.db.notifications.find(x => x.id === el.dataset.n); n.read = true; Store.save(); dd.innerHTML = ''; updateBell();
      if (n.kind === 'stock') go('#/inventory'); else if (n.kind === 'invoice' && Store.can('sales')) go('#/sales'); else go('#/bookings');
    });
  }
  function toggleUser() {
    const dd = document.getElementById('userDD'); document.getElementById('bellDD').innerHTML = '';
    if (dd.innerHTML) { dd.innerHTML = ''; return; }
    const u = Store.me();
    dd.innerHTML = `<div class="dropdown" style="width:260px"><div class="dd-head" style="flex-direction:column;align-items:flex-start;gap:2px"><span>${esc(N(u.name))}</span><span class="xs muted">${esc(N(u.title))} · <span class="ltr">@${esc(u.username)}</span></span></div>
    <div class="menu-list"><button data-a="lang">${icon('languages')}${UI.lang === 'ar' ? 'English' : 'العربية'}</button><button data-a="theme">${icon('moon')}${L('تبديل الوضع الليلي', 'Toggle dark mode')}</button>${Store.can('performance') ? `<a href="#/performance">${icon('trophy')}${Store.isDoctor() ? L('تقرير أدائي', 'My performance report') : L('أداء الأطباء', 'Doctor performance')}</a>` : ''}<button data-a="out" style="color:var(--danger)">${icon('log-out')}${L('تسجيل الخروج', 'Sign out')}</button></div></div>`;
    icons(dd);
    dd.querySelector('[data-a=lang]').onclick = () => { UI.setLang(UI.lang === 'ar' ? 'en' : 'ar'); rebuild(); };
    dd.querySelector('[data-a=theme]').onclick = () => { theme(theme() === 'dark' ? 'light' : 'dark'); rebuild(); };
    dd.querySelector('[data-a=out]').onclick = logout;
  }
  // full reload on sign-out so no filter / page state leaks between users
  function logout() { Store.logout(); stopSync(); location.hash = '#/dashboard'; location.reload(); }

  // ---------- login
  function renderLogin(root) {
    const db = Store.db;
    const accounts = [
      ['admin', 'shield-check', L('مالك المستشفى (صلاحيات كاملة)', 'Owner (full access)')],
      ['dr.ahmed', 'eye', L('د. أحمد — العيون', 'Dr. Ahmed — Eyes')],
      ['dr.mona', 'baby', L('د. منى — الأطفال', 'Dr. Mona — Pediatrics')],
      ['reception', 'concierge-bell', L('الاستقبال', 'Reception')],
      ['sales', 'receipt-text', L('المبيعات والخزينة', 'Sales & cashier')],
      ['store', 'boxes', L('المخازن', 'Inventory')]
    ];
    root.innerHTML = `
    <div class="login">
      <section class="login-hero">
        <div class="row"><div class="brand-mark" style="background:rgba(255,255,255,.16);box-shadow:none">${icon('activity')}</div><div><div style="font-weight:700;font-size:18px">${L('نبض', 'Nabd')} HMS</div><div style="opacity:.75;font-size:12.5px">${L('نظام إدارة المستشفيات والعيادات', 'Hospital & clinic management')}</div></div></div>
        <div>
          <h1>${L('كل حجوزات المستشفى من كل المنصات… في مكان واحد، وتوصل للطبيب المختص تلقائياً.', 'Every booking from every platform, in one place, routed to the right doctor automatically.')}</h1>
          <p>${L('حجوزات، ملفات مرضى، مخزون، مبيعات، وتقارير أداء نصف شهرية تكشف نقاط الضعف وتزيد ربحية المستشفى.', 'Bookings, patient files, inventory, sales, and twice-monthly performance reports that expose weak points and grow profit.')}</p>
          <div class="platform-strip"><span>Vezeeta</span><span>CliniDo</span><span>Ekshef</span><span>${L('موقع المستشفى', 'Website')}</span><span>${L('الاستقبال', 'Walk-in')}</span></div>
          <div class="hero-feats">
            <div class="hero-feat">${icon('zap')}${L('توجيه تلقائي للحجز للعيادة والطبيب', 'Auto-routing to clinic & doctor')}</div>
            <div class="hero-feat">${icon('boxes')}${L('خصم المستلزمات من المخزون لكل مريض', 'Per-patient stock deduction')}</div>
            <div class="hero-feat">${icon('lock-keyhole')}${L('صلاحيات منفصلة لكل طبيب وقسم', 'Separate access per doctor & dept')}</div>
            <div class="hero-feat">${icon('trophy')}${L('تقارير أداء الأطباء والعمولات', 'Doctor performance & commission')}</div>
          </div>
        </div>
        <div style="opacity:.7;font-size:12px">${L('نسخة تجريبية للعرض — البيانات افتراضية', 'Demo version — sample data only')} · ${esc(N(db.hospital.name))}</div>
      </section>
      <section class="login-form">
        <div class="login-box">
          <div class="row between" style="margin-bottom:22px"><h2 style="font-size:24px">${L('تسجيل الدخول', 'Sign in')}</h2><button class="btn sm" id="loginLang">${icon('languages')}${UI.lang === 'ar' ? 'English' : 'العربية'}</button></div>
          <form id="loginForm" class="stack">
            <div class="field"><label>${L('اسم المستخدم', 'Username')}</label><input class="input" name="username" autocomplete="username" required dir="ltr"></div>
            <div class="field"><label>${L('كلمة المرور', 'Password')}</label><input class="input" type="password" name="password" autocomplete="current-password" required dir="ltr"></div>
            <div id="loginErr" class="callout tone-danger hidden">${icon('circle-alert')}${L('اسم المستخدم أو كلمة المرور غير صحيحة', 'Incorrect username or password')}</div>
            <button class="btn primary" style="height:44px">${icon('log-in')}${L('دخول', 'Sign in')}</button>
          </form>
          <div class="divider"></div>
          <div class="section-title">${icon('sparkles', 'ic-sm')}${L('حسابات تجريبية — اضغط للدخول مباشرة', 'Demo accounts — click to sign in')}</div>
          <div class="demo-accounts">${accounts.map(a => `<button class="demo-acc" data-u="${a[0]}"><span class="k-icon tone-primary" style="width:30px;height:30px;border-radius:8px;display:grid;place-items:center">${icon(a[1], 'ic-sm')}</span><span><div style="font-weight:600;font-size:12.5px">${a[2]}</div><div class="xs muted ltr">${a[0]}</div></span></button>`).join('')}</div>
          <p class="xs muted" style="margin-top:12px">${L('كلمة المرور لكل الحسابات التجريبية:', 'Password for all demo accounts:')} <span class="code">123456</span> — ${L('كل طبيب له حساب خاص (dr.karim, dr.sara, dr.youssef, dr.nour, dr.heba, dr.omar) وحساب الحسابات accounts', 'every doctor has their own login (dr.karim, dr.sara, dr.youssef, dr.nour, dr.heba, dr.omar), plus accounts')}</p>
        </div>
      </section>
    </div>`;
    icons(root);
    const form = root.querySelector('#loginForm');
    const doLogin = (u, p) => { if (Store.login(u, p)) { root.innerHTML = ''; location.hash = '#/dashboard'; render(); } else root.querySelector('#loginErr').classList.remove('hidden'); };
    form.onsubmit = e => { e.preventDefault(); const d = UI.formData(form); doLogin(d.username, d.password); };
    root.querySelectorAll('[data-u]').forEach(b => b.onclick = () => doLogin(b.dataset.u, '123456'));
    root.querySelector('#loginLang').onclick = () => { UI.setLang(UI.lang === 'ar' ? 'en' : 'ar'); render(); };
  }

  // ---------- live platform sync simulation
  function simulateIncoming(forceSource) {
    const db = Store.db;
    const conns = db.connectors.filter(c => c.enabled && c.id !== 'website' || (forceSource && c.id === forceSource));
    if (!conns.length) return null;
    const c = forceSource ? Store.get.connector(forceSource) : conns[Math.floor(Math.random() * conns.length)];
    let docs = db.doctors.filter(d => d.platformIds[c.id] || c.id === 'website');
    if (Store.isDoctor() && Math.random() < .5) docs = docs.filter(d => d.id === Store.myDoctorId()).concat(docs.length ? [] : []);
    if (!docs.length) docs = db.doctors;
    const doc = docs[Math.floor(Math.random() * docs.length)];
    const sh = Store.get.shift(doc.shift);
    // find next free half-hour slot from now within shift (today, else tomorrow)
    let slot = null;
    for (let dayOff = 0; dayOff < 4 && !slot; dayOff++) {
      const d = new Date(); d.setDate(d.getDate() + dayOff); if (d.getDay() === 5) continue;
      for (let h = parseInt(sh.from); h < parseInt(sh.to); h += .5) {
        const t = new Date(d); t.setHours(Math.floor(h), (h % 1) * 60, 0, 0);
        if (t < new Date(Date.now() + 30 * 60000)) continue;
        if (!db.appointments.some(a => a.doctorId === doc.id && a.start === t.toISOString() && a.status !== 'cancelled')) { slot = t; break; }
      }
    }
    if (!slot) return null;
    let pat;
    if (Math.random() < .55) { const pool = db.patients.filter(p => p.prefs.includes(doc.dept)); pat = pool[Math.floor(Math.random() * pool.length)] || db.patients[0]; }
    else {
      const names = [['حازم', 'Hazem', 'M'], ['سارة', 'Sara', 'F'], ['مروان', 'Marwan', 'M'], ['هدى', 'Hoda', 'F'], ['زياد', 'Ziad', 'M'], ['ملك', 'Malak', 'F'], ['أنس', 'Anas', 'M'], ['ريم', 'Reem', 'F']];
      const lasts = [['الدسوقي', 'El-Desouky'], ['الحسيني', 'El-Husseiny'], ['عبد العزيز', 'Abdelaziz'], ['المصري', 'El-Masry'], ['فهمي', 'Fahmy']];
      const n = names[Math.floor(Math.random() * names.length)], l = lasts[Math.floor(Math.random() * lasts.length)];
      const dob = new Date(); dob.setFullYear(dob.getFullYear() - (doc.dept === 'ped' ? 6 : 34));
      pat = Store.addPatient({ name: { ar: n[0] + ' ' + l[0], en: n[1] + ' ' + l[1] }, gender: n[2], dob: dob.toISOString().slice(0, 10), phone: '+2011' + Math.floor(10000000 + Math.random() * 89999999), prefs: [doc.dept], source: c.id }, { system: true, doctorId: doc.id });
    }
    const ref = c.id === 'vezeeta' ? 'VZ-' + Math.floor(8000000 + Math.random() * 999999) : c.id === 'clinido' ? 'CD-' + Math.floor(400000 + Math.random() * 99999) : c.id === 'ekshef' ? 'EK-' + Math.floor(100000 + Math.random() * 9999) : 'WEB-' + Math.floor(1000 + Math.random() * 8999);
    const appt = Store.createAppointment({ patientId: pat.id, doctorId: doc.id, start: slot.toISOString(), source: c.id, externalRef: ref, status: 'confirmed' }, { fromPlatform: true });
    appt._new = true;
    const visible = !Store.isDoctor() || Store.myDoctorId() === doc.id;
    if (visible && Store.can('bookings')) {
      toast(L(`حجز جديد من ${c.nameAr}`, `New booking from ${c.name}`), `${esc(N(pat.name))} → ${esc(N(doc.name))} · ${UI.fdt(appt.start)}`, 'primary', 'calendar-plus', () => go('#/bookings'));
    }
    if (['dashboard', 'bookings', 'integrations'].includes(current.page)) refresh(); else { renderNav(); updateBell(); }
    return appt;
  }
  function startSync() {
    if (syncTimer) return;
    const tick = () => { if (Store.db.liveFeed !== false && Store.me()) simulateIncoming(); syncTimer = setTimeout(tick, 45000 + Math.random() * 30000); };
    syncTimer = setTimeout(tick, 15000);
  }
  function stopSync() { clearTimeout(syncTimer); syncTimer = null; }

  function pageHead(title, sub, actions, crumbs) {
    return `<div class="page-head"><div>${crumbs ? `<div class="crumbs">${crumbs}</div>` : ''}<h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${actions ? `<div class="row wrap">${actions}</div>` : ''}</div>`;
  }

  function boot() {
    theme(); Store.load(); Store.restoreSession();
    window.addEventListener('hashchange', render);
    render();
  }
  return { pages, boot, go, render, refresh, pageHead, simulateIncoming, counts, get current() { return current; } };
})();

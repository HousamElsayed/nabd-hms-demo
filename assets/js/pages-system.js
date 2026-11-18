/* Platform integrations, activity logs, users & permissions, settings */
App.pages.integrations = {
  render(el) {
    const { L, N, esc, icon, nf } = UI; const db = Store.db; const today = UI.isoDay(new Date());
    const admin = Store.isAdmin();
    const lastPlat = db.appointments.filter(a => ['vezeeta', 'clinido', 'ekshef'].includes(a.source)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const step = (ic, t, s, tone) => `<div class="card" style="padding:14px;flex:1;min-width:160px;text-align:center"><div class="k-icon tone-${tone}" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;margin:0 auto 8px">${icon(ic)}</div><b>${t}</b><div class="xs muted">${s}</div></div>`;
    const arrow = `<div style="display:grid;place-items:center;color:var(--muted)">${icon(UI.lang === 'ar' ? 'arrow-left' : 'arrow-right')}</div>`;
    el.innerHTML = `${App.pageHead(L('ربط منصات الحجز', 'Booking platform integrations'), L('الحجوزات من فيزيتا وكلينيدو وإكشف تدخل النظام تلقائياً وتتحول للعيادة والطبيب المختص', 'Bookings from Vezeeta, CliniDo and Ekshef flow in automatically and route to the right clinic and doctor'),
      `<label class="row small" style="font-weight:600">${L('محاكاة حجوزات حية', 'Live demo feed')} <span class="switch"><input type="checkbox" id="liveT" ${db.liveFeed !== false ? 'checked' : ''}><span></span></span></label><button class="btn primary" id="simBtn">${icon('zap')}${L('محاكاة حجز وارد الآن', 'Simulate incoming booking')}</button>`)}
    <div class="card" style="margin-bottom:16px"><div class="card-head"><h3>${icon('workflow')}${L('كيف يعمل التوجيه التلقائي', 'How auto-routing works')}</h3></div><div class="card-body"><div class="row wrap" style="gap:10px;align-items:stretch">
      ${step('smartphone', L('المريض يحجز', 'Patient books'), L('على فيزيتا / كلينيدو / إكشف', 'on Vezeeta / CliniDo / Ekshef'), 'info')}${arrow}
      ${step('webhook', L('استقبال الحجز', 'Booking received'), L('Webhook أو API أو قراءة الإشعار', 'Webhook, API or notification parser'), 'accent')}${arrow}
      ${step('git-fork', L('محرك التوجيه', 'Routing engine'), L('كود الطبيب على المنصة ← الطبيب ← العيادة', 'Platform doctor ID → doctor → clinic'), 'warning')}${arrow}
      ${step('user-check', L('ملف المريض', 'Patient file'), L('مطابقة بالهاتف أو إنشاء ملف جديد', 'Match by phone or create new file'), 'primary')}${arrow}
      ${step('bell-ring', L('يظهر عند الطبيب', 'Shows for the doctor'), L('في قائمة اليوم + إشعار فوري', 'In today’s queue + instant alert'), 'success')}
    </div></div></div>
    <div class="grid g4" style="margin-bottom:16px">${db.connectors.map(c => { const n = db.appointments.filter(a => a.source === c.id && UI.sameDay(a.createdAt, today)).length; const tot = db.appointments.filter(a => a.source === c.id).length; return `<div class="card"><div class="card-body">
      <div class="row between"><div class="row"><span style="width:40px;height:40px;border-radius:11px;background:${c.color};color:#fff;display:grid;place-items:center;font-weight:700;font-size:17px">${c.short}</span><div><b>${UI.lang === 'ar' ? c.nameAr : c.name}</b><div class="xs muted">${esc(c.method)}</div></div></div>${admin ? `<label class="switch"><input type="checkbox" data-conn="${c.id}" ${c.enabled ? 'checked' : ''}><span></span></label>` : ''}</div>
      <div style="margin-top:12px">${c.enabled ? `<span class="badge tone-success"><span class="pulse"></span>${L('متصل', 'Connected')}</span>` : `<span class="badge tone-muted">${L('متوقف', 'Paused')}</span>`}</div>
      <dl class="kv" style="margin-top:12px"><dt>${L('حجوزات اليوم', 'Received today')}</dt><dd>${nf(n)}</dd><dt>${L('الإجمالي', 'All time')}</dt><dd>${nf(tot)}</dd><dt>${L('آخر مزامنة', 'Last sync')}</dt><dd>${UI.ago(c.lastSync)}</dd></dl>
      ${c.id !== 'website' ? `<button class="btn sm" style="margin-top:12px;width:100%" data-sim="${c.id}">${icon('send')}${L('حجز تجريبي', 'Test booking')}</button>` : ''}
    </div></div>`; }).join('')}</div>
    <div class="grid g-main" style="margin-bottom:16px">
      <div class="card"><div class="card-head"><h3>${icon('link-2')}${L('ربط الأطباء بأكوادهم على المنصات', 'Doctor ↔ platform ID mapping')}</h3>${admin ? `<a class="btn sm" href="#/doctors">${icon('pencil')}${L('تعديل', 'Edit')}</a>` : ''}</div><div class="card-body flush">${UI.table([
        { label: L('الطبيب في النظام', 'System doctor'), render: d => `<b>${esc(N(d.name))}</b><div class="cell-sub">${esc(N(Store.get.dept(d.dept).name))}</div>` },
        ...['vezeeta', 'clinido', 'ekshef'].map(k => ({ label: UI.srcLabel(k), render: d => d.platformIds[k] ? `<span class="code">${d.platformIds[k]}</span>` : `<span class="xs muted">${L('غير مسجل', 'Not listed')}</span>` }))
      ], db.doctors)}</div></div>
      <div class="card"><div class="card-head"><h3>${icon('braces')}${L('آخر حجز وارد (بيانات خام)', 'Last incoming payload')}</h3></div><div class="card-body">${lastPlat ? `<pre class="pre">${esc(JSON.stringify({ event: 'booking.created', platform: lastPlat.source, booking_id: lastPlat.externalRef, doctor_external_id: Store.get.doctor(lastPlat.doctorId).platformIds[lastPlat.source], patient: { name: Store.get.patient(lastPlat.patientId).name.en, phone: Store.get.patient(lastPlat.patientId).phone }, slot: lastPlat.start, fee: lastPlat.fee }, null, 2))}</pre><div class="small" style="margin-top:10px">${icon('arrow-down', 'ic-sm')} ${L('تم توجيهه إلى', 'Routed to')} <b>${esc(N(Store.get.doctor(lastPlat.doctorId).name))}</b> — <span class="ltr">${lastPlat.id}</span></div>` : '—'}</div></div>
    </div>
    <div class="card" style="margin-bottom:16px"><div class="card-head"><h3>${icon('history')}${L('سجل المزامنة', 'Sync log')}</h3></div><div class="card-body flush">${UI.table([{ label: L('الوقت', 'Time'), render: l => UI.fdt(l.at) }, { label: L('الحدث', 'Event'), render: l => esc(N(l.msg)) }], db.logs.filter(l => l.dept === 'integration').slice().reverse().slice(0, 15), { empty: L('لا توجد أحداث بعد', 'No events yet') })}</div></div>
    ${admin ? `<div class="callout tone-warning">${icon('info')}<div><b>${L('ملاحظة للتنفيذ الفعلي', 'Note for production')}</b><div class="small">${L('في هذه النسخة التجريبية الحجوزات الواردة محاكاة. في التنفيذ الفعلي يتم الربط عبر واجهة برمجية (API) أو Webhook بالاتفاق مع كل منصة كشريك، وكبديل في حال عدم توفر API يتم قراءة إشعارات البريد / الرسائل التي ترسلها المنصة للعيادة وتحويلها لحجوزات تلقائياً.', 'Incoming bookings are simulated in this demo. In production each platform is connected via a partner API or webhook agreement; where no API is offered, the booking notification emails/SMS the platform sends to the clinic are parsed into bookings automatically.')}</div></div></div>` : ''}`;
    el.querySelector('#simBtn').onclick = () => { if (!App.simulateIncoming()) UI.toast(L('لا توجد مواعيد متاحة', 'No free slots'), '', 'warning', 'info'); };
    el.querySelectorAll('[data-sim]').forEach(b => b.onclick = () => { if (!App.simulateIncoming(b.dataset.sim)) UI.toast(L('لا توجد مواعيد متاحة', 'No free slots'), '', 'warning', 'info'); });
    el.querySelector('#liveT').onchange = e => { db.liveFeed = e.target.checked; Store.save(); UI.toast(e.target.checked ? L('تم تشغيل المحاكاة الحية', 'Live feed on') : L('تم إيقاف المحاكاة الحية', 'Live feed off'), '', 'primary', 'zap'); };
    el.querySelectorAll('[data-conn]').forEach(t => t.onchange = () => { const c = Store.get.connector(t.dataset.conn); c.enabled = t.checked; Store.log('integration', { ar: `${t.checked ? 'تفعيل' : 'إيقاف'} الربط مع ${c.nameAr}`, en: `${t.checked ? 'Enabled' : 'Paused'} ${c.name} connector` }); App.refresh(); });
  }
};

App.pages.logs = (function () {
  const st = { dept: '', user: '', q: '' };
  return {
    render(el) {
      const { L, N, esc, icon, nf } = UI; const db = Store.db;
      const DEPTS = { bookings: [L('الحجوزات', 'Bookings'), 'calendar-check-2', 'info'], medical: [L('طبي', 'Medical'), 'stethoscope', 'primary'], inventory: [L('المخازن', 'Inventory'), 'boxes', 'warning'], sales: [L('المبيعات', 'Sales'), 'receipt-text', 'success'], integration: [L('ربط المنصات', 'Integrations'), 'plug-zap', 'accent'], auth: [L('الدخول', 'Sign-in'), 'key-round', 'muted'], admin: [L('الإدارة', 'Admin'), 'shield', 'danger'] };
      const all = Store.logs();
      const visibleDepts = Object.keys(DEPTS).filter(d => all.some(l => l.dept === d));
      const rows = all.filter(l => (!st.dept || l.dept === st.dept) && (!st.user || l.userId === st.user) && (!st.q || N(l.msg).toLowerCase().includes(st.q.toLowerCase()))).slice().reverse();
      const users = [...new Set(all.map(l => l.userId))].map(id => Store.get.user(id)).filter(Boolean);
      el.innerHTML = `${App.pageHead(L('سجل العمليات', 'Activity logs'), Store.isAdmin() ? L('سجل كامل لكل العمليات في كل الأقسام — من فعل ماذا ومتى', 'Full audit trail across all departments — who did what, when') : L('سجل عمليات قسمك فقط', 'Your department’s activity only'), `<button class="btn" id="lCsv">${icon('download')}${L('تصدير', 'Export')}</button>`)}
      <div class="chips" style="margin-bottom:14px"><button class="chip ${!st.dept ? 'on' : ''}" data-d="">${L('كل الأقسام', 'All')} <span class="cnt">${nf(all.length)}</span></button>${visibleDepts.map(d => `<button class="chip ${st.dept === d ? 'on' : ''}" data-d="${d}">${icon(DEPTS[d][1], 'ic-sm')}${DEPTS[d][0]} <span class="cnt">${nf(all.filter(l => l.dept === d).length)}</span></button>`).join('')}</div>
      <div class="card"><div class="card-body filters" style="border-bottom:1px solid var(--border)"><input class="input sm" id="lQ" placeholder="${L('بحث في السجل', 'Search logs')}" value="${esc(st.q)}"><select class="select sm" id="lU"><option value="">${L('كل المستخدمين', 'All users')}</option>${users.map(u => `<option value="${u.id}" ${st.user === u.id ? 'selected' : ''}>${esc(N(u.name))}</option>`).join('')}</select></div>
      <div class="card-body flush">${UI.table([
        { label: L('الوقت', 'Time'), render: l => `<span class="small">${UI.fdt(l.at)}</span>` },
        { label: L('القسم', 'Department'), render: l => { const d = DEPTS[l.dept] || [l.dept, 'dot', 'muted']; return `<span class="badge tone-${d[2]}">${icon(d[1], 'ic-sm')}${d[0]}</span>`; } },
        { label: L('المستخدم', 'User'), render: l => { const u = Store.get.user(l.userId); return u ? `<div class="row">${UI.avatar(u.name)}<div><div style="font-weight:600;font-size:13px">${esc(N(u.name))}</div><div class="xs muted">${esc(N(Store.ROLES[u.role].name))}</div></div></div>` : `<div class="row"><span class="avatar" style="background:var(--text-2)">${icon('cpu', 'ic-sm')}</span><div><div style="font-weight:600;font-size:13px">${L('النظام', 'System')}</div><div class="xs muted">${L('تلقائي', 'Automatic')}</div></div></div>`; } },
        { label: L('العملية', 'Action'), render: l => esc(N(l.msg)) }
      ], rows.slice(0, 300))}</div></div>`;
      el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { st.dept = b.dataset.d; App.refresh(); });
      el.querySelector('#lU').onchange = e => { st.user = e.target.value; App.refresh(); };
      const q = el.querySelector('#lQ'); let t; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { st.q = q.value.trim(); App.refresh(); const n = document.getElementById('lQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); };
      el.querySelector('#lCsv').onclick = () => UI.downloadCSV('activity-log', [[L('الوقت', 'Time'), L('القسم', 'Dept'), L('المستخدم', 'User'), L('العملية', 'Action')]].concat(rows.map(l => [l.at, l.dept, Store.get.user(l.userId) ? N(Store.get.user(l.userId).name) : 'system', N(l.msg)])));
    }
  };
})();

App.pages.users = {
  render(el) {
    const { L, N, esc, icon } = UI; const db = Store.db;
    const MODS = [['dashboard', L('لوحة التحكم', 'Dashboard')], ['bookings', L('الحجوزات', 'Bookings')], ['patients', L('المرضى', 'Patients')], ['records', L('التقارير الطبية', 'Medical records')], ['sales', L('المبيعات', 'Sales')], ['inventory', L('المخزون', 'Inventory')], ['finance', L('المالية', 'Finance')], ['performance', L('أداء الأطباء', 'Performance')], ['integrations', L('ربط المنصات', 'Integrations')], ['logs', L('السجل', 'Logs')], ['users', L('المستخدمين', 'Users')]];
    const roles = Object.keys(Store.ROLES);
    const scope = { admin: L('كل شيء', 'Everything'), doctor: L('حجوزاته ومرضاه فقط', 'Own bookings & patients'), reception: L('كل العيادات', 'All clinics'), sales: L('المبيعات', 'Sales'), store: L('المخازن', 'Inventory'), accountant: L('الحسابات', 'Accounts') };
    el.innerHTML = `${App.pageHead(L('المستخدمين والصلاحيات', 'Users & permissions'), L('كل مستخدم له اسم مستخدم وكلمة مرور خاصة ويرى فقط ما يخصه', 'Each user has their own login and sees only what concerns them'), `<button class="btn primary" id="uNew">${icon('user-plus')}${L('مستخدم جديد', 'New user')}</button>`)}
    <div class="card" style="margin-bottom:16px"><div class="card-body flush">${UI.table([
      { label: L('المستخدم', 'User'), render: u => `<div class="row">${UI.avatar(u.name)}<div><div class="cell-main">${esc(N(u.name))}</div><div class="cell-sub">${esc(N(u.title))}</div></div></div>` },
      { label: L('اسم الدخول', 'Username'), render: u => `<span class="code">${esc(u.username)}</span>` },
      { label: L('الدور', 'Role'), render: u => `<span class="badge tone-${u.role === 'admin' ? 'danger' : u.role === 'doctor' ? 'primary' : 'accent'}">${esc(N(Store.ROLES[u.role].name))}</span>` },
      { label: L('نطاق البيانات', 'Data scope'), render: u => u.doctorId ? `${scope.doctor}<div class="cell-sub">${esc(N(Store.get.dept(Store.get.doctor(u.doctorId).dept).name))}</div>` : scope[u.role] },
      { label: L('آخر نشاط', 'Last activity'), render: u => { const l = db.logs.filter(x => x.userId === u.id).slice(-1)[0]; return l ? `<span class="small">${UI.ago(l.at)}</span>` : '—'; } },
      { label: L('الحالة', 'Status'), render: u => `<label class="switch"><input type="checkbox" data-act="${u.id}" ${u.active ? 'checked' : ''} ${u.role === 'admin' ? 'disabled' : ''}><span></span></label>` }
    ], db.users)}</div></div>
    <div class="card"><div class="card-head"><h3>${icon('shield-check')}${L('مصفوفة الصلاحيات', 'Permission matrix')}</h3></div><div class="card-body flush"><div class="table-wrap"><table class="tbl matrix"><thead><tr><th>${L('الشاشة', 'Module')}</th>${roles.map(r => `<th>${esc(N(Store.ROLES[r].name))}</th>`).join('')}</tr></thead><tbody>
      ${MODS.map(m => `<tr><td><b>${m[1]}</b></td>${roles.map(r => { const R = Store.ROLES[r]; const ok = R.modules === '*' || R.modules.includes(m[0]); return `<td>${ok ? `<span class="check">${icon('circle-check')}</span>` : `<span class="cross">${icon('minus')}</span>`}</td>`; }).join('')}</tr>`).join('')}
    </tbody></table></div></div></div>`;
    el.querySelectorAll('[data-act]').forEach(t => t.onchange = () => { const u = Store.get.user(t.dataset.act); u.active = t.checked; Store.log('admin', { ar: `${t.checked ? 'تفعيل' : 'إيقاف'} حساب ${u.username}`, en: `${t.checked ? 'Activated' : 'Deactivated'} account ${u.username}` }); UI.toast(L('تم التحديث', 'Updated'), u.username, 'success', 'check'); });
    el.querySelector('#uNew').onclick = () => UI.modal({
      title: `${icon('user-plus')} ${L('مستخدم جديد', 'New user')}`,
      body: `<form id="unF" class="form-grid"><div class="field full"><label>${L('الاسم', 'Name')}</label><input class="input" name="name" required></div><div class="field"><label>${L('اسم الدخول', 'Username')}</label><input class="input" name="username" dir="ltr" required></div><div class="field"><label>${L('كلمة المرور', 'Password')}</label><input class="input" name="password" type="password" dir="ltr" required minlength="6"></div>
        <div class="field"><label>${L('الدور', 'Role')}</label><select class="select" name="role" id="unR">${roles.map(r => `<option value="${r}">${esc(N(Store.ROLES[r].name))}</option>`).join('')}</select></div><div class="field" id="unDocF"><label>${L('ربط بطبيب', 'Link to doctor')}</label><select class="select" name="doctorId">${UI.options(db.doctors, '', '—')}</select></div></form>`,
      footer: `<button class="btn" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn primary" id="unS">${L('إنشاء', 'Create')}</button>`,
      onMount(r, close) {
        r.querySelector('#unS').onclick = () => {
          const f = r.querySelector('#unF'); if (!f.reportValidity()) return; const d = UI.formData(f);
          if (db.users.some(u => u.username === d.username)) { UI.toast(L('اسم الدخول مستخدم بالفعل', 'Username taken'), '', 'danger', 'circle-alert'); return; }
          if (d.role === 'doctor' && !d.doctorId) { UI.toast(L('اختر الطبيب المرتبط', 'Select the linked doctor'), '', 'warning', 'info'); return; }
          db.users.push({ id: 'u' + Date.now(), username: d.username, password: d.password, role: d.role, doctorId: d.role === 'doctor' ? d.doctorId : undefined, name: { ar: d.name, en: d.name }, title: Store.ROLES[d.role].name, active: true });
          Store.log('admin', { ar: `إنشاء مستخدم ${d.username}`, en: `Created user ${d.username}` }); close(); App.refresh();
        };
      }
    });
  }
};

App.pages.settings = {
  render(el) {
    const { L, N, esc, icon } = UI; const db = Store.db;
    el.innerHTML = `${App.pageHead(L('الإعدادات', 'Settings'), L('بيانات المستشفى والفروع وإعدادات النظام', 'Hospital profile, branches and system preferences'))}
    <div class="grid g2">
      <div class="card"><div class="card-head"><h3>${icon('hospital')}${L('بيانات المستشفى', 'Hospital profile')}</h3></div><div class="card-body"><form id="hsF" class="form-grid">
        <div class="field full"><label>${L('اسم المستشفى (عربي)', 'Name (Arabic)')}</label><input class="input" name="ar" value="${esc(db.hospital.name.ar)}"></div>
        <div class="field full"><label>${L('اسم المستشفى (إنجليزي)', 'Name (English)')}</label><input class="input" name="en" dir="ltr" value="${esc(db.hospital.name.en)}"></div>
        <div class="field"><label>${L('الهاتف', 'Phone')}</label><input class="input" name="phone" dir="ltr" value="${esc(db.hospital.phone)}"></div>
        <div class="field"><label>${L('ضريبة القيمة المضافة %', 'VAT %')}</label><input class="input" name="vat" type="number" value="${db.hospital.vat}"></div>
        <div class="field full"><label>${L('العنوان', 'Address')}</label><input class="input" name="addr" value="${esc(N(db.hospital.address))}"></div>
      </form><button class="btn primary" id="hsS" style="margin-top:14px">${L('حفظ', 'Save')}</button></div></div>
      <div class="stack">
        <div class="card"><div class="card-head"><h3>${icon('git-branch')}${L('الفروع', 'Branches')}</h3></div><div class="card-body flush">${db.branches.map(b => `<div class="list-item">${icon('map-pin')}<div class="grow"><b>${esc(N(b.name))}</b><div class="xs muted">${db.doctors.filter(d => d.branch === b.id).length} ${L('أطباء', 'doctors')}</div></div></div>`).join('')}</div></div>
        <div class="card"><div class="card-head"><h3>${icon('bell-ring')}${L('التنبيهات والتقارير التلقائية', 'Automatic alerts & reports')}</h3></div><div class="card-body stack" style="gap:12px">
          ${[[L('إرسال تقرير الأداء نصف الشهري للمالك (يوم 1 و 16)', 'Send half-month performance report to owner (1st & 16th)'), true], [L('تذكير المرضى بالموعد عبر واتساب قبل 24 ساعة', 'WhatsApp reminder 24h before appointment'), true], [L('تنبيه عند وصول صنف لحد الطلب', 'Alert when an item hits reorder level'), true], [L('تنبيه قبل انتهاء صلاحية الأصناف بـ 45 يوم', 'Alert 45 days before item expiry'), true], [L('طلب تقييم من المريض بعد الكشف', 'Request patient rating after visit'), false]].map((x, i) => { const pr = (db.prefs || {})['a' + i]; return `<label class="row between"><span class="small">${x[0]}</span><span class="switch"><input type="checkbox" data-pref="a${i}" ${(pr == null ? x[1] : pr) ? 'checked' : ''}><span></span></span></label>`; }).join('')}
        </div></div>
        <div class="card"><div class="card-head"><h3>${icon('database')}${L('بيانات العرض التجريبي', 'Demo data')}</h3></div><div class="card-body"><p class="small muted" style="margin-top:0">${L('إعادة البيانات التجريبية لحالتها الأصلية (يتم أيضاً تجديدها تلقائياً كل يوم).', 'Reset the demo data to its original state (it also refreshes automatically each day).')}</p><button class="btn danger" id="rst">${icon('rotate-ccw')}${L('إعادة ضبط البيانات', 'Reset demo data')}</button></div></div>
      </div>
    </div>`;
    el.querySelectorAll('[data-pref]').forEach(c => c.onchange = () => { db.prefs = db.prefs || {}; db.prefs[c.dataset.pref] = c.checked; Store.log('admin', { ar: 'تعديل إعدادات التنبيهات والتقارير التلقائية', en: 'Changed automatic alerts & reports settings' }); UI.toast(L('تم حفظ الإعداد', 'Setting saved'), '', 'success', 'check'); });
    el.querySelector('#hsS').onclick = () => { const d = UI.formData(el.querySelector('#hsF')); db.hospital.name = { ar: d.ar, en: d.en }; db.hospital.phone = d.phone; db.hospital.vat = +d.vat; db.hospital.address = { ar: d.addr, en: d.addr }; Store.log('admin', { ar: 'تعديل بيانات المستشفى', en: 'Updated hospital profile' }); UI.toast(L('تم الحفظ', 'Saved'), '', 'success', 'check'); const r = document.getElementById('root'); r.innerHTML = ''; App.render(); };
    el.querySelector('#rst').onclick = async () => { if (await UI.confirmBox(L('إعادة ضبط البيانات', 'Reset data'), L('سيتم حذف كل التعديلات التي تمت أثناء العرض.', 'All changes made during the demo will be lost.'), L('إعادة الضبط', 'Reset'), 'danger')) { const uid = Store.me().username; Store.reset(); Store.login(uid, '123456'); document.getElementById('root').innerHTML = ''; App.render(); UI.toast(L('تمت إعادة الضبط', 'Data reset'), '', 'success', 'check'); } };
  }
};

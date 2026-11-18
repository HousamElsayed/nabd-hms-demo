/* Patients list, patient profile, medical records, prescriptions, laboratory */
App.pages.patients = (function () {
  const st = { q: '', dept: '', ins: '', profileTab: 'overview' };
  function list(el) {
    const { L, N, esc, icon, nf, money } = UI; const db = Store.db;
    const pats = Store.patients();
    const rows = pats.filter(p => (!st.q || p.name.ar.includes(st.q) || p.name.en.toLowerCase().includes(st.q.toLowerCase()) || p.phone.includes(st.q) || p.id.includes(st.q)) && (!st.dept || p.prefs.includes(st.dept)) && (!st.ins || (st.ins === 'none' ? !p.insurer : p.insurer === st.ins)));
    const stats = {}; db.appointments.forEach(a => { const s = stats[a.patientId] || (stats[a.patientId] = { visits: 0, last: null, next: null }); if (a.status === 'completed') { s.visits++; if (!s.last || a.start > s.last) s.last = a.start; } if (['pending', 'confirmed'].includes(a.status) && new Date(a.start) > new Date() && (!s.next || a.start < s.next)) s.next = a.start; });
    el.innerHTML = `${App.pageHead(L('المرضى', 'Patients'), Store.isDoctor() ? L('المرضى الذين لديهم حجوزات معك فقط', 'Only patients who booked with you') : L(`${nf(pats.length)} ملف مريض — لكل مريض ملف كامل بالزيارات والمستلزمات والتقدم الصحي`, `${nf(pats.length)} patient files — each with visits, items used and health progress`),
      Store.can('bookings') && !Store.isDoctor() ? `<button class="btn primary" id="pNew">${icon('user-plus')}${L('مريض جديد', 'New patient')}</button>` : '')}
    <div class="card"><div class="card-body filters" style="border-bottom:1px solid var(--border)">
      <input class="input sm" style="min-width:260px" id="pQ" placeholder="${L('بحث بالاسم أو الرقم أو الهاتف', 'Search name, ID or phone')}" value="${esc(st.q)}">
      <select class="select sm" data-f="dept">${UI.options(db.departments, st.dept, L('كل العيادات', 'All clinics'))}</select>
      <select class="select sm" data-f="ins"><option value="">${L('كل أنواع الدفع', 'All payers')}</option><option value="none" ${st.ins === 'none' ? 'selected' : ''}>${L('بدون تأمين', 'Self-pay')}</option>${db.insurers.map(i => `<option value="${i.id}" ${st.ins === i.id ? 'selected' : ''}>${esc(N(i.name))}</option>`).join('')}</select>
      <span class="muted small">${nf(rows.length)} ${L('نتيجة', 'results')}</span>
    </div><div class="card-body flush">
    ${UI.table([
      { label: L('المريض', 'Patient'), render: p => `<div class="row">${UI.avatar(p.name)}<div><div class="cell-main">${esc(N(p.name))}</div><div class="cell-sub ltr">${p.id}</div></div></div>` },
      { label: L('العمر / النوع', 'Age / sex'), render: p => `${nf(UI.age(p.dob))} · ${p.gender === 'F' ? L('أنثى', 'F') : L('ذكر', 'M')}` },
      { label: L('الهاتف', 'Phone'), render: p => `<span class="ltr small">${p.phone}</span>` },
      { label: L('العيادات', 'Clinics'), cls: 'wrap', render: p => p.prefs.map(d => `<span class="tag"><span class="dept-dot" style="background:${Store.get.dept(d).color}"></span>${esc(N(Store.get.dept(d).name))}</span>`).join(' ') },
      { label: L('أمراض مزمنة', 'Chronic'), cls: 'wrap', render: p => p.chronic.map(c => `<span class="badge tone-warning">${esc(N(c))}</span>`).join(' ') || '<span class="muted">—</span>' },
      { label: L('الزيارات', 'Visits'), render: p => `<b class="num">${nf((stats[p.id] || {}).visits || 0)}</b>` },
      { label: L('آخر زيارة', 'Last visit'), render: p => `<span class="small">${(stats[p.id] || {}).last ? UI.fdate(stats[p.id].last) : '—'}</span>` },
      { label: L('الموعد القادم', 'Next appt'), render: p => (stats[p.id] || {}).next ? `<span class="badge tone-info">${UI.fdt(stats[p.id].next)}</span>` : '<span class="muted">—</span>' },
      { label: L('التأمين', 'Insurance'), render: p => p.insurer ? `<span class="tag">${esc(N(Store.get.insurer(p.insurer).name))}</span>` : `<span class="muted small">${L('نقدي', 'Self-pay')}</span>` }
    ], rows.slice(0, 200), { rowAttr: p => `class="clickable" data-p="${p.id}"` })}</div></div>`;
    el.querySelectorAll('[data-p]').forEach(r => r.onclick = () => App.go('#/patients/' + r.dataset.p));
    const q = el.querySelector('#pQ'); let t; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { st.q = q.value.trim(); App.refresh(); const n = document.getElementById('pQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); };
    el.querySelectorAll('[data-f]').forEach(s => s.onchange = () => { st[s.dataset.f] = s.value; App.refresh(); });
    const nb = el.querySelector('#pNew'); if (nb) nb.onclick = newPatient;
  }
  function newPatient() {
    const { L, icon } = UI; const db = Store.db;
    UI.modal({
      title: `${icon('user-plus')} ${L('تسجيل مريض جديد', 'Register patient')}`,
      body: `<form id="npF" class="form-grid">
        <div class="field full"><label>${L('الاسم الرباعي', 'Full name')}</label><input class="input" name="name" required></div>
        <div class="field"><label>${L('الهاتف', 'Phone')}</label><input class="input" name="phone" dir="ltr" required></div>
        <div class="field"><label>${L('تاريخ الميلاد', 'Date of birth')}</label><input class="input" type="date" name="dob" required></div>
        <div class="field"><label>${L('النوع', 'Gender')}</label><select class="select" name="gender"><option value="M">${L('ذكر', 'Male')}</option><option value="F">${L('أنثى', 'Female')}</option></select></div>
        <div class="field"><label>${L('فصيلة الدم', 'Blood type')}</label><select class="select" name="blood">${['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => `<option>${b}</option>`).join('')}</select></div>
        <div class="field"><label>${L('شركة التأمين', 'Insurance')}</label><select class="select" name="insurer">${UI.options(db.insurers, '', L('بدون تأمين', 'None'))}</select></div>
        <div class="field"><label>${L('حساسية', 'Allergies')}</label><input class="input" name="allergies" placeholder="${L('مفصولة بفاصلة', 'comma separated')}"></div>
      </form>`,
      footer: `<button class="btn" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn primary" id="npS">${L('حفظ', 'Save')}</button>`,
      onMount(r, close) {
        r.querySelector('#npS').onclick = () => {
          const f = r.querySelector('#npF'); if (!f.reportValidity()) return; const d = UI.formData(f);
          const p = Store.addPatient({ name: { ar: d.name, en: d.name }, phone: d.phone, dob: d.dob, gender: d.gender, blood: d.blood, insurer: d.insurer || null, allergies: d.allergies ? d.allergies.split(/[,،]/).map(x => ({ ar: x.trim(), en: x.trim() })) : [] });
          close(); App.go('#/patients/' + p.id);
        };
      }
    });
  }

  function profile(el, id) {
    const { L, N, esc, icon, nf, money } = UI; const db = Store.db;
    const p = Store.get.patient(id);
    if (!p || !Store.patients().some(x => x.id === id)) { el.innerHTML = UI.empty(L('لا تملك صلاحية عرض هذا الملف أو المريض غير موجود', 'Patient not found or not accessible'), 'lock'); return; }
    const encs = db.encounters.filter(e => e.patientId === id).sort((a, b) => b.date.localeCompare(a.date));
    const appts = db.appointments.filter(a => a.patientId === id);
    const upcoming = appts.filter(a => ['pending', 'confirmed', 'arrived', 'in_progress'].includes(a.status) && new Date(a.start) > new Date(Date.now() - 864e5 / 2)).sort((a, b) => a.start.localeCompare(b.start));
    const invs = db.invoices.filter(i => i.patientId === id);
    const rxs = db.prescriptions.filter(r => r.patientId === id).sort((a, b) => b.date.localeCompare(a.date));
    const labs = db.labOrders.filter(l => l.patientId === id);
    const notes = db.progressNotes.filter(n => n.patientId === id).sort((a, b) => b.at.localeCompare(a.at));
    const subs = db.subscriptions.filter(s => s.patientId === id);
    const items = []; encs.forEach(e => e.items.forEach(it => items.push(Object.assign({ enc: e }, it))));
    const billed = invs.reduce((s, i) => s + i.total, 0), outstanding = invs.reduce((s, i) => s + Store.invBalance(i), 0);
    const showMoney = !Store.isDoctor();
    const last = encs[0];
    const TABS = [['overview', L('نظرة عامة', 'Overview'), 'layout-grid'], ['visits', L('الزيارات والتقارير', 'Visits'), 'stethoscope', encs.length], ['health', L('متابعة الحالة الصحية', 'Health tracking'), 'heart-pulse'], ['items', L('المستلزمات المستخدمة', 'Items used'), 'boxes', items.length], ['rx', L('الروشتات', 'Prescriptions'), 'file-text', rxs.length], ['lab', L('التحاليل', 'Lab'), 'flask-conical', labs.length]];
    if (showMoney) TABS.push(['invoices', L('الفواتير', 'Invoices'), 'receipt-text', invs.length]);
    TABS.push(['notes', L('ملاحظات المتابعة', 'Progress notes'), 'notebook-pen', notes.length]);
    if (!TABS.some(t => t[0] === st.profileTab)) st.profileTab = 'overview';

    el.innerHTML = `
    ${App.pageHead(esc(N(p.name)), `<span class="ltr">${p.id}</span> · ${L('مسجل منذ', 'Registered')} ${UI.fdate(p.createdAt)}`,
      `${Store.can('bookings') && !Store.isDoctor() ? `<button class="btn" id="ppBook">${icon('calendar-plus')}${L('حجز موعد', 'Book')}</button>` : ''}${Store.isDoctor() || Store.isAdmin() ? `<button class="btn primary" id="ppNote">${icon('notebook-pen')}${L('ملاحظة متابعة', 'Progress note')}</button>` : ''}`,
      `<a href="#/patients">${L('المرضى', 'Patients')}</a> ${icon(UI.lang === 'ar' ? 'chevron-left' : 'chevron-right', 'ic-sm')} ${L('الملف الطبي', 'Medical file')}`)}
    <div class="card" style="margin-bottom:16px"><div class="card-body"><div class="profile-head">
      ${UI.avatar(p.name, 'lg')}
      <div class="grow" style="min-width:240px">
        <div class="row wrap" style="gap:8px">${p.chronic.map(c => `<span class="badge tone-warning">${icon('activity', 'ic-sm')}${esc(N(c))}</span>`).join('')}${p.allergies.map(a => `<span class="badge tone-danger">${icon('triangle-alert', 'ic-sm')}${L('حساسية', 'Allergy')}: ${esc(N(a))}</span>`).join('')}${!p.chronic.length && !p.allergies.length ? `<span class="badge tone-success">${L('لا توجد أمراض مزمنة أو حساسية مسجلة', 'No chronic conditions or allergies')}</span>` : ''}</div>
        <dl class="kv" style="margin-top:12px;grid-template-columns:repeat(4,auto 1fr)">
          <dt>${L('العمر', 'Age')}</dt><dd>${nf(UI.age(p.dob))} ${L('سنة', 'yrs')}</dd><dt>${L('النوع', 'Sex')}</dt><dd>${p.gender === 'F' ? L('أنثى', 'Female') : L('ذكر', 'Male')}</dd>
          <dt>${L('فصيلة الدم', 'Blood')}</dt><dd>${p.blood || '—'}</dd><dt>${L('الهاتف', 'Phone')}</dt><dd class="ltr">${p.phone}</dd>
          <dt>${L('التأمين', 'Insurance')}</dt><dd>${p.insurer ? esc(N(Store.get.insurer(p.insurer).name)) : L('نقدي', 'Self-pay')}</dd><dt>${L('الفرع', 'Branch')}</dt><dd>${esc(N(Store.get.branch(p.branch).name))}</dd>
        </dl>
      </div>
      <div class="grid g2" style="min-width:280px;gap:10px">
        <div class="card" style="padding:12px 14px"><div class="xs muted">${L('عدد الزيارات', 'Visits')}</div><div style="font-size:20px;font-weight:700">${nf(encs.length)}</div></div>
        <div class="card" style="padding:12px 14px"><div class="xs muted">${L('مواعيد قادمة', 'Upcoming')}</div><div style="font-size:20px;font-weight:700">${nf(upcoming.length)}</div></div>
        ${showMoney ? `<div class="card" style="padding:12px 14px"><div class="xs muted">${L('إجمالي الفواتير', 'Total billed')}</div><div style="font-size:16px;font-weight:700">${money(billed)}</div></div>
        <div class="card" style="padding:12px 14px"><div class="xs muted">${L('مستحق', 'Outstanding')}</div><div style="font-size:16px;font-weight:700;color:${outstanding ? 'var(--danger)' : 'inherit'}">${money(outstanding)}</div></div>` : `<div class="card" style="padding:12px 14px;grid-column:1/-1"><div class="xs muted">${L('آخر حالة', 'Last status')}</div><div>${last ? UI.outcomeBadge(last.outcome) : '—'}</div></div>`}
      </div>
    </div></div>
    <div style="padding:0 12px;border-top:1px solid var(--border)"><div class="tabs" style="border:0">${TABS.map(t => `<button data-pt="${t[0]}" class="${st.profileTab === t[0] ? 'on' : ''}">${icon(t[2], 'ic-sm')}${t[1]}${t[3] != null ? ` <span class="cnt">${nf(t[3])}</span>` : ''}</button>`).join('')}</div></div></div>
    <div id="ppBody"></div>`;

    const body = el.querySelector('#ppBody');
    const encCard = e => {
      const d = Store.get.doctor(e.doctorId), dp = Store.get.dept(e.dept); const mine = !Store.isDoctor() || e.doctorId === Store.myDoctorId();
      const vit = Object.entries(e.vitals || {}).map(([k, v]) => `<span class="tag">${vitLabel(k)}: <b class="ltr">${k === 'bpSys' ? v + '/' + (e.vitals.bpDia || '') : v}</b></span>`).filter((_, i, arr) => !Object.keys(e.vitals)[i].startsWith('bpDia')).join(' ');
      return `<div class="tl-item"><div class="tl-card">
        <div class="row between wrap"><div class="row"><span class="dept-dot" style="background:${dp.color}"></span><b>${esc(N(dp.name))}</b><span class="muted small">· ${esc(N(d.name))}</span>${!mine ? `<span class="tag">${L('عيادة أخرى', 'Other clinic')}</span>` : ''}</div><div class="row"><span class="small muted">${UI.fdt(e.date)}</span>${UI.outcomeBadge(e.outcome)}</div></div>
        <dl class="kv" style="margin-top:10px"><dt>${L('الشكوى', 'Complaint')}</dt><dd>${esc(N(e.complaint))}</dd><dt>${L('التشخيص', 'Diagnosis')}</dt><dd><b>${esc(N(e.diagnosis))}</b></dd><dt>${L('ملاحظات الطبيب', 'Notes')}</dt><dd>${esc(N(e.notes)) || '—'}</dd></dl>
        ${vit ? `<div class="chips" style="margin-top:10px">${vit}</div>` : ''}
        ${e.items.length ? `<div class="section-title" style="margin-top:12px">${icon('boxes', 'ic-sm')}${L('المستلزمات المستخدمة', 'Items used')}</div><div class="chips">${e.items.map(it => { const pr = Store.get.product(it.productId); return `<span class="tag">${esc(N(pr.name))} × ${nf(it.qty)} <span class="xs muted">(${it.by === 'reception' ? L('أضافها الاستقبال', 'by reception') : L('الطبيب', 'doctor')})</span></span>`; }).join('')}</div>` : ''}
        <div class="row" style="margin-top:12px;gap:8px">${e.rxId ? `<button class="btn sm" data-rx="${e.rxId}">${icon('file-text')}${L('الروشتة', 'Prescription')}</button>` : ''}${(Store.can('sales') || Store.me().role === 'reception' || Store.isAdmin()) && e.invoiceId ? `<button class="btn sm" data-inv="${e.invoiceId}">${icon('receipt-text')}${L('الفاتورة', 'Invoice')}</button>` : ''}${(['reception', 'admin'].includes(Store.me().role) || (Store.isDoctor() && mine)) ? `<button class="btn sm soft" data-items="${e.id}">${icon('package-plus')}${L('إضافة مستلزمات', 'Add items')}</button>` : ''}${e.followUp ? `<span class="badge tone-info">${icon('calendar-clock', 'ic-sm')}${L('يحتاج متابعة', 'Follow-up needed')}</span>` : ''}</div>
      </div></div>`;
    };
    const tab = st.profileTab;
    if (tab === 'overview') {
      body.innerHTML = `<div class="grid g-main">
        <div class="stack">
          <div class="card"><div class="card-head"><h3>${icon('calendar-clock')}${L('المواعيد القادمة', 'Upcoming appointments')}</h3></div><div class="card-body flush">${UI.table([{ label: L('الموعد', 'When'), render: a => `<b>${UI.fdt(a.start)}</b>` }, { label: L('العيادة', 'Clinic'), render: a => `${esc(N(Store.get.dept(a.dept).name))}<div class="cell-sub">${esc(N(Store.get.doctor(a.doctorId).name))}</div>` }, { label: L('المصدر', 'Source'), render: a => UI.srcBadge(a.source) }, { label: L('الحالة', 'Status'), render: a => UI.statusBadge(a.status) }], upcoming, { empty: L('لا توجد مواعيد قادمة', 'No upcoming appointments') })}</div></div>
          <div class="card"><div class="card-head"><h3>${icon('history')}${L('آخر زيارة', 'Latest visit')}</h3></div><div class="card-body">${last ? `<div class="timeline">${encCard(last)}</div>` : UI.empty(L('لا توجد زيارات سابقة', 'No visits yet'))}</div></div>
        </div>
        <div class="stack">
          <div class="card"><div class="card-head"><h3>${icon('heart-pulse')}${L('آخر قراءات', 'Latest readings')}</h3></div><div class="card-body">${last && last.vitals ? `<dl class="kv">${Object.entries(last.vitals).filter(([k]) => k !== 'bpDia').map(([k, v]) => `<dt>${vitLabel(k)}</dt><dd class="ltr">${k === 'bpSys' ? v + '/' + last.vitals.bpDia + ' mmHg' : v}</dd>`).join('')}</dl>` : '—'}</div></div>
          <div class="card"><div class="card-head"><h3>${icon('chart-spline')}${L('مسار التحسن', 'Progress trend')}</h3></div><div class="card-body">${encs.length ? `<div class="row wrap" style="gap:8px">${['improved', 'stable', 'worse'].map(o => `<span class="badge ${UI.OUTCOME[o][0]}">${L(UI.OUTCOME[o][1], UI.OUTCOME[o][2])}: ${nf(encs.filter(e => e.outcome === o).length)}</span>`).join('')}</div><div class="section-title" style="margin-top:14px">${L('آخر الزيارات', 'Latest visits')}</div><div class="stack" style="gap:6px">${encs.slice(0, 6).map(e => `<div class="row between small"><span>${UI.fdate(e.date, { day: 'numeric', month: 'short' })} · ${esc(N(e.diagnosis))}</span>${UI.outcomeBadge(e.outcome)}</div>`).join('')}</div>` : '—'}</div></div>
          ${subs.length ? `<div class="card"><div class="card-head"><h3>${icon('package')}${L('الباقات', 'Packages')}</h3></div><div class="card-body stack" style="gap:10px">${subs.map(s => `<div><div class="row between small"><b>${esc(N(Store.get.pkg(s.packageId).name))}</b><span>${nf(s.used)}/${nf(s.total)}</span></div><div class="progress"><span style="width:${s.used / s.total * 100}%"></span></div></div>`).join('')}</div></div>` : ''}
        </div></div>`;
      const c = body.querySelector('#ovTrend');
      if (c) { const ch = encs.slice().reverse(); UI.chart(c, { type: 'line', data: { labels: ch.map(e => UI.fdate(e.date, { day: 'numeric', month: 'short' })), datasets: [{ label: L('مؤشر الحالة', 'Status index'), data: ch.map(e => e.outcome === 'improved' ? 2 : e.outcome === 'stable' ? 1 : 0), borderColor: UI.cssVar('--primary'), backgroundColor: UI.cssVar('--primary') + '22', fill: true, tension: .35, stepped: false }] }, options: { plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 2, ticks: { stepSize: 1, callback: v => [L('تراجع', 'Worse'), L('مستقر', 'Stable'), L('تحسن', 'Improved')][v] } }, x: { grid: { display: false } } } } }); }
    } else if (tab === 'visits') {
      body.innerHTML = `<div class="card"><div class="card-body">${encs.length ? `<div class="timeline">${encs.map(encCard).join('')}</div>` : UI.empty(L('لا توجد زيارات', 'No visits'))}</div></div>`;
    } else if (tab === 'health') {
      const ch = encs.slice().reverse().filter(e => e.vitals);
      const has = k => ch.some(e => e.vitals[k] != null);
      const blocks = [['bp', L('ضغط الدم', 'Blood pressure'), has('bpSys')], ['glucose', L('السكر', 'Blood glucose'), has('glucose')], ['weight', L('الوزن', 'Weight'), has('weight')], ['pain', L('درجة الألم', 'Pain score'), has('painScore')], ['va', L('حدة الإبصار', 'Visual acuity'), has('visualAcuity')]].filter(b => b[2]);
      body.innerHTML = ch.length ? `<div class="callout tone-info" style="margin-bottom:16px">${icon('info')}<div>${L('يتم تحديث هذه المنحنيات تلقائياً من العلامات الحيوية المسجلة في كل زيارة، ليتابع الطبيب تطور حالة المريض.', 'These charts update automatically from vitals recorded at each visit so the doctor can track progress.')}</div></div><div class="grid g2">${blocks.map(b => `<div class="card"><div class="card-head"><h3>${b[1]}</h3></div><div class="card-body"><div class="chart-box"><canvas id="h_${b[0]}"></canvas></div></div></div>`).join('')}</div>` : UI.empty(L('لا توجد قراءات بعد', 'No readings yet'), 'heart-pulse');
      const labels = ch.map(e => UI.fdate(e.date, { day: 'numeric', month: 'short' }));
      const line = (id, sets, opt) => { const c = body.querySelector('#h_' + id); if (c) UI.chart(c, { type: 'line', data: { labels, datasets: sets.map(s => Object.assign({ tension: .3, pointRadius: 3, spanGaps: true }, s)) }, options: Object.assign({ scales: { x: { grid: { display: false } } } }, opt || {}) }); };
      line('bp', [{ label: L('انقباضي', 'Systolic'), data: ch.map(e => e.vitals.bpSys), borderColor: '#d93f45', backgroundColor: '#d93f45' }, { label: L('انبساطي', 'Diastolic'), data: ch.map(e => e.vitals.bpDia), borderColor: '#5b5bd6', backgroundColor: '#5b5bd6' }]);
      line('glucose', [{ label: 'mg/dL', data: ch.map(e => e.vitals.glucose), borderColor: '#e58a1f', backgroundColor: '#e58a1f' }]);
      line('weight', [{ label: 'kg', data: ch.map(e => e.vitals.weight), borderColor: '#0e8f82', backgroundColor: '#0e8f82' }]);
      line('pain', [{ label: '0-10', data: ch.map(e => e.vitals.painScore), borderColor: '#d6409f', backgroundColor: '#d6409f' }], { scales: { y: { min: 0, max: 10 } } });
      line('va', [{ label: '/10', data: ch.map(e => e.vitals.visualAcuity ? parseFloat(e.vitals.visualAcuity) : null), borderColor: '#0b7fc0', backgroundColor: '#0b7fc0' }], { scales: { y: { min: 0, max: 10 } } });
    } else if (tab === 'items') {
      const agg = {}; items.forEach(it => { const a = agg[it.productId] || (agg[it.productId] = { qty: 0, n: 0 }); a.qty += it.qty; a.n++; });
      body.innerHTML = `<div class="grid g-main"><div class="card"><div class="card-head"><h3>${icon('list')}${L('سجل المستلزمات لكل زيارة', 'Items per visit')}</h3></div><div class="card-body flush">${UI.table([
        { label: L('التاريخ', 'Date'), render: it => UI.fdt(it.at || it.enc.date) }, { label: L('الصنف', 'Item'), render: it => `<b>${esc(N(Store.get.product(it.productId).name))}</b>` },
        { label: L('الفئة', 'Category'), render: it => `<span class="tag">${esc(N(Store.get.category(Store.get.product(it.productId).cat).name))}</span>` }, { label: L('الكمية', 'Qty'), render: it => nf(it.qty) },
        { label: L('العيادة', 'Clinic'), render: it => esc(N(Store.get.dept(it.enc.dept).name)) }, { label: L('بواسطة', 'By'), render: it => it.by === 'reception' ? `<span class="badge tone-accent">${L('الاستقبال', 'Reception')}</span>` : `<span class="badge tone-primary">${L('الطبيب', 'Doctor')}</span>` }
      ], items.sort((a, b) => (b.at || '').localeCompare(a.at || '')), { empty: L('لم تُستخدم مستلزمات', 'No items used') })}</div></div>
      <div class="card"><div class="card-head"><h3>${icon('sigma')}${L('الإجمالي حسب الصنف', 'Totals by item')}</h3></div><div class="card-body flush">${UI.table([{ label: L('الصنف', 'Item'), render: x => esc(N(Store.get.product(x[0]).name)) }, { label: L('الكمية', 'Qty'), render: x => `<b>${nf(x[1].qty)}</b>` }].concat(showMoney ? [{ label: L('القيمة', 'Value'), render: x => money(x[1].qty * (Store.get.product(x[0]).price || Store.get.product(x[0]).cost)) }] : []), Object.entries(agg))}</div></div></div>`;
    } else if (tab === 'rx') {
      body.innerHTML = `<div class="grid g2">${rxs.map(r => `<div class="card"><div class="card-head"><h3>${icon('file-text')}<span class="ltr">${r.id}</span></h3><span class="small muted">${UI.fdate(r.date)}</span></div><div class="card-body"><div class="small muted" style="margin-bottom:8px">${esc(N(Store.get.doctor(r.doctorId).name))}</div>${r.items.map(i => `<div class="list-item" style="padding:8px 0"><span class="k-icon tone-accent" style="width:30px;height:30px;border-radius:8px;display:grid;place-items:center">${icon('pill', 'ic-sm')}</span><div><b>${esc(N(i.drug))}</b><div class="small muted">${esc(N(i.dose))}</div></div></div>`).join('')}</div></div>`).join('') || `<div class="card">${UI.empty(L('لا توجد روشتات', 'No prescriptions'))}</div>`}</div>`;
    } else if (tab === 'lab') {
      body.innerHTML = `<div class="card"><div class="card-body flush">${labTable(labs)}</div></div>`;
    } else if (tab === 'invoices') {
      body.innerHTML = `<div class="card"><div class="card-body flush">${invTable(invs.slice().reverse())}</div></div>`;
    } else if (tab === 'notes') {
      body.innerHTML = `<div class="card"><div class="card-body">${notes.length ? notes.map(n => `<div class="list-item" style="padding:12px 0;align-items:flex-start">${UI.avatar(Store.get.user(n.userId).name)}<div class="grow"><div class="row between"><b>${esc(N(Store.get.user(n.userId).name))}</b><span class="xs muted">${UI.fdt(n.at)}</span></div><div style="margin-top:4px;white-space:pre-wrap">${esc(n.text)}</div></div></div>`).join('') : UI.empty(L('لا توجد ملاحظات متابعة. يمكن للطبيب إضافة ملاحظات بين الزيارات.', 'No progress notes. Doctors can add notes between visits.'), 'notebook-pen')}</div></div>`;
    }
    UI.icons(el);
    el.querySelectorAll('[data-pt]').forEach(b => b.onclick = () => { st.profileTab = b.dataset.pt; App.refresh(); });
    el.querySelectorAll('[data-rx]').forEach(b => b.onclick = () => rxModal(b.dataset.rx));
    el.querySelectorAll('[data-inv]').forEach(b => b.onclick = () => Comp.invoiceModal(b.dataset.inv));
    el.querySelectorAll('[data-items]').forEach(b => b.onclick = () => Comp.addItemsModal(b.dataset.items));
    const bk = el.querySelector('#ppBook'); if (bk) bk.onclick = () => { Comp.newBookingModal({ dept: p.prefs[0] }); setTimeout(() => { const i = document.getElementById('patPick'); if (i) i.value = `${p.id} — ${N(p.name)}`; }, 30); };
    const nt = el.querySelector('#ppNote'); if (nt) nt.onclick = () => UI.modal({
      title: `${icon('notebook-pen')} ${L('ملاحظة متابعة', 'Progress note')}`, body: `<textarea class="textarea" id="pnT" rows="5" placeholder="${L('مثال: المريض تواصل هاتفياً، الألم تحسن بنسبة 50%...', 'e.g. Patient called; pain improved by 50%...')}"></textarea>`,
      footer: `<button class="btn" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn primary" id="pnS">${L('حفظ', 'Save')}</button>`,
      onMount(r, close) { r.querySelector('#pnS').onclick = () => { const t = r.querySelector('#pnT').value.trim(); if (!t) return; Store.addProgressNote(id, t); st.profileTab = 'notes'; close(); App.refresh(); }; }
    });
  }
  return { render(el, params) { if (params[0]) profile(el, params[0]); else { st.profileTab = 'overview'; list(el); } } };
})();

function vitLabel(k) { const L = UI.L; return ({ bpSys: L('الضغط', 'BP'), bpDia: L('الضغط الانبساطي', 'Diastolic'), pulse: L('النبض', 'Pulse'), temp: L('الحرارة', 'Temp'), weight: L('الوزن', 'Weight'), glucose: L('السكر', 'Glucose'), visualAcuity: L('حدة الإبصار', 'Visual acuity'), painScore: L('الألم', 'Pain') })[k] || k; }
function invTable(invs) {
  const { L, N, esc, money, icon } = UI;
  const t = UI.table([
    { label: L('رقم الفاتورة', 'Invoice'), render: i => `<b class="ltr">${i.id}</b>` }, { label: L('التاريخ', 'Date'), render: i => UI.fdt(i.date) },
    { label: L('المريض', 'Patient'), render: i => `<a href="#/patients/${i.patientId}">${esc(N(Store.get.patient(i.patientId).name))}</a>` },
    { label: L('النوع', 'Type'), render: i => `<span class="tag">${i.kind === 'visit' ? L('كشف', 'Visit') : i.kind === 'package' ? L('باقة', 'Package') : L('منتجات', 'Products')}</span>${i.dept ? `<div class="cell-sub">${esc(N(Store.get.dept(i.dept).name))}</div>` : ''}` },
    { label: L('الإجمالي', 'Total'), render: i => `<b class="num">${money(i.total)}</b>` }, { label: L('التأمين', 'Insurance'), render: i => i.insShare ? money(i.insShare) : '—' },
    { label: L('المتبقي', 'Balance'), render: i => { const b = Store.invBalance(i); return b ? `<b style="color:var(--danger)">${money(b)}</b>` : `<span class="muted">0</span>`; } },
    { label: L('الدفع', 'Method'), render: i => `<span class="small">${UI.methodLabel(i.method)}</span>` }, { label: L('الحالة', 'Status'), render: i => UI.payBadge(i.status) },
    { label: '', render: i => `<button class="btn sm icon" data-inv="${i.id}">${icon('eye')}</button>` }
  ], invs, { empty: L('لا توجد فواتير', 'No invoices') });
  setTimeout(() => document.querySelectorAll('[data-inv]').forEach(b => { if (!b._b) { b._b = 1; b.onclick = () => Comp.invoiceModal(b.dataset.inv); } }), 0);
  return t;
}
function labTable(labs) {
  const { L, N, esc } = UI;
  const TN = { cbc: [L('صورة دم كاملة', 'CBC'), 'Hb g/dL'], lipid: [L('دهون ثلاثية / كوليسترول', 'Lipid profile'), 'mg/dL'], hba1c: [L('السكر التراكمي', 'HbA1c'), '%'] };
  return UI.table([
    { label: L('رقم الطلب', 'Order'), render: l => `<b class="ltr">${l.id}</b>` }, { label: L('التاريخ', 'Date'), render: l => UI.fdate(l.date) },
    { label: L('المريض', 'Patient'), render: l => `<a href="#/patients/${l.patientId}">${esc(N(Store.get.patient(l.patientId).name))}</a>` },
    { label: L('الطبيب', 'Doctor'), render: l => esc(N(Store.get.doctor(l.doctorId).name)) },
    { label: L('التحاليل', 'Tests'), render: l => l.tests.map(t => `<span class="tag">${TN[t][0]}</span>`).join(' ') },
    { label: L('النتائج', 'Results'), render: l => l.results ? l.tests.map(t => `<span class="small"><b class="ltr">${l.results[t]}</b> ${TN[t][1]}</span>`).join(' · ') : '—' },
    { label: L('الحالة', 'Status'), render: l => l.status === 'ready' ? `<span class="badge tone-success">${L('النتيجة جاهزة', 'Ready')}</span>` : `<span class="badge tone-warning">${L('تم سحب العينة', 'Sample taken')}</span>` }
  ], labs.slice().sort((a, b) => b.date.localeCompare(a.date)), { empty: L('لا توجد تحاليل', 'No lab orders') });
}
function rxModal(id) {
  const { L, N, esc, icon } = UI; const r = Store.db.prescriptions.find(x => x.id === id); const p = Store.get.patient(r.patientId), d = Store.get.doctor(r.doctorId);
  UI.modal({
    title: `${icon('file-text')} ${L('روشتة', 'Prescription')} <span class="ltr">${r.id}</span>`,
    body: `<div class="row between" style="margin-bottom:12px"><div><b>${esc(N(d.name))}</b><div class="small muted">${esc(N(d.title))}</div></div><div class="small muted">${UI.fdate(r.date)}</div></div>
    <div class="callout tone-muted" style="margin-bottom:12px">${L('المريض', 'Patient')}: <b>${esc(N(p.name))}</b> · ${UI.age(p.dob)} ${L('سنة', 'yrs')}</div>
    <div style="font-size:26px;font-weight:700;color:var(--primary)">℞</div>${r.items.map((i, k) => `<div class="list-item" style="padding:10px 0"><b>${k + 1}.</b><div><b>${esc(N(i.drug))}</b><div class="small muted">${esc(N(i.dose))}</div></div></div>`).join('')}`,
    footer: `<button class="btn" data-close>${L('إغلاق', 'Close')}</button><button class="btn" id="rxP">${icon('printer')}${L('طباعة', 'Print')}</button>`,
    onMount(m) { m.querySelector('#rxP').onclick = () => { document.body.classList.add('printing-modal'); window.print(); setTimeout(() => document.body.classList.remove('printing-modal'), 500); }; }
  });
}

/* Medical records (التقارير الطبية) */
App.pages.records = (function () {
  const st = { dept: '', outcome: '', q: '' };
  return {
    render(el) {
      const { L, N, esc, icon, nf } = UI; const db = Store.db;
      const encs = Store.encounters().filter(e => (!st.dept || e.dept === st.dept) && (!st.outcome || e.outcome === st.outcome) && (!st.q || N(e.diagnosis).includes(st.q) || N(Store.get.patient(e.patientId).name).toLowerCase().includes(st.q.toLowerCase()))).slice().sort((a, b) => b.date.localeCompare(a.date));
      el.innerHTML = `${App.pageHead(L('التقارير الطبية', 'Medical records'), L('كل زيارة مكتملة تُحفظ كتقرير طبي في ملف المريض', 'Every completed visit is saved as a medical record in the patient file'))}
      <div class="card"><div class="card-body filters" style="border-bottom:1px solid var(--border)">
        <input class="input sm" id="rQ" placeholder="${L('بحث بالتشخيص أو اسم المريض', 'Search diagnosis or patient')}" value="${esc(st.q)}" style="min-width:240px">
        ${Store.isDoctor() ? '' : `<select class="select sm" data-f="dept">${UI.options(db.departments, st.dept, L('كل العيادات', 'All clinics'))}</select>`}
        <select class="select sm" data-f="outcome"><option value="">${L('كل الحالات', 'All outcomes')}</option>${Object.keys(UI.OUTCOME).map(o => `<option value="${o}" ${st.outcome === o ? 'selected' : ''}>${L(UI.OUTCOME[o][1], UI.OUTCOME[o][2])}</option>`).join('')}</select>
        <span class="muted small">${nf(encs.length)} ${L('تقرير', 'records')}</span>
      </div><div class="card-body flush">${UI.table([
        { label: L('التاريخ', 'Date'), render: e => UI.fdt(e.date) },
        { label: L('المريض', 'Patient'), render: e => `<a class="cell-main" href="#/patients/${e.patientId}">${esc(N(Store.get.patient(e.patientId).name))}</a>` },
        { label: L('العيادة / الطبيب', 'Clinic / doctor'), render: e => `${esc(N(Store.get.dept(e.dept).name))}<div class="cell-sub">${esc(N(Store.get.doctor(e.doctorId).name))}</div>` },
        { label: L('الشكوى', 'Complaint'), render: e => esc(N(e.complaint)) }, { label: L('التشخيص', 'Diagnosis'), render: e => `<b>${esc(N(e.diagnosis))}</b>` },
        { label: L('المستلزمات', 'Items'), render: e => nf(e.items.length) }, { label: L('الحالة', 'Outcome'), render: e => UI.outcomeBadge(e.outcome) }
      ], encs.slice(0, 250))}</div></div>`;
      el.querySelectorAll('[data-f]').forEach(s => s.onchange = () => { st[s.dataset.f] = s.value; App.refresh(); });
      const q = el.querySelector('#rQ'); let t; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { st.q = q.value.trim(); App.refresh(); const n = document.getElementById('rQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); };
    }
  };
})();

App.pages.prescriptions = {
  render(el) {
    const { L, N, esc, icon } = UI; const d = Store.myDoctorId();
    const rxs = Store.db.prescriptions.filter(r => !d || r.doctorId === d).slice().sort((a, b) => b.date.localeCompare(a.date));
    el.innerHTML = `${App.pageHead(L('الروشتات', 'Prescriptions'), L('الروشتات الإلكترونية الصادرة من العيادات — قابلة للطباعة', 'Electronic prescriptions issued by clinics — printable'))}
    <div class="card"><div class="card-body flush">${UI.table([
      { label: L('رقم الروشتة', 'Rx'), render: r => `<b class="ltr">${r.id}</b>` }, { label: L('التاريخ', 'Date'), render: r => UI.fdate(r.date) },
      { label: L('المريض', 'Patient'), render: r => `<a href="#/patients/${r.patientId}">${esc(N(Store.get.patient(r.patientId).name))}</a>` },
      { label: L('الطبيب', 'Doctor'), render: r => esc(N(Store.get.doctor(r.doctorId).name)) },
      { label: L('الأدوية', 'Medicines'), render: r => r.items.map(i => `<span class="tag">${esc(N(i.drug))}</span>`).join(' ') },
      { label: '', render: r => `<button class="btn sm" data-rx="${r.id}">${icon('eye')}${L('عرض', 'View')}</button>` }
    ], rxs.slice(0, 200))}</div></div>`;
    el.querySelectorAll('[data-rx]').forEach(b => b.onclick = () => rxModal(b.dataset.rx));
  }
};

App.pages.lab = {
  render(el) {
    const { L, nf } = UI; const d = Store.myDoctorId();
    const labs = Store.db.labOrders.filter(l => !d || l.doctorId === d);
    el.innerHTML = `${App.pageHead(L('المعمل', 'Laboratory'), L('طلبات التحاليل من العيادات ونتائجها — تظهر تلقائياً في ملف المريض', 'Lab orders from clinics and their results — shown in the patient file'))}
    <div class="grid g3" style="margin-bottom:16px">${UI.kpi(L('إجمالي الطلبات', 'Total orders'), nf(labs.length), 'flask-conical', 'primary')}${UI.kpi(L('بانتظار النتيجة', 'Awaiting result'), nf(labs.filter(l => l.status !== 'ready').length), 'hourglass', 'warning')}${UI.kpi(L('نتائج جاهزة', 'Results ready'), nf(labs.filter(l => l.status === 'ready').length), 'circle-check', 'success')}</div>
    <div class="card"><div class="card-body flush">${labTable(labs)}</div></div>`;
  }
};

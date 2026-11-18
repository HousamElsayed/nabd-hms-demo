/* Doctor performance (half-month owner report) + report center */
App.pages.performance = (function () {
  const st = { period: 1 }; // default: last completed half-month (the report the owner receives)
  const months = () => UI.lang === 'ar' ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function periodLabel(p) { const last = new Date(p.to - 864e5).getDate(); return `${UI.nf(p.half === 1 ? 1 : 16)}–${UI.nf(last)} ${months()[p.month]} ${UI.nf(p.year).replace(/[,٬]/g, '')}`; }
  function delta(cur, prev, invert, unit) {
    if (prev == null || !isFinite(prev)) return '';
    const d = cur - prev; if (Math.abs(d) < 0.05) return `<span class="xs muted">—</span>`;
    const good = invert ? d < 0 : d > 0;
    return `<span class="xs ${good ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${UI.nf(Math.abs(d), unit === '%' || Math.abs(d) < 10 ? 1 : 0)}${unit || ''}</span>`;
  }
  return {
    render(el) {
      const { L, N, esc, icon, money, nf, pct } = UI; const db = Store.db;
      const periods = Store.periods(); const per = periods[st.period]; const prev = periods[st.period + 1];
      const docs = Store.isDoctor() ? [Store.get.doctor(Store.myDoctorId())] : db.doctors;
      const rows = docs.map(d => Store.doctorPerformance(d.id, per.from, per.to)).sort((a, b) => b.score - a.score);
      const prevRows = prev ? Object.fromEntries(docs.map(d => [d.id, Store.doctorPerformance(d.id, prev.from, prev.to)])) : {};
      const sum = k => rows.reduce((s, r) => s + r[k], 0);
      const avgW = (k, w) => { const t = rows.reduce((s, r) => s + r[w], 0); return t ? rows.reduce((s, r) => s + r[k] * r[w], 0) / t : 0; };
      const ins = Store.insights(rows);
      const isDoc = Store.isDoctor();
      const pending = per.current;
      const nextIssue = per.half === 1 ? new Date(per.year, per.month, 16) : new Date(per.year, per.month + 1, 1);

      el.innerHTML = `${App.pageHead(isDoc ? L('تقرير أدائي', 'My performance report') : L('تقرير أداء الأطباء — نصف شهري', 'Doctor performance — half-month report'),
        isDoc ? L('أداؤك ونسبتك من الحجوزات خلال الفترة', 'Your performance and earnings for the period') : L('تقرير للمالك يصدر مرتين شهرياً (من 1 إلى 15 ومن 16 لآخر الشهر) لكشف نقاط الضعف وزيادة الأداء والمبيعات', 'Owner report issued twice a month (1–15 and 16–end) to expose weak points and grow performance and sales'),
        `<select class="select" id="perSel" style="width:auto">${periods.map((p, i) => `<option value="${i}" ${i === st.period ? 'selected' : ''}>${periodLabel(p)}${p.current ? ' — ' + L('الفترة الحالية', 'current') : ''}</option>`).join('')}</select>
         <button class="btn" id="perCsv">${icon('download')}${L('تصدير', 'Export')}</button><button class="btn primary" id="perPrint">${icon('printer')}${L('طباعة التقرير PDF', 'Print / PDF')}</button>`)}
      ${pending ? `<div class="callout tone-info" style="margin-bottom:16px">${icon('calendar-clock')}<div>${L(`الفترة الحالية لم تكتمل بعد — الأرقام حتى اليوم. سيصدر التقرير النهائي تلقائياً ويُرسل للمالك يوم ${UI.fdate(nextIssue, { day: 'numeric', month: 'long' })}.`, `This period is still running — figures are to date. The final report is generated automatically and sent to the owner on ${UI.fdate(nextIssue, { day: 'numeric', month: 'long' })}.`)}</div></div>` : ''}
      <div class="grid g4" style="margin-bottom:16px">
        ${UI.kpi(L('المرضى الذين تم الكشف عليهم', 'Patients seen'), nf(sum('completed')), 'users', 'primary', `${nf(sum('booked'))} ${L('حجز', 'booked')} · ${nf(sum('newPatients'))} ${L('مريض جديد', 'new')}`)}
        ${UI.kpi(L('متوسط تقييم المرضى', 'Avg. patient rating'), `${nf(avgW('avgRating', 'completed'), 1)} / 5`, 'star', 'accent', `${L('نسبة التحسن', 'Improved')}: ${pct(avgW('improvedRate', 'completed'))}`)}
        ${UI.kpi(L('إيرادات الفترة', 'Period revenue'), money(sum('revenue')), 'trending-up', 'success', `${L('حصة المستشفى', 'Hospital share')}: ${money(sum('hospitalShare'))}`)}
        ${UI.kpi(isDoc ? L('نسبتي (عمولتي)', 'My share') : L('إجمالي نسب الأطباء', 'Total doctor shares'), money(sum('commission')), 'hand-coins', 'warning', isDoc ? `${docs[0].commission}% ${L('من الكشف والخدمات', 'of consultation & services')}` : L('تُحسب من كل حجز مكتمل', 'computed per completed booking'))}
      </div>

      <div class="card" style="margin-bottom:16px"><div class="card-head"><h3>${icon('trophy')}${isDoc ? L('مؤشرات الأداء', 'Performance indicators') : L('ترتيب الأطباء حسب مؤشر الأداء', 'Doctor ranking by performance score')}</h3><span class="xs muted">${L('مؤشر الأداء = التقييم 30% + الإتمام 20% + التحسن 20% + سرعة الخدمة 15% + الإشغال 15%', 'Score = rating 30% + completion 20% + improvement 20% + speed 15% + utilization 15%')}</span></div>
      <div class="card-body flush">${UI.table([
        { label: '#', render: (r, i) => `<b class="num">${nf(i + 1)}</b>` },
        { label: L('الطبيب', 'Doctor'), render: r => `<div class="row">${UI.avatar(r.doctor.name)}<div><div class="cell-main">${esc(N(r.doctor.name))}</div><div class="cell-sub">${esc(N(Store.get.dept(r.doctor.dept).name))}</div></div></div>` },
        { label: L('مؤشر الأداء', 'Score'), render: r => `<div style="min-width:110px"><div class="row between"><b style="color:${r.score >= 75 ? 'var(--success)' : r.score >= 60 ? 'var(--warning)' : 'var(--danger)'}">${nf(r.score)}</b>${delta(r.score, prevRows[r.doctor.id] && prevRows[r.doctor.id].score)}</div><div class="progress"><span style="width:${r.score}%;background:${r.score >= 75 ? 'var(--success)' : r.score >= 60 ? 'var(--warning)' : 'var(--danger)'}"></span></div></div>` },
        { label: L('المرضى', 'Patients'), render: r => `<b>${nf(r.completed)}</b><span class="muted xs"> / ${nf(r.booked)}</span><div>${delta(r.completed, prevRows[r.doctor.id] && prevRows[r.doctor.id].completed)}</div>` },
        { label: L('عدم الحضور', 'No-show'), render: r => `<span style="color:${r.noShowRate > 12 ? 'var(--danger)' : 'inherit'}">${pct(r.noShowRate)}</span>` },
        { label: L('متوسط الانتظار', 'Avg wait'), render: r => `<span style="color:${r.avgWait > 25 ? 'var(--danger)' : 'inherit'}">${nf(r.avgWait)} ${L('د', 'm')}</span>` },
        { label: L('التقييم', 'Rating'), render: r => `<span style="color:${r.avgRating < 4 ? 'var(--danger)' : 'inherit'}">★ ${nf(r.avgRating, 1)}</span>` },
        { label: L('تحسن المرضى', 'Improved'), render: r => pct(r.improvedRate) },
        { label: L('الإشغال', 'Utilization'), render: r => pct(r.utilization) },
        { label: L('الإيراد', 'Revenue'), render: r => `<b>${money(r.revenue)}</b>` },
        { label: L('نسبة الطبيب', 'Doctor share'), render: r => `${money(r.commission)}<div class="cell-sub">${r.doctor.commission}%</div>` },
        { label: L('حصة المستشفى', 'Hospital'), render: r => money(r.hospitalShare) },
        { label: '', render: r => `<button class="btn sm icon" title="${L('تفاصيل الطبيب', 'Doctor details')}" data-doc="${r.doctor.id}">${icon('chart-spline')}</button>` }
      ], rows)}</div></div>

      <div class="grid g2">
        <div class="card"><div class="card-head"><h3>${icon('scan-search')}${L('نقاط الضعف والتوصيات', 'Weak points & recommendations')}</h3><span class="badge tone-muted">${nf(ins.length)}</span></div><div class="card-body flush">${ins.filter(i => !isDoc || !i.who || i.who === docs[0].name).map(i => `<div class="feed-item"><div class="k-icon tone-${i.tone}" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex-shrink:0">${icon(i.icon, 'ic-sm')}</div><div><div style="font-weight:600">${esc(N(i.title))}${i.who ? ` — <span class="muted">${esc(N(i.who))}</span>` : ''}</div><div class="small muted">${esc(N(i.text))}</div></div></div>`).join('') || UI.empty(L('لا توجد ملاحظات', 'Nothing flagged'))}</div></div>
        <div class="card"><div class="card-head"><h3>${icon('chart-column-stacked')}${L('الإيراد: نسبة الطبيب مقابل حصة المستشفى', 'Revenue: doctor share vs hospital share')}</h3></div><div class="card-body"><div class="chart-box" style="height:300px"><canvas id="perRev"></canvas></div></div></div>
      </div>`;

      UI.chart(el.querySelector('#perRev'), { type: 'bar', data: { labels: rows.map(r => N(r.doctor.name).replace(/^(د\.|Dr\.)\s*/, '')), datasets: [{ label: L('نسبة الطبيب', 'Doctor share'), data: rows.map(r => r.commission), backgroundColor: UI.cssVar('--accent'), borderRadius: 4 }, { label: L('حصة المستشفى', 'Hospital share'), data: rows.map(r => r.hospitalShare), backgroundColor: UI.cssVar('--primary'), borderRadius: 4 }] }, options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true } } } });
      el.querySelector('#perSel').onchange = e => { st.period = +e.target.value; App.refresh(); };
      el.querySelector('#perPrint').onclick = () => window.print();
      el.querySelector('#perCsv').onclick = () => UI.downloadCSV('doctor-performance-' + per.id, [[L('الطبيب', 'Doctor'), L('العيادة', 'Clinic'), L('مؤشر الأداء', 'Score'), L('الحجوزات', 'Booked'), L('المكتمل', 'Completed'), L('عدم الحضور %', 'No-show %'), L('الإلغاء %', 'Cancel %'), L('متوسط الانتظار', 'Avg wait'), L('مدة الكشف', 'Avg duration'), L('التقييم', 'Rating'), L('التحسن %', 'Improved %'), L('الإشغال %', 'Utilization %'), L('الإيراد', 'Revenue'), L('نسبة الطبيب', 'Doctor share'), L('حصة المستشفى', 'Hospital share')]].concat(rows.map(r => [N(r.doctor.name), N(Store.get.dept(r.doctor.dept).name), r.score, r.booked, r.completed, r.noShowRate.toFixed(1), r.cancelRate.toFixed(1), r.avgWait.toFixed(0), r.avgDur.toFixed(0), r.avgRating.toFixed(2), r.improvedRate.toFixed(1), r.utilization, r.revenue, r.commission, r.hospitalShare])));
      el.querySelectorAll('[data-doc]').forEach(b => b.onclick = () => detail(b.dataset.doc));

      function detail(id) {
        const trend = periods.slice().reverse().map(p => ({ p, r: Store.doctorPerformance(id, p.from, p.to) }));
        const r = rows.find(x => x.doctor.id === id);
        const appts = db.appointments.filter(a => a.doctorId === id && Store.inRange(a.start, per.from, per.to));
        const src = {}; appts.forEach(a => src[a.source] = (src[a.source] || 0) + 1);
        UI.modal({
          size: 'xl', title: `${UI.avatar(r.doctor.name)} ${esc(N(r.doctor.name))} — ${periodLabel(per)}`,
          body: `<div class="grid g4" style="margin-bottom:16px">${UI.kpi(L('مؤشر الأداء', 'Score'), nf(r.score), 'gauge', 'primary')}${UI.kpi(L('المرضى', 'Patients'), nf(r.completed), 'users', 'accent', `${nf(r.newPatients)} ${L('جديد', 'new')} · ${nf(r.returning)} ${L('عائد', 'returning')}`)}${UI.kpi(L('الإيراد', 'Revenue'), money(r.revenue), 'banknote', 'success', `${L('لكل مريض', 'per patient')}: ${money(r.revenuePerPatient)}`)}${UI.kpi(L('تكلفة المستلزمات', 'Items cost'), money(r.itemsCost), 'boxes', 'warning')}</div>
          <div class="grid g2"><div class="card"><div class="card-head"><h3>${L('تطور الأداء آخر 6 فترات', 'Trend — last 6 periods')}</h3></div><div class="card-body"><div class="chart-box"><canvas id="dTr"></canvas></div></div></div>
          <div class="card"><div class="card-head"><h3>${L('مصادر الحجز ونتائج العلاج', 'Booking sources & outcomes')}</h3></div><div class="card-body"><div class="chips" style="margin-bottom:12px">${Object.keys(src).map(s => `<span class="row" style="gap:4px">${UI.srcBadge(s)}<b class="small">${nf(src[s])}</b></span>`).join('')}</div><div class="chart-box sm"><canvas id="dOut"></canvas></div></div></div></div>`,
          footer: `<button class="btn" data-close>${L('إغلاق', 'Close')}</button>`,
          onMount(m) {
            UI.chart(m.querySelector('#dTr'), { data: { labels: trend.map(t => periodLabel(t.p)), datasets: [{ type: 'line', label: L('مؤشر الأداء', 'Score'), data: trend.map(t => t.r.score), borderColor: UI.cssVar('--primary'), backgroundColor: UI.cssVar('--primary'), tension: .3, yAxisID: 'y' }, { type: 'bar', label: L('المرضى', 'Patients'), data: trend.map(t => t.r.completed), backgroundColor: UI.cssVar('--accent') + '55', borderRadius: 4, yAxisID: 'y1' }] }, options: { scales: { y: { min: 0, max: 100 }, y1: { position: UI.lang === 'ar' ? 'left' : 'right', grid: { display: false }, beginAtZero: true }, x: { grid: { display: false } } } } });
            const encs = db.encounters.filter(e => e.doctorId === id && Store.inRange(e.date, per.from, per.to));
            UI.chart(m.querySelector('#dOut'), { type: 'doughnut', data: { labels: ['improved', 'stable', 'worse'].map(o => L(UI.OUTCOME[o][1], UI.OUTCOME[o][2])), datasets: [{ data: ['improved', 'stable', 'worse'].map(o => encs.filter(e => e.outcome === o).length), backgroundColor: ['#169b5b', '#0b7fc0', '#d93f45'], borderColor: UI.cssVar('--surface'), borderWidth: 2 }] }, options: { cutout: '60%' } });
          }
        });
      }
    }
  };
})();

App.pages.reports = (function () {
  const st = { tab: 'platforms', days: 30 };
  return {
    render(el) {
      const { L, N, esc, icon, money, nf, pct } = UI; const db = Store.db;
      const since = new Date(Date.now() - st.days * 864e5);
      const appts = db.appointments.filter(a => new Date(a.start) >= since && new Date(a.start) <= new Date());
      const invs = db.invoices.filter(i => new Date(i.date) >= since);
      const role = Store.me().role;
      const TABS = [['platforms', L('أداء منصات الحجز', 'Booking platforms'), 'plug-zap'], ['services', L('مبيعات الخدمات', 'Service sales'), 'list-checks'], ['clinics', L('أداء العيادات', 'Clinic performance'), 'building-2'], ['stock', L('استهلاك المخزون', 'Stock consumption'), 'boxes'], ['patients', L('المرضى', 'Patients'), 'users']]
        .filter(t => role === 'store' ? t[0] === 'stock' : role === 'sales' ? t[0] !== 'stock' : true);
      if (!TABS.some(t => t[0] === st.tab)) st.tab = TABS[0][0];
      let cols = [], rows = [], csv = [];
      if (st.tab === 'platforms') {
        rows = Object.keys(UI.SOURCES).map(s => { const a = appts.filter(x => x.source === s); const done = a.filter(x => x.status === 'completed'); const rev = invs.filter(i => i.apptId && a.some(x => x.id === i.apptId)).reduce((t, i) => t + i.total, 0); return { s, n: a.length, done: done.length, ns: a.filter(x => x.status === 'no_show').length, c: a.filter(x => x.status === 'cancelled').length, rev }; }).filter(r => r.n);
        cols = [{ label: L('المصدر', 'Source'), render: r => UI.srcBadge(r.s) }, { label: L('الحجوزات', 'Bookings'), render: r => `<b>${nf(r.n)}</b>` }, { label: L('مكتملة', 'Completed'), render: r => nf(r.done) }, { label: L('نسبة الحضور', 'Show rate'), render: r => pct(r.done / r.n * 100) }, { label: L('لم يحضر', 'No-show'), render: r => `<span style="color:${r.ns / r.n > .1 ? 'var(--danger)' : 'inherit'}">${nf(r.ns)} (${pct(r.ns / r.n * 100)})</span>` }, { label: L('ملغي', 'Cancelled'), render: r => nf(r.c) }, { label: L('الإيراد المحقق', 'Revenue'), render: r => `<b>${money(r.rev)}</b>` }, { label: L('متوسط الإيراد / حجز', 'Revenue / booking'), render: r => money(r.rev / r.n) }];
        csv = rows.map(r => [UI.srcLabel(r.s), r.n, r.done, r.ns, r.c, r.rev]);
      } else if (st.tab === 'services') {
        const m = {}; invs.forEach(i => i.lines.forEach(l => { if (l.kind !== 'item') { const k = l.kind + l.refId; const x = m[k] || (m[k] = { name: l.name, kind: l.kind, q: 0, rev: 0 }); x.q += l.qty; x.rev += l.qty * l.price; } }));
        rows = Object.values(m).sort((a, b) => b.rev - a.rev);
        cols = [{ label: L('الخدمة / الباقة', 'Service / package'), render: r => `<b>${esc(N(r.name))}</b>` }, { label: L('النوع', 'Type'), render: r => `<span class="tag">${r.kind === 'package' ? L('باقة', 'Package') : L('خدمة', 'Service')}</span>` }, { label: L('العدد', 'Count'), render: r => nf(r.q) }, { label: L('الإيراد', 'Revenue'), render: r => `<b>${money(r.rev)}</b>` }];
        csv = rows.map(r => [N(r.name), r.kind, r.q, r.rev]);
      } else if (st.tab === 'clinics') {
        rows = db.departments.map(d => { const a = appts.filter(x => x.dept === d.id); const i = invs.filter(x => x.dept === d.id); const e = db.encounters.filter(x => x.dept === d.id && new Date(x.date) >= since); return { d, n: a.length, done: a.filter(x => x.status === 'completed').length, rev: i.reduce((s, x) => s + x.total, 0), imp: e.length ? e.filter(x => x.outcome === 'improved').length / e.length * 100 : 0, cost: db.movements.filter(m => m.type === 'out' && m.dept === d.id && new Date(m.at) >= since).reduce((s, m) => s + m.qty * Store.get.product(m.productId).cost, 0) }; });
        cols = [{ label: L('العيادة', 'Clinic'), render: r => `<span class="dept-dot" style="background:${r.d.color}"></span> <b>${esc(N(r.d.name))}</b>` }, { label: L('الحجوزات', 'Bookings'), render: r => nf(r.n) }, { label: L('مكتملة', 'Completed'), render: r => nf(r.done) }, { label: L('نسبة تحسن المرضى', 'Improved'), render: r => pct(r.imp) }, { label: L('الإيراد', 'Revenue'), render: r => `<b>${money(r.rev)}</b>` }, { label: L('تكلفة المستلزمات', 'Supplies cost'), render: r => money(r.cost) }, { label: L('نسبة المستلزمات من الإيراد', 'Supplies % of revenue'), render: r => pct(r.rev ? r.cost / r.rev * 100 : 0, 1) }];
        csv = rows.map(r => [N(r.d.name), r.n, r.done, r.imp.toFixed(1), r.rev, r.cost]);
      } else if (st.tab === 'stock') {
        const m = {}; db.movements.filter(x => x.type === 'out' && new Date(x.at) >= since).forEach(x => { const r = m[x.productId] || (m[x.productId] = { p: Store.get.product(x.productId), q: 0, pat: 0, sale: 0 }); r.q += x.qty; if (x.reason === 'consumption') r.pat += x.qty; if (x.reason === 'sale') r.sale += x.qty; });
        rows = Object.values(m).sort((a, b) => b.q * b.p.cost - a.q * a.p.cost);
        cols = [{ label: L('الصنف', 'Item'), render: r => `<b>${esc(N(r.p.name))}</b>` }, { label: L('الفئة', 'Category'), render: r => `<span class="tag">${esc(N(Store.get.category(r.p.cat).name))}</span>` }, { label: L('صرف لمرضى', 'Used for patients'), render: r => nf(r.pat) }, { label: L('مبيعات', 'Sold'), render: r => nf(r.sale) }, { label: L('إجمالي الصرف', 'Total out'), render: r => `<b>${nf(r.q)}</b>` }, { label: L('التكلفة', 'Cost'), render: r => money(r.q * r.p.cost) }, { label: L('الرصيد الحالي', 'On hand'), render: r => `<span style="color:${r.p.qty <= r.p.min ? 'var(--danger)' : 'inherit'}">${nf(r.p.qty)}</span>` }, { label: L('يكفي لمدة', 'Days of cover'), render: r => { const d = r.q ? r.p.qty / (r.q / st.days) : Infinity; return isFinite(d) ? `<span style="color:${d < 14 ? 'var(--danger)' : 'inherit'}">${nf(d)} ${L('يوم', 'days')}</span>` : '—'; } }];
        csv = rows.map(r => [N(r.p.name), r.pat, r.sale, r.q, r.q * r.p.cost, r.p.qty]);
      } else {
        const seen = {}; appts.filter(a => a.status === 'completed').forEach(a => seen[a.patientId] = (seen[a.patientId] || 0) + 1);
        const newP = db.patients.filter(p => new Date(p.createdAt) >= since).length;
        rows = Object.entries(seen).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([id, n]) => ({ p: Store.get.patient(id), n, spent: invs.filter(i => i.patientId === id).reduce((s, i) => s + i.total, 0) }));
        cols = [{ label: L('المريض', 'Patient'), render: r => `<a href="#/patients/${r.p.id}"><b>${esc(N(r.p.name))}</b></a>` }, { label: L('عدد الزيارات', 'Visits'), render: r => nf(r.n) }, { label: L('الإنفاق', 'Spend'), render: r => money(r.spent) }, { label: L('التأمين', 'Insurance'), render: r => r.p.insurer ? esc(N(Store.get.insurer(r.p.insurer).name)) : '—' }];
        csv = rows.map(r => [N(r.p.name), r.n, r.spent]);
        rows._extra = `<div class="grid g3" style="padding:16px">${UI.kpi(L('مرضى جدد', 'New patients'), nf(newP), 'user-plus', 'primary')}${UI.kpi(L('مرضى تمت خدمتهم', 'Patients served'), nf(Object.keys(seen).length), 'users', 'accent')}${UI.kpi(L('مرضى عادوا أكثر من مرة', 'Came back 2+ times'), nf(Object.values(seen).filter(n => n > 1).length), 'repeat', 'success')}</div>`;
      }
      el.innerHTML = `${App.pageHead(L('مركز التقارير', 'Report center'), L('تقارير تشغيلية جاهزة للتصدير إلى Excel', 'Operational reports, exportable to Excel'),
        `<select class="select" id="rDays" style="width:auto">${[7, 15, 30, 60].map(d => `<option value="${d}" ${st.days === d ? 'selected' : ''}>${L(`آخر ${d} يوم`, `Last ${d} days`)}</option>`).join('')}</select><button class="btn" id="rCsv">${icon('download')}${L('تصدير Excel', 'Export CSV')}</button><button class="btn" onclick="window.print()">${icon('printer')}${L('طباعة', 'Print')}</button>`)}
      <div class="card"><div style="padding:0 12px"><div class="tabs">${TABS.map(t => `<button data-tab="${t[0]}" class="${st.tab === t[0] ? 'on' : ''}">${icon(t[2], 'ic-sm')}${t[1]}</button>`).join('')}</div></div>${rows._extra || ''}<div class="card-body flush">${UI.table(cols, rows)}</div></div>`;
      el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { st.tab = b.dataset.tab; App.refresh(); });
      el.querySelector('#rDays').onchange = e => { st.days = +e.target.value; App.refresh(); };
      el.querySelector('#rCsv').onclick = () => { const t = el.querySelector('table.tbl'); if (!t) return; UI.downloadCSV('report-' + st.tab, [...t.rows].map(tr => [...tr.cells].map(c => c.innerText.replace(/\s+/g, ' ').trim()))); };
    }
  };
})();

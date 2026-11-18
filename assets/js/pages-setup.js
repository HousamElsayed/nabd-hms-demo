/* Medical setup: departments, doctors, shifts, services, packages, insurance */
App.pages.departments = {
  render(el) {
    const { L, N, esc, icon, nf, money } = UI; const db = Store.db;
    const today = UI.isoDay(new Date()); const ms = new Date(); ms.setDate(1); ms.setHours(0, 0, 0, 0);
    el.innerHTML = `${App.pageHead(L('الأقسام والعيادات', 'Departments & clinics'), L('كل عيادة منفصلة بأطبائها وحجوزاتها ومستلزماتها وإيراداتها', 'Each clinic is separated with its own doctors, bookings, supplies and revenue'))}
    <div class="grid g3">${db.departments.map(d => {
      const docs = db.doctors.filter(x => x.dept === d.id); const t = db.appointments.filter(a => a.dept === d.id && UI.sameDay(a.start, today) && a.status !== 'cancelled');
      const rev = db.invoices.filter(i => i.dept === d.id && new Date(i.date) >= ms).reduce((s, i) => s + i.total, 0);
      const items = db.products.filter(p => (p.depts || []).includes(d.id)); const low = items.filter(p => p.qty <= p.min).length;
      return `<div class="card"><div class="card-body">
        <div class="row"><div class="k-icon" style="width:46px;height:46px;border-radius:13px;display:grid;place-items:center;background:${d.color}1f;color:${d.color}">${icon(d.icon)}</div><div class="grow"><div style="font-weight:700;font-size:16px">${esc(N(d.name))}</div><div class="small muted">${esc(N(d.floor))}</div></div></div>
        <div class="grid g3" style="gap:8px;margin-top:14px;text-align:center">
          <div class="card" style="padding:8px"><div class="xs muted">${L('حجوزات اليوم', 'Today')}</div><b>${nf(t.length)}</b></div>
          <div class="card" style="padding:8px"><div class="xs muted">${L('إيراد الشهر', 'Month rev.')}</div><b class="small">${nf(rev)}</b></div>
          <div class="card" style="padding:8px"><div class="xs muted">${L('نواقص', 'Low stock')}</div><b style="color:${low ? 'var(--danger)' : 'inherit'}">${nf(low)}</b></div>
        </div>
        <div class="section-title" style="margin-top:14px">${L('الأطباء', 'Doctors')}</div>
        ${docs.map(x => `<div class="row" style="margin-bottom:6px">${UI.avatar(x.name)}<div class="grow"><div style="font-weight:600;font-size:13px">${esc(N(x.name))}</div><div class="xs muted">${esc(N(Store.get.branch(x.branch).name))}</div></div><span class="badge tone-muted">${icon('star', 'ic-sm')}${x.rating}</span></div>`).join('')}
        <div class="row" style="margin-top:12px"><a class="btn sm" href="#/bookings" data-godept="${d.id}">${icon('calendar-check-2')}${L('حجوزات العيادة', 'Clinic bookings')}</a></div>
      </div></div>`;
    }).join('')}</div>`;
    el.querySelectorAll('[data-godept]').forEach(a => a.onclick = e => { e.preventDefault(); App.pages.bookings.open({ dept: a.dataset.godept }); });
  }
};

App.pages.doctors = {
  render(el) {
    const { L, N, esc, icon, money } = UI; const db = Store.db;
    el.innerHTML = `${App.pageHead(L('الأطباء', 'Doctors'), L('بيانات الأطباء، رسوم الكشف، نسبة الطبيب من كل حجز، وأكواد الربط مع المنصات', 'Doctor details, fees, doctor share per appointment, and platform mapping codes'))}
    <div class="card"><div class="card-body flush">${UI.table([
      { label: L('الطبيب', 'Doctor'), render: d => `<div class="row">${UI.avatar(d.name)}<div><div class="cell-main">${esc(N(d.name))}</div><div class="cell-sub">${esc(N(d.title))}</div></div></div>` },
      { label: L('العيادة', 'Clinic'), render: d => `<span class="dept-dot" style="background:${Store.get.dept(d.dept).color}"></span> ${esc(N(Store.get.dept(d.dept).name))}` },
      { label: L('الفرع / الشيفت', 'Branch / shift'), render: d => `${esc(N(Store.get.branch(d.branch).name))}<div class="cell-sub">${esc(N(Store.get.shift(d.shift).name))}</div>` },
      { label: L('سعر الكشف', 'Fee'), render: d => money(d.fee) },
      { label: L('نسبة الطبيب', 'Doctor %'), render: d => `<span class="badge tone-success">${d.commission}%</span>` },
      { label: L('أكواد المنصات', 'Platform IDs'), render: d => Object.entries(d.platformIds).map(([k, v]) => v ? `<div class="row" style="gap:6px;margin-bottom:3px">${UI.srcBadge(k)}<span class="code">${v}</span></div>` : '').join('') },
      { label: '', render: d => Store.isAdmin() ? `<button class="btn sm" data-ed="${d.id}">${icon('pencil')}${L('تعديل', 'Edit')}</button>` : '' }
    ], db.doctors)}</div></div>`;
    el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => {
      const d = Store.get.doctor(b.dataset.ed);
      UI.modal({
        title: `${icon('pencil')} ${esc(N(d.name))}`,
        body: `<form id="deF" class="form-grid">
          <div class="field"><label>${L('سعر الكشف (ج.م)', 'Fee (EGP)')}</label><input class="input" type="number" name="fee" value="${d.fee}"></div>
          <div class="field"><label>${L('نسبة الطبيب من كل حجز %', 'Doctor share per booking %')}</label><input class="input" type="number" name="commission" min="0" max="100" value="${d.commission}"></div>
          <div class="field"><label>${L('الشيفت', 'Shift')}</label><select class="select" name="shift">${UI.options(db.shifts, d.shift)}</select></div>
          <div class="field"><label>${L('الفرع', 'Branch')}</label><select class="select" name="branch">${UI.options(db.branches, d.branch)}</select></div>
          ${['vezeeta', 'clinido', 'ekshef'].map(k => `<div class="field"><label>${UI.srcLabel(k)} ID</label><input class="input" dir="ltr" name="pf_${k}" value="${d.platformIds[k] || ''}"></div>`).join('')}
        </form>`,
        footer: `<button class="btn" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn primary" id="deS">${L('حفظ', 'Save')}</button>`,
        onMount(r, close) {
          r.querySelector('#deS').onclick = () => {
            const f = UI.formData(r.querySelector('#deF')); const old = d.commission;
            d.fee = +f.fee; d.commission = Math.max(0, Math.min(100, +f.commission)); d.shift = f.shift; d.branch = f.branch;
            ['vezeeta', 'clinido', 'ekshef'].forEach(k => d.platformIds[k] = f['pf_' + k] || null);
            Store.log('admin', { ar: `تعديل بيانات ${d.name.ar} (النسبة ${old}% ← ${d.commission}%)`, en: `Updated ${d.name.en} (share ${old}% → ${d.commission}%)` });
            close(); UI.toast(L('تم الحفظ', 'Saved'), '', 'success', 'check'); App.refresh();
          };
        }
      });
    });
  }
};

App.pages.shifts = {
  render(el) {
    const { L, N, esc, icon } = UI; const db = Store.db;
    const days = [L('السبت', 'Sat'), L('الأحد', 'Sun'), L('الاثنين', 'Mon'), L('الثلاثاء', 'Tue'), L('الأربعاء', 'Wed'), L('الخميس', 'Thu'), L('الجمعة', 'Fri')];
    el.innerHTML = `${App.pageHead(L('الشيفتات', 'Shifts'), L('مواعيد عمل الأطباء — تُستخدم لتحديد المواعيد المتاحة على المنصات', 'Doctor working hours — used to publish available slots to platforms'))}
    <div class="grid g2" style="margin-bottom:16px">${db.shifts.map(s => `<div class="card kpi"><div class="k-icon tone-${s.id === 's1' ? 'warning' : 'accent'}">${icon(s.id === 's1' ? 'sun' : 'moon')}</div><div><div class="k-label">${esc(N(s.name))}</div><div class="k-value ltr" style="font-size:20px">${s.from} – ${s.to}</div><div class="k-foot">${db.doctors.filter(d => d.shift === s.id).length} ${L('أطباء', 'doctors')}</div></div></div>`).join('')}</div>
    <div class="card"><div class="card-head"><h3>${icon('calendar-range')}${L('جدول الأسبوع', 'Weekly roster')}</h3></div><div class="card-body flush"><div class="table-wrap"><table class="tbl matrix"><thead><tr><th>${L('الطبيب', 'Doctor')}</th>${days.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>
    ${db.doctors.map(d => { const s = Store.get.shift(d.shift); return `<tr><td><div class="cell-main">${esc(N(d.name))}</div><div class="cell-sub">${esc(N(Store.get.dept(d.dept).name))}</div></td>${days.map((_, i) => i === 6 ? `<td><span class="muted small">${L('إجازة', 'Off')}</span></td>` : `<td><span class="badge tone-${d.shift === 's1' ? 'warning' : 'accent'} ltr">${s.from}-${s.to}</span></td>`).join('')}</tr>`; }).join('')}
    </tbody></table></div></div></div>`;
  }
};

App.pages.services = {
  render(el) {
    const { L, N, esc, icon, money, nf } = UI; const db = Store.db;
    el.innerHTML = `${App.pageHead(L('الخدمات والأسعار', 'Services & prices'), L('قائمة الخدمات لكل عيادة — تُستخدم في الحجز والفواتير', 'Service list per clinic — used in bookings and invoices'))}
    <div class="grid g2">${db.departments.map(d => `<div class="card"><div class="card-head"><h3><span class="dept-dot" style="background:${d.color}"></span>${esc(N(d.name))}</h3><span class="badge tone-muted">${db.services.filter(s => s.dept === d.id).length}</span></div><div class="card-body flush">
      ${UI.table([{ label: L('الخدمة', 'Service'), render: s => `<b>${esc(N(s.name))}</b>` }, { label: L('المدة', 'Duration'), render: s => `${nf(s.duration)} ${L('د', 'min')}` }, { label: L('السعر', 'Price'), render: s => Store.isAdmin() ? `<input class="input sm num" style="width:110px" type="number" data-sv="${s.id}" value="${s.price}">` : money(s.price) }], db.services.filter(s => s.dept === d.id))}
    </div></div>`).join('')}</div>`;
    el.querySelectorAll('[data-sv]').forEach(i => i.onchange = () => { const s = Store.get.service(i.dataset.sv); const old = s.price; s.price = Math.max(0, +i.value); Store.log('admin', { ar: `تعديل سعر ${s.name.ar}: ${old} ← ${s.price}`, en: `Price change ${s.name.en}: ${old} → ${s.price}` }); UI.toast(L('تم تحديث السعر', 'Price updated'), N(s.name), 'success', 'check'); });
  }
};

App.pages.packages = {
  render(el) {
    const { L, N, esc, icon, money, nf } = UI; const db = Store.db;
    el.innerHTML = `${App.pageHead(L('الباقات', 'Packages'), L('باقات الجلسات والمتابعة — تزيد ولاء المرضى والإيراد المتكرر', 'Session & follow-up bundles — increase loyalty and recurring revenue'))}
    <div class="grid g3" style="margin-bottom:16px">${db.packages.map(p => { const subs = db.subscriptions.filter(s => s.packageId === p.id); return `<div class="card"><div class="card-body">
      <div class="row between"><span class="tag"><span class="dept-dot" style="background:${Store.get.dept(p.dept).color}"></span>${esc(N(Store.get.dept(p.dept).name))}</span><span class="badge tone-primary">${nf(subs.filter(s => s.status === 'active').length)} ${L('مشترك نشط', 'active')}</span></div>
      <div style="font-weight:700;font-size:16px;margin-top:10px">${esc(N(p.name))}</div>
      <div class="row" style="margin-top:6px;gap:14px"><span class="small muted">${nf(p.sessions)} ${L('جلسات', 'sessions')}</span><span class="small muted">${nf(p.validDays)} ${L('يوم صلاحية', 'days validity')}</span></div>
      <div class="row between" style="margin-top:12px"><b style="font-size:20px;color:var(--primary)">${money(p.price)}</b>${Store.can('sales') ? `<button class="btn sm primary" data-sell="${p.id}">${icon('shopping-cart')}${L('بيع', 'Sell')}</button>` : ''}</div>
    </div></div>`; }).join('')}</div>
    <div class="card"><div class="card-head"><h3>${icon('users')}${L('اشتراكات الباقات', 'Package subscriptions')}</h3></div><div class="card-body flush">${UI.table([
      { label: L('المريض', 'Patient'), render: s => `<a href="#/patients/${s.patientId}" class="cell-main">${esc(N(Store.get.patient(s.patientId).name))}</a>` },
      { label: L('الباقة', 'Package'), render: s => esc(N(Store.get.pkg(s.packageId).name)) }, { label: L('البداية', 'Start'), render: s => UI.fdate(s.start) },
      { label: L('الاستهلاك', 'Usage'), render: s => `<div style="min-width:140px"><div class="small">${nf(s.used)} / ${nf(s.total)}</div><div class="progress"><span style="width:${s.used / s.total * 100}%"></span></div></div>` },
      { label: L('الحالة', 'Status'), render: s => s.status === 'active' ? `<span class="badge tone-success">${L('نشط', 'Active')}</span>` : `<span class="badge tone-muted">${L('منتهي', 'Completed')}</span>` }
    ], db.subscriptions.slice().reverse())}</div></div>`;
    el.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => {
      const pk = Store.get.pkg(b.dataset.sell);
      UI.modal({
        title: `${icon('shopping-cart')} ${esc(N(pk.name))}`, body: `<div class="stack"><div class="field"><label>${L('المريض', 'Patient')}</label><input class="input" list="pkPat" id="pkP"><datalist id="pkPat">${db.patients.map(p => `<option value="${p.id} — ${esc(N(p.name))}">`).join('')}</datalist></div><div class="field"><label>${L('طريقة الدفع', 'Method')}</label><select class="select" id="pkM">${['cash', 'card', 'instapay', 'wallet'].map(m => `<option value="${m}">${UI.methodLabel(m)}</option>`).join('')}</select></div><div class="callout tone-primary">${L('الإجمالي', 'Total')}: <b>${money(pk.price)}</b></div></div>`,
        footer: `<button class="btn" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn primary" id="pkS">${L('تأكيد البيع', 'Confirm sale')}</button>`,
        onMount(r, close) { r.querySelector('#pkS').onclick = () => { const pid = r.querySelector('#pkP').value.split(' — ')[0].trim(); if (!Store.get.patient(pid)) { UI.toast(L('اختر مريضاً', 'Pick a patient'), '', 'warning', 'info'); return; } Store.sellPackage(pid, pk.id, r.querySelector('#pkM').value); close(); UI.toast(L('تم بيع الباقة', 'Package sold'), '', 'success', 'check'); App.refresh(); }; }
      });
    });
  }
};

App.pages.insurance = {
  render(el) {
    const { L, N, esc, icon, money, nf } = UI; const db = Store.db;
    el.innerHTML = `${App.pageHead(L('شركات التأمين', 'Insurance companies'), L('نسب التغطية والمطالبات المستحقة على كل شركة', 'Coverage rates and receivable claims per insurer'))}
    <div class="card"><div class="card-body flush">${UI.table([
      { label: L('الشركة', 'Company'), render: i => `<div class="row"><span class="k-icon tone-info" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center">${icon('shield-plus', 'ic-sm')}</span><b>${esc(N(i.name))}</b></div>` },
      { label: L('رقم العقد', 'Contract'), render: i => `<span class="code">${i.contract}</span>` }, { label: L('نسبة التغطية', 'Coverage'), render: i => `<span class="badge tone-success">${i.coverage}%</span>` },
      { label: L('عدد المرضى', 'Patients'), render: i => nf(db.patients.filter(p => p.insurer === i.id).length) },
      { label: L('عدد المطالبات', 'Claims'), render: i => nf(db.invoices.filter(v => v.insurer === i.id).length) },
      { label: L('قيمة المطالبات', 'Claims value'), render: i => `<b>${money(db.invoices.filter(v => v.insurer === i.id).reduce((s, v) => s + v.insShare, 0))}</b>` }
    ], db.insurers)}</div></div>`;
  }
};

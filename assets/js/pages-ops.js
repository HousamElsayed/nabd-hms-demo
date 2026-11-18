/* Shared components + Dashboard + Bookings */
window.Comp = (function () {
  const { L, N, esc, icon, money, nf } = UI;

  // Category-aware product picker used by doctors (visit), reception (extra items) and sales
  function itemPicker(host, opts) {
    opts = opts || {};
    const db = Store.db; const rows = [];
    let cat = '';
    const prods = () => db.products.filter(p => (!cat || p.cat === cat) && (!opts.sellableOnly || p.price > 0))
      .sort((a, b) => (opts.dept ? ((b.depts || []).includes(opts.dept) - (a.depts || []).includes(opts.dept)) : 0) || N(a.name).localeCompare(N(b.name)));
    function draw() {
      host.innerHTML = `
      <div class="chips" style="margin-bottom:10px"><button type="button" class="chip ${!cat ? 'on' : ''}" data-cat="">${L('كل الفئات', 'All categories')}</button>${db.categories.map(c => `<button type="button" class="chip ${cat === c.id ? 'on' : ''}" data-cat="${c.id}">${icon(c.icon, 'ic-sm')}${esc(N(c.name))}</button>`).join('')}</div>
      <div class="item-picker-row"><select class="select" data-p>${prods().map(p => `<option value="${p.id}" ${p.qty <= 0 ? 'disabled' : ''}>${esc(N(p.name))} — ${L('متاح', 'in stock')}: ${nf(p.qty)} ${esc(N(p.unit))}${opts.dept && (p.depts || []).includes(opts.dept) ? ' ★' : ''}</option>`).join('')}</select>
      <input class="input" type="number" min="1" value="1" data-q><button type="button" class="btn soft icon" data-add title="${L('إضافة', 'Add')}">${icon('plus')}</button></div>
      <div data-list>${rows.length ? `<div class="table-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>${L('الصنف', 'Item')}</th><th>${L('الفئة', 'Category')}</th><th>${L('الكمية', 'Qty')}</th>${opts.showPrice ? `<th>${L('السعر', 'Price')}</th>` : ''}<th></th></tr></thead><tbody>${rows.map((r, i) => { const p = Store.get.product(r.productId); return `<tr><td class="cell-main">${esc(N(p.name))}</td><td><span class="tag">${esc(N(Store.get.category(p.cat).name))}</span></td><td class="num">${nf(r.qty)} ${esc(N(p.unit))}</td>${opts.showPrice ? `<td class="num">${p.price ? money(p.price * r.qty) : `<span class="muted xs">${L('ضمن الخدمة', 'Included')}</span>`}</td>` : ''}<td><button type="button" class="btn ghost sm icon" data-rm="${i}">${icon('trash-2')}</button></td></tr>`; }).join('')}</tbody></table></div>` : `<div class="muted small" style="padding:6px 2px">${opts.emptyText || L('لم تتم إضافة أصناف بعد', 'No items added yet')}</div>`}</div>`;
      UI.icons(host);
      host.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { cat = b.dataset.cat; draw(); });
      host.querySelector('[data-add]').onclick = () => {
        const id = host.querySelector('[data-p]').value; const q = Math.max(1, parseInt(host.querySelector('[data-q]').value) || 1); if (!id) return;
        const ex = rows.find(r => r.productId === id); const p = Store.get.product(id);
        const want = (ex ? ex.qty : 0) + q;
        if (want > p.qty) { UI.toast(L('الكمية غير متاحة في المخزون', 'Not enough stock'), `${N(p.name)}: ${L('المتاح', 'available')} ${nf(p.qty)}`, 'danger', 'package-x'); return; }
        if (ex) ex.qty = want; else rows.push({ productId: id, qty: q }); draw(); if (opts.onChange) opts.onChange(rows);
      };
      host.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { rows.splice(+b.dataset.rm, 1); draw(); if (opts.onChange) opts.onChange(rows); });
    }
    draw();
    return { get: () => rows.slice() };
  }

  function stockError(e) {
    if (e && e.message === 'stock') UI.toast(L('رصيد المخزون غير كافٍ', 'Insufficient stock'), N(e.product.name), 'danger', 'package-x');
    else { console.error(e); UI.toast(L('حدث خطأ', 'Error'), String(e), 'danger', 'circle-alert'); }
  }

  // Visit (consultation) form — doctor records diagnosis, vitals, items used, prescription
  function visitModal(apptId) {
    const a = Store.get.appt(apptId); const p = Store.get.patient(a.patientId); const d = Store.get.doctor(a.doctorId);
    const vit = [['bpSys', L('الضغط الانقباضي', 'BP systolic'), 'mmHg'], ['bpDia', L('الضغط الانبساطي', 'BP diastolic'), 'mmHg'], ['pulse', L('النبض', 'Pulse'), 'bpm'], ['temp', L('الحرارة', 'Temp'), '°C'], ['weight', L('الوزن', 'Weight'), 'kg'], ['glucose', L('السكر', 'Glucose'), 'mg/dL']];
    if (a.dept === 'oph') vit.push(['visualAcuity', L('حدة الإبصار', 'Visual acuity'), '/10']);
    if (a.dept === 'phy' || a.dept === 'ort') vit.push(['painScore', L('درجة الألم (0-10)', 'Pain score (0-10)'), '']);
    let picker;
    UI.modal({
      size: 'xl', title: `${icon('stethoscope')} ${L('إنهاء الكشف وتسجيل الزيارة', 'Complete visit')}`,
      body: `
      <div class="callout tone-primary" style="margin-bottom:16px">${UI.avatar(p.name)}<div class="grow"><div style="font-weight:700;font-size:15px">${esc(N(p.name))}</div><div class="small">${p.id} · ${UI.age(p.dob)} ${L('سنة', 'yrs')} · ${esc(N(Store.get.dept(a.dept).name))} · ${esc(N(d.name))}</div></div>${p.allergies.length ? `<span class="badge tone-danger">${icon('triangle-alert', 'ic-sm')}${L('حساسية', 'Allergy')}: ${p.allergies.map(x => esc(N(x))).join('، ')}</span>` : ''}</div>
      <form id="visitForm" class="stack">
        <div class="form-grid">
          <div class="field"><label>${L('الشكوى الرئيسية', 'Chief complaint')}</label><input class="input" name="complaint" required></div>
          <div class="field"><label>${L('التشخيص', 'Diagnosis')}</label><input class="input" name="diagnosis" required></div>
          <div class="field full"><label>${L('ملاحظات الطبيب والخطة العلاجية', 'Doctor notes & treatment plan')}</label><textarea class="textarea" name="notes"></textarea></div>
          <div class="field"><label>${L('تقييم حالة المريض مقارنة بالزيارة السابقة', 'Progress vs. previous visit')}</label><select class="select" name="outcome"><option value="improved">${L('تحسن', 'Improved')}</option><option value="stable" selected>${L('مستقر', 'Stable')}</option><option value="worse">${L('تراجع', 'Worse')}</option></select></div>
          <div class="field"><label>&nbsp;</label><label class="row" style="font-weight:500"><input type="checkbox" name="followUp"> ${L('يحتاج زيارة متابعة', 'Needs follow-up visit')}</label></div>
        </div>
        <div><div class="section-title">${icon('heart-pulse', 'ic-sm')}${L('العلامات الحيوية', 'Vital signs')}</div>
        <div class="grid g4">${vit.map(v => `<div class="field"><label>${v[1]} <span class="muted xs">${v[2]}</span></label><input class="input" name="v_${v[0]}" ${v[0] === 'visualAcuity' ? '' : 'type="number" step="0.1"'}></div>`).join('')}</div></div>
        <div><div class="section-title">${icon('boxes', 'ic-sm')}${L('المستلزمات والأدوية المستخدمة — تُخصم من المخزون تلقائياً', 'Items used — auto-deducted from inventory')}</div><div id="vPicker"></div></div>
        <div><div class="section-title">${icon('file-text', 'ic-sm')}${L('الروشتة', 'Prescription')}</div><div id="rxRows"></div><button type="button" class="btn sm" id="addRx">${icon('plus')}${L('إضافة دواء', 'Add medicine')}</button></div>
      </form>`,
      footer: `<button class="btn" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn primary" id="saveVisit">${icon('check')}${L('حفظ وإنهاء الكشف', 'Save & complete')}</button>`,
      onMount(r, close) {
        picker = itemPicker(r.querySelector('#vPicker'), { dept: a.dept, showPrice: true });
        const rx = r.querySelector('#rxRows');
        const addRx = () => { const div = document.createElement('div'); div.className = 'item-picker-row'; div.style.gridTemplateColumns = 'minmax(0,1fr) minmax(0,1.3fr) 36px'; div.innerHTML = `<input class="input" placeholder="${L('اسم الدواء', 'Medicine')}" data-drug><input class="input" placeholder="${L('الجرعة والمدة', 'Dose & duration')}" data-dose><button type="button" class="btn ghost icon">${icon('x')}</button>`; div.querySelector('button').onclick = () => div.remove(); rx.appendChild(div); UI.icons(div); };
        r.querySelector('#addRx').onclick = addRx; addRx();
        r.querySelector('#saveVisit').onclick = () => {
          const f = r.querySelector('#visitForm'); if (!f.reportValidity()) return;
          const d0 = UI.formData(f); const vitals = {};
          vit.forEach(v => { const x = d0['v_' + v[0]]; if (x) vitals[v[0]] = v[0] === 'visualAcuity' ? x : +x; });
          const rxItems = [...rx.querySelectorAll('.item-picker-row')].map(x => ({ drug: x.querySelector('[data-drug]').value.trim(), dose: x.querySelector('[data-dose]').value.trim() })).filter(x => x.drug).map(x => ({ drug: { ar: x.drug, en: x.drug }, dose: { ar: x.dose, en: x.dose } }));
          try {
            const items = picker.get();
            const enc = Store.completeVisit(apptId, { complaint: { ar: d0.complaint, en: d0.complaint }, diagnosis: { ar: d0.diagnosis, en: d0.diagnosis }, notes: { ar: d0.notes, en: d0.notes }, outcome: d0.outcome, followUp: !!d0.followUp, vitals, items, rx: rxItems });
            close();
            UI.toast(L('تم إنهاء الكشف بنجاح', 'Visit completed'), L(`تم خصم ${items.length} صنف من المخزون وإصدار الفاتورة ${enc.invoiceId}`, `${items.length} item(s) deducted from stock, invoice ${enc.invoiceId} issued`), 'success', 'circle-check');
            App.refresh();
          } catch (e) { stockError(e); }
        };
      }
    });
  }

  // Extra items added later by reception to a completed visit
  function addItemsModal(encId) {
    const enc = Store.get.encounter(encId); const p = Store.get.patient(enc.patientId);
    let picker;
    UI.modal({
      size: 'lg', title: `${icon('package-plus')} ${L('إضافة مستلزمات إضافية للزيارة', 'Add extra items to visit')}`,
      body: `<div class="callout tone-info" style="margin-bottom:14px">${icon('info')}<div>${L('الأصناف المضافة تُخصم من المخزون فوراً، وتُضاف تلقائياً لفاتورة المريض ولملفه الطبي.', 'Added items are deducted from stock immediately and added to the patient invoice and file.')}<div class="xs" style="margin-top:4px"><b>${esc(N(p.name))}</b> · ${encId} · ${UI.fdt(enc.date)}</div></div></div><div id="xPicker"></div>`,
      footer: `<button class="btn" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn primary" id="saveX">${icon('check')}${L('حفظ وخصم من المخزون', 'Save & deduct')}</button>`,
      onMount(r, close) {
        picker = itemPicker(r.querySelector('#xPicker'), { dept: enc.dept, showPrice: true });
        r.querySelector('#saveX').onclick = () => {
          const items = picker.get(); if (!items.length) { UI.toast(L('اختر صنفاً واحداً على الأقل', 'Pick at least one item'), '', 'warning', 'info'); return; }
          try { Store.addItemsToEncounter(encId, items); close(); UI.toast(L('تمت الإضافة والخصم من المخزون', 'Items added & deducted'), '', 'success', 'circle-check'); App.refresh(); } catch (e) { stockError(e); }
        };
      }
    });
  }

  function invoiceModal(invId) {
    const inv = Store.get.invoice(invId); const p = Store.get.patient(inv.patientId); const db = Store.db;
    const due = Store.invDue(inv), bal = Store.invBalance(inv);
    const canPay = Store.can('sales') && bal > 0;
    UI.modal({
      size: 'lg', title: `${icon('receipt-text')} ${L('فاتورة', 'Invoice')} <span class="ltr">${inv.id}</span>`,
      body: `
      <div class="row between wrap" style="margin-bottom:16px;gap:16px">
        <div><div style="font-weight:700;font-size:16px">${esc(N(db.hospital.name))}</div><div class="small muted">${esc(N(db.hospital.address))}</div><div class="small muted ltr">${db.hospital.phone}</div></div>
        <div style="text-align:end"><div>${UI.payBadge(inv.status)}</div><div class="small muted" style="margin-top:6px">${UI.fdt(inv.date)}</div></div>
      </div>
      <dl class="kv" style="margin-bottom:14px"><dt>${L('المريض', 'Patient')}</dt><dd>${esc(N(p.name))} <span class="muted ltr">${p.id}</span></dd>
      ${inv.doctorId ? `<dt>${L('الطبيب', 'Doctor')}</dt><dd>${esc(N(Store.get.doctor(inv.doctorId).name))}</dd>` : ''}
      ${inv.insurer ? `<dt>${L('التأمين', 'Insurance')}</dt><dd>${esc(N(Store.get.insurer(inv.insurer).name))} (${Store.get.insurer(inv.insurer).coverage}%)</dd>` : ''}</dl>
      ${UI.table([{ label: L('البند', 'Item'), render: l => `<span class="cell-main">${esc(N(l.name))}</span> <span class="tag">${l.kind === 'service' ? L('خدمة', 'Service') : l.kind === 'package' ? L('باقة', 'Package') : L('صنف', 'Item')}</span>` }, { label: L('الكمية', 'Qty'), render: l => nf(l.qty) }, { label: L('السعر', 'Price'), render: l => money(l.price) }, { label: L('الإجمالي', 'Total'), render: l => `<b>${money(l.qty * l.price)}</b>` }], inv.lines)}
      <div style="max-width:320px;margin-inline-start:auto;margin-top:14px" class="kv">
        <dt>${L('الإجمالي', 'Total')}</dt><dd class="num" style="text-align:end">${money(inv.total)}</dd>
        ${inv.insShare ? `<dt>${L('حصة التأمين', 'Insurance share')}</dt><dd class="num" style="text-align:end">− ${money(inv.insShare)}</dd>` : ''}
        <dt>${L('المطلوب من المريض', 'Patient due')}</dt><dd class="num" style="text-align:end"><b>${money(due)}</b></dd>
        <dt>${L('المدفوع', 'Paid')}</dt><dd class="num" style="text-align:end">${money(inv.paid)}</dd>
        <dt><b>${L('المتبقي', 'Balance')}</b></dt><dd class="num" style="text-align:end;color:${bal ? 'var(--danger)' : 'var(--success)'}"><b>${money(bal)}</b></dd>
      </div>
      ${canPay ? `<div class="divider"></div><div class="row wrap" id="payRow"><div class="field" style="flex:1;min-width:140px"><label>${L('المبلغ', 'Amount')}</label><input class="input" type="number" id="payAmt" value="${bal}" min="1" max="${bal}"></div><div class="field" style="flex:1;min-width:140px"><label>${L('طريقة الدفع', 'Method')}</label><select class="select" id="payM">${['cash', 'card', 'instapay', 'wallet'].map(m => `<option value="${m}">${UI.methodLabel(m)}</option>`).join('')}</select></div><button class="btn primary" id="payBtn" style="align-self:flex-end">${icon('banknote')}${L('تحصيل', 'Collect')}</button></div>` : ''}`,
      footer: `<button class="btn" data-close>${L('إغلاق', 'Close')}</button><button class="btn" id="printInv">${icon('printer')}${L('طباعة', 'Print')}</button>`,
      onMount(r, close) {
        r.querySelector('#printInv').onclick = () => { document.body.classList.add('printing-modal'); window.print(); setTimeout(() => document.body.classList.remove('printing-modal'), 500); };
        const pb = r.querySelector('#payBtn');
        if (pb) pb.onclick = () => { const amt = Math.min(bal, Math.max(1, +r.querySelector('#payAmt').value || 0)); Store.payInvoice(inv.id, amt, r.querySelector('#payM').value); close(); UI.toast(L('تم التحصيل', 'Payment recorded'), `${money(amt)} — ${inv.id}`, 'success', 'banknote'); App.refresh(); };
      }
    });
  }

  function newBookingModal(preset) {
    preset = preset || {}; const db = Store.db;
    const docs = Store.isDoctor() ? [Store.get.doctor(Store.myDoctorId())] : db.doctors;
    const now = new Date(); now.setMinutes(now.getMinutes() < 30 ? 30 : 60, 0, 0);
    const pad = n => String(n).padStart(2, '0');
    UI.modal({
      size: 'lg', title: `${icon('calendar-plus')} ${L('إضافة حجز جديد', 'New booking')}`,
      body: `<form id="bkForm" class="stack">
        <div class="btn-group" style="align-self:flex-start"><button type="button" class="on" data-pm="old">${L('مريض مسجل', 'Existing patient')}</button><button type="button" data-pm="new">${L('مريض جديد', 'New patient')}</button></div>
        <div id="pmOld" class="field"><label>${L('المريض', 'Patient')}</label><input class="input" list="patList" id="patPick" placeholder="${L('اكتب اسم المريض أو رقمه', 'Type patient name or ID')}"><datalist id="patList">${db.patients.map(p => `<option value="${p.id} — ${esc(N(p.name))}">`).join('')}</datalist></div>
        <div id="pmNew" class="form-grid hidden"><div class="field"><label>${L('اسم المريض', 'Patient name')}</label><input class="input" name="pname"></div><div class="field"><label>${L('رقم الهاتف', 'Phone')}</label><input class="input" name="pphone" dir="ltr" placeholder="+2010..."></div><div class="field"><label>${L('النوع', 'Gender')}</label><select class="select" name="pgender"><option value="M">${L('ذكر', 'Male')}</option><option value="F">${L('أنثى', 'Female')}</option></select></div><div class="field"><label>${L('تاريخ الميلاد', 'Date of birth')}</label><input class="input" type="date" name="pdob" value="1990-01-01"></div></div>
        <div class="form-grid">
          <div class="field"><label>${L('العيادة / القسم', 'Clinic')}</label><select class="select" name="dept" id="bkDept">${db.departments.filter(d => docs.some(x => x.dept === d.id)).map(d => `<option value="${d.id}" ${preset.dept === d.id ? 'selected' : ''}>${esc(N(d.name))}</option>`).join('')}</select></div>
          <div class="field"><label>${L('الطبيب', 'Doctor')}</label><select class="select" name="doctorId" id="bkDoc"></select></div>
          <div class="field full"><label>${L('الخدمات', 'Services')}</label><div id="bkSvc" class="chips"></div></div>
          <div class="field"><label>${L('التاريخ', 'Date')}</label><input class="input" type="date" name="date" value="${preset.date || UI.isoDay(now)}" required></div>
          <div class="field"><label>${L('الوقت', 'Time')}</label><input class="input" type="time" name="time" value="${pad(now.getHours())}:${pad(now.getMinutes())}" required></div>
          <div class="field"><label>${L('مصدر الحجز', 'Booking source')}</label><select class="select" name="source">${['walkin', 'phone', 'vezeeta', 'clinido', 'ekshef', 'website'].map(s => `<option value="${s}">${UI.srcLabel(s)}</option>`).join('')}</select></div>
          <div class="field"><label>${L('ملاحظات', 'Notes')}</label><input class="input" name="notes"></div>
        </div></form>`,
      footer: `<button class="btn" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn primary" id="bkSave">${icon('check')}${L('تأكيد الحجز', 'Confirm booking')}</button>`,
      onMount(r, close) {
        let mode = 'old';
        r.querySelectorAll('[data-pm]').forEach(b => b.onclick = () => { mode = b.dataset.pm; r.querySelectorAll('[data-pm]').forEach(x => x.classList.toggle('on', x === b)); r.querySelector('#pmOld').classList.toggle('hidden', mode !== 'old'); r.querySelector('#pmNew').classList.toggle('hidden', mode !== 'new'); });
        const deptSel = r.querySelector('#bkDept'), docSel = r.querySelector('#bkDoc'), svc = r.querySelector('#bkSvc');
        const sync = () => {
          docSel.innerHTML = docs.filter(d => d.dept === deptSel.value).map(d => `<option value="${d.id}">${esc(N(d.name))} — ${money(d.fee)}</option>`).join('');
          svc.innerHTML = db.services.filter(s => s.dept === deptSel.value).map((s, i) => `<label class="chip"><input type="checkbox" value="${s.id}" ${i === 0 ? 'checked' : ''} style="margin:0"> ${esc(N(s.name))} · ${money(s.price)}</label>`).join('');
        };
        deptSel.onchange = sync; sync();
        r.querySelector('#bkSave').onclick = () => {
          const f = r.querySelector('#bkForm'); if (!f.reportValidity()) return; const d = UI.formData(f);
          let pid;
          if (mode === 'old') { const v = r.querySelector('#patPick').value.split(' — ')[0].trim(); if (!Store.get.patient(v)) { UI.toast(L('اختر مريضاً من القائمة', 'Pick a patient from the list'), '', 'warning', 'info'); return; } pid = v; }
          else { if (!d.pname) { UI.toast(L('أدخل اسم المريض', 'Enter patient name'), '', 'warning', 'info'); return; } pid = Store.addPatient({ name: { ar: d.pname, en: d.pname }, phone: d.pphone, gender: d.pgender, dob: d.pdob, prefs: [d.dept] }).id; }
          const start = new Date(d.date + 'T' + d.time); const services = [...svc.querySelectorAll('input:checked')].map(x => x.value);
          const ext = { vezeeta: 'VZ-', clinido: 'CD-', ekshef: 'EK-', website: 'WEB-' }[d.source];
          const a = Store.createAppointment({ patientId: pid, doctorId: d.doctorId, start: start.toISOString(), services, source: d.source, externalRef: ext ? ext + Math.floor(100000 + Math.random() * 899999) : null, notes: d.notes, status: 'confirmed' });
          close(); UI.toast(L('تم إنشاء الحجز', 'Booking created'), `${a.id} · ${UI.fdt(a.start)}`, 'success', 'calendar-check'); App.refresh();
        };
      }
    });
  }

  return { itemPicker, visitModal, addItemsModal, invoiceModal, newBookingModal, stockError };
})();

/* ============================== DASHBOARD ============================== */
App.pages.dashboard = {
  render(el) {
    const { L, N, esc, icon, money, nf, kpi } = UI; const db = Store.db; const me = Store.me();
    const today = UI.isoDay(new Date());
    const appts = Store.appointments(); const todays = appts.filter(a => UI.sameDay(a.start, today));
    const done = todays.filter(a => a.status === 'completed').length;
    const inside = todays.filter(a => ['arrived', 'in_progress'].includes(a.status)).length;
    const remaining = todays.filter(a => ['pending', 'confirmed', 'arrived', 'in_progress'].includes(a.status)).length;
    const plat = todays.filter(a => ['vezeeta', 'clinido', 'ekshef', 'website'].includes(a.source)).length;
    const invs = Store.invoices();
    const revToday = invs.filter(i => UI.sameDay(i.date, today)).reduce((s, i) => s + i.total, 0);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const revMonth = invs.filter(i => new Date(i.date) >= monthStart).reduce((s, i) => s + i.total, 0);
    const low = db.products.filter(p => p.qty <= p.min);
    const hour = new Date().getHours();
    const greet = hour < 12 ? L('صباح الخير', 'Good morning') : L('مساء الخير', 'Good evening');
    const r = me.role;
    let html = App.pageHead(`${greet}، ${esc(N(me.name))}`, `${UI.fdate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${esc(N(me.title))}`,
      (Store.can('bookings') && r !== 'doctor' ? `<button class="btn primary" id="dNew">${icon('plus')}${L('حجز جديد', 'New booking')}</button>` : '') + (Store.can('performance') ? `<a class="btn" href="#/performance">${icon('trophy')}${r === 'doctor' ? L('تقرير أدائي', 'My report') : L('تقرير الأداء نصف الشهري', 'Half-month report')}</a>` : ''));

    if (r === 'doctor') {
      const doc = Store.get.doctor(me.doctorId);
      const per = Store.periods()[0]; const perf = Store.doctorPerformance(doc.id, per.from, per.to);
      const queue = todays.filter(a => a.status !== 'cancelled').sort((a, b) => a.start.localeCompare(b.start));
      const cur = queue.find(a => a.status === 'in_progress') || queue.find(a => a.status === 'arrived') || queue.find(a => ['confirmed', 'pending'].includes(a.status));
      html += `<div class="grid g4" style="margin-bottom:16px">
        ${kpi(L('مرضى اليوم', "Today's patients"), nf(queue.length), 'users', 'primary', `${nf(done)} ${L('مكتمل', 'done')} · ${nf(remaining)} ${L('متبقي', 'left')}`)}
        ${kpi(L('في الانتظار الآن', 'Waiting now'), nf(todays.filter(a => a.status === 'arrived').length), 'armchair', 'warning', L('وصلوا للعيادة', 'checked in'))}
        ${kpi(L('تقييم المرضى', 'Patient rating'), `${nf(perf.avgRating, 1)} / 5`, 'star', 'accent', L('الفترة الحالية', 'current period'))}
        ${kpi(L('عمولتي هذه الفترة', 'My commission (period)'), money(perf.commission), 'hand-coins', 'success', `${doc.commission}% ${L('من قيمة الكشف والخدمات', 'of consultation & services')}`)}
      </div>
      <div class="grid g-main">
        <div class="card"><div class="card-head"><h3>${icon('list-ordered')}${L('قائمة مرضى اليوم', "Today's queue")}</h3><a href="#/bookings" class="btn sm">${L('عرض الكل', 'View all')}</a></div><div class="card-body flush">
        ${UI.table([
          { label: L('الوقت', 'Time'), render: a => `<b class="num">${UI.ftime(a.start)}</b>` },
          { label: L('المريض', 'Patient'), render: a => { const p = Store.get.patient(a.patientId); return `<a href="#/patients/${p.id}" class="cell-main">${esc(N(p.name))}</a><div class="cell-sub">${UI.age(p.dob)} ${L('سنة', 'yrs')}${p.chronic.length ? ' · ' + p.chronic.map(c => esc(N(c))).join('، ') : ''}</div>`; } },
          { label: L('المصدر', 'Source'), render: a => UI.srcBadge(a.source) },
          { label: L('الحالة', 'Status'), render: a => UI.statusBadge(a.status) },
          { label: '', render: a => a.status === 'arrived' ? `<button class="btn sm primary" data-start="${a.id}">${icon('play')}${L('بدء الكشف', 'Start')}</button>` : a.status === 'in_progress' ? `<button class="btn sm accent" data-finish="${a.id}">${icon('stethoscope')}${L('إنهاء الكشف', 'Complete')}</button>` : '' }
        ], queue, { empty: L('لا يوجد مرضى اليوم', 'No patients today'), rowAttr: a => a._new ? 'class="flash"' : '' })}</div></div>
        <div class="stack">
          <div class="card"><div class="card-head"><h3>${icon('user-round-check')}${L('المريض الحالي / التالي', 'Current / next patient')}</h3></div><div class="card-body">${cur ? (() => { const p = Store.get.patient(cur.patientId); const last = db.encounters.filter(e => e.patientId === p.id).slice(-1)[0]; return `<div class="row">${UI.avatar(p.name, 'lg')}<div><div style="font-weight:700;font-size:17px">${esc(N(p.name))}</div><div class="small muted">${UI.ftime(cur.start)} · ${UI.statusBadge(cur.status)}</div></div></div>
            <dl class="kv" style="margin-top:14px"><dt>${L('العمر', 'Age')}</dt><dd>${UI.age(p.dob)}</dd><dt>${L('فصيلة الدم', 'Blood')}</dt><dd>${p.blood}</dd><dt>${L('حساسية', 'Allergies')}</dt><dd>${p.allergies.length ? `<span style="color:var(--danger)">${p.allergies.map(x => esc(N(x))).join('، ')}</span>` : L('لا يوجد', 'None')}</dd><dt>${L('آخر تشخيص', 'Last diagnosis')}</dt><dd>${last ? esc(N(last.diagnosis)) : '—'}</dd></dl>
            <div class="row" style="margin-top:14px"><a class="btn sm" href="#/patients/${p.id}">${icon('folder-open')}${L('الملف الطبي', 'Medical file')}</a>${cur.status === 'arrived' ? `<button class="btn sm primary" data-start="${cur.id}">${icon('play')}${L('بدء الكشف', 'Start')}</button>` : cur.status === 'in_progress' ? `<button class="btn sm accent" data-finish="${cur.id}">${icon('stethoscope')}${L('إنهاء الكشف', 'Complete')}</button>` : ''}</div>`; })() : UI.empty(L('لا يوجد مرضى في الانتظار', 'Nobody waiting'), 'coffee')}</div></div>
          <div class="card"><div class="card-head"><h3>${icon('gauge')}${L('مؤشراتي هذه الفترة', 'My period KPIs')}</h3></div><div class="card-body stack" style="gap:10px">
            ${[[L('نسبة تحسن المرضى', 'Patients improved'), perf.improvedRate, 'var(--success)'], [L('نسبة إتمام الحجوزات', 'Completion rate'), perf.completionRate, 'var(--primary)'], [L('نسبة الإشغال', 'Utilization'), perf.utilization, 'var(--accent)']].map(x => `<div><div class="row between small"><span>${x[0]}</span><b>${UI.pct(x[1])}</b></div><div class="progress"><span style="width:${Math.min(100, x[1])}%;background:${x[2]}"></span></div></div>`).join('')}
            <div class="row between small"><span>${L('متوسط الانتظار', 'Avg. wait')}</span><b>${nf(perf.avgWait)} ${L('دقيقة', 'min')}</b></div>
          </div></div>
        </div>
      </div>`;
      el.innerHTML = html; bindQueue(el); return;
    }

    // ---------- admin / reception / sales / store / accountant
    const showMoney = ['admin', 'sales', 'accountant'].includes(r);
    const kpis = [];
    if (r !== 'store') {
      kpis.push(kpi(L('حجوزات اليوم', "Today's bookings"), nf(todays.length), 'calendar-check-2', 'primary', `${nf(done)} ${L('مكتمل', 'done')} · ${nf(remaining)} ${L('متبقي', 'remaining')}`));
      kpis.push(kpi(L('من منصات الحجز', 'From booking platforms'), nf(plat), 'plug-zap', 'accent', `${UI.pct(todays.length ? plat / todays.length * 100 : 0)} ${L('من حجوزات اليوم', 'of today')}`));
    }
    if (showMoney) { kpis.push(kpi(L('إيرادات اليوم', 'Revenue today'), money(revToday), 'banknote', 'success', `${L('الشهر', 'Month')}: ${money(revMonth)}`)); }
    if (r === 'reception') kpis.push(kpi(L('داخل المستشفى الآن', 'In hospital now'), nf(inside), 'armchair', 'warning', L('وصلوا أو داخل الكشف', 'arrived or in consultation')));
    if (r === 'reception' || r === 'admin') kpis.push(kpi(L('تنبيهات المخزون', 'Stock alerts'), nf(low.length), 'package-x', 'danger', L('أصناف تحت حد الطلب', 'items below reorder level')));
    if (r === 'store' || r === 'accountant' || r === 'sales') {
      const val = db.products.reduce((s, p) => s + p.qty * p.cost, 0);
      const exp = db.products.filter(p => p.expiry && (new Date(p.expiry) - new Date()) / 864e5 < 45).length;
      if (r === 'store') { kpis.push(kpi(L('قيمة المخزون', 'Stock value'), money(val), 'warehouse', 'primary')); kpis.push(kpi(L('أصناف تحت حد الطلب', 'Below reorder level'), nf(low.length), 'package-x', 'danger')); kpis.push(kpi(L('نفد من المخزن', 'Out of stock'), nf(db.products.filter(p => p.qty <= 0).length), 'circle-off', 'warning')); kpis.push(kpi(L('قرب انتهاء الصلاحية', 'Expiring ≤ 45 days'), nf(exp), 'calendar-clock', 'info')); }
      else { const unpaid = db.invoices.filter(i => i.status !== 'paid'); kpis.push(kpi(L('مستحقات غير محصلة', 'Outstanding'), money(unpaid.reduce((s, i) => s + Store.invBalance(i), 0)), 'wallet', 'warning', `${nf(unpaid.length)} ${L('فاتورة', 'invoices')}`)); }
    }
    html += `<div class="grid g4" style="margin-bottom:16px">${kpis.slice(0, 4).join('')}</div>`;

    if (r !== 'store') {
      html += `<div class="grid g-main" style="margin-bottom:16px">
        <div class="card"><div class="card-head"><h3>${icon('chart-line')}${showMoney ? L('الإيرادات والحجوزات — آخر 14 يوم', 'Revenue & bookings — last 14 days') : L('الحجوزات — آخر 14 يوم', 'Bookings — last 14 days')}</h3></div><div class="card-body"><div class="chart-box"><canvas id="c14"></canvas></div></div></div>
        <div class="card"><div class="card-head"><h3>${icon('chart-pie')}${L('مصادر الحجز هذا الشهر', 'Booking sources this month')}</h3></div><div class="card-body"><div class="chart-box"><canvas id="cSrc"></canvas></div></div></div>
      </div>
      <div class="grid g-main" style="margin-bottom:16px">
        <div class="card"><div class="card-head"><h3>${icon('stethoscope')}${L('العيادات والأطباء اليوم', 'Clinics & doctors today')}</h3><a href="#/bookings" class="btn sm">${L('الحجوزات', 'Bookings')}</a></div><div class="card-body flush">
          ${UI.table([
            { label: L('الطبيب', 'Doctor'), render: d => `<div class="row">${UI.avatar(d.name)}<div><div class="cell-main">${esc(N(d.name))}</div><div class="cell-sub"><span class="dept-dot" style="background:${Store.get.dept(d.dept).color}"></span> ${esc(N(Store.get.dept(d.dept).name))}</div></div></div>` },
            { label: L('الشيفت', 'Shift'), render: d => { const s = Store.get.shift(d.shift); return `<span class="small">${s.from}–${s.to}</span>`; } },
            { label: L('الحجوزات', 'Booked'), render: d => `<b class="num">${nf(todays.filter(a => a.doctorId === d.id && a.status !== 'cancelled').length)}</b>` },
            { label: L('مكتمل', 'Done'), render: d => nf(todays.filter(a => a.doctorId === d.id && a.status === 'completed').length) },
            { label: L('في الانتظار', 'Waiting'), render: d => { const n = todays.filter(a => a.doctorId === d.id && a.status === 'arrived').length; return n ? `<span class="badge tone-warning">${nf(n)}</span>` : '<span class="muted">0</span>'; } },
            { label: L('الآن', 'Now'), render: d => todays.some(a => a.doctorId === d.id && a.status === 'in_progress') ? `<span class="badge tone-primary"><span class="dot"></span>${L('في كشف', 'With patient')}</span>` : `<span class="badge tone-muted">${L('متاح', 'Free')}</span>` }
          ], db.doctors)}</div></div>
        <div class="card"><div class="card-head"><h3><span class="pulse" style="color:var(--success)"></span>${L('الحجوزات الواردة من المنصات', 'Incoming platform bookings')}</h3><a href="#/integrations" class="btn sm">${L('الربط', 'Integrations')}</a></div><div class="card-body flush" style="max-height:420px;overflow:auto">
          ${feed(8)}</div></div>
      </div>`;
    }
    if (r === 'admin' || r === 'accountant') {
      const per = Store.periods()[1]; const rows = db.doctors.map(d => Store.doctorPerformance(d.id, per.from, per.to)); const ins = Store.insights(rows).slice(0, 5);
      html += `<div class="grid g2" style="margin-bottom:16px">
        <div class="card"><div class="card-head"><h3>${icon('scan-search')}${L('نقاط الضعف والتوصيات', 'Weak points & recommendations')}</h3><a href="#/performance" class="btn sm">${L('التقرير الكامل', 'Full report')}</a></div><div class="card-body flush">${ins.map(i => `<div class="feed-item"><div class="k-icon tone-${i.tone}" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex-shrink:0">${icon(i.icon, 'ic-sm')}</div><div><div style="font-weight:600">${esc(N(i.title))}${i.who ? ` — <span class="muted">${esc(N(i.who))}</span>` : ''}</div><div class="small muted">${esc(N(i.text))}</div></div></div>`).join('')}</div></div>
        <div class="card"><div class="card-head"><h3>${icon('building-2')}${L('إيرادات العيادات هذا الشهر', 'Clinic revenue this month')}</h3></div><div class="card-body"><div class="chart-box"><canvas id="cDept"></canvas></div></div></div>
      </div>`;
    }
    if (r === 'store' || r === 'reception' || r === 'admin') {
      html += `<div class="grid ${r === 'store' ? 'g-main' : 'g2'}">
        <div class="card"><div class="card-head"><h3>${icon('package-x')}${L('أصناف تحتاج إعادة طلب', 'Items to reorder')}</h3><a href="#/inventory" class="btn sm">${L('المخزون', 'Inventory')}</a></div><div class="card-body flush">
        ${UI.table([{ label: L('الصنف', 'Item'), render: p => `<div class="cell-main">${esc(N(p.name))}</div><div class="cell-sub">${esc(N(Store.get.category(p.cat).name))}</div>` }, { label: L('المتاح', 'On hand'), render: p => `<b class="num" style="color:${p.qty <= 0 ? 'var(--danger)' : 'var(--warning)'}">${nf(p.qty)}</b> <span class="muted xs">${esc(N(p.unit))}</span>` }, { label: L('حد الطلب', 'Min'), render: p => nf(p.min) }], low.slice(0, 8), { empty: L('كل الأصناف متوفرة', 'All items in stock') })}</div></div>
        <div class="card"><div class="card-head"><h3>${icon('chart-bar')}${L('استهلاك المستلزمات حسب العيادة (30 يوم)', 'Consumption by clinic (30 days)')}</h3></div><div class="card-body"><div class="chart-box"><canvas id="cCons"></canvas></div></div></div>
      </div>`;
    }
    el.innerHTML = html;
    const nb = el.querySelector('#dNew'); if (nb) nb.onclick = () => Comp.newBookingModal();
    bindQueue(el);

    // charts
    const prim = UI.cssVar('--primary'), acc = UI.cssVar('--accent');
    const c14 = el.querySelector('#c14');
    if (c14) {
      const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return UI.isoDay(d); });
      const ds = [{ type: 'bar', label: L('الحجوزات', 'Bookings'), data: days.map(d => appts.filter(a => UI.sameDay(a.start, d) && a.status !== 'cancelled').length), backgroundColor: prim + '55', borderRadius: 6, yAxisID: 'y' }];
      if (showMoney) ds.push({ type: 'line', label: L('الإيرادات', 'Revenue'), data: days.map(d => invs.filter(i => UI.sameDay(i.date, d)).reduce((s, i) => s + i.total, 0)), borderColor: acc, backgroundColor: acc, tension: .35, pointRadius: 2, yAxisID: 'y1' });
      UI.chart(c14, { data: { labels: days.map(d => UI.fdate(d, { day: 'numeric', month: 'short' })), datasets: ds }, options: { scales: { y: { beginAtZero: true, grid: { display: false } }, y1: { display: showMoney, position: UI.lang === 'ar' ? 'left' : 'right', beginAtZero: true, grid: { display: false } } } } });
    }
    const cSrc = el.querySelector('#cSrc');
    if (cSrc) {
      const m = appts.filter(a => new Date(a.start) >= monthStart); const keys = Object.keys(UI.SOURCES);
      UI.chart(cSrc, { type: 'doughnut', data: { labels: keys.map(UI.srcLabel), datasets: [{ data: keys.map(k => m.filter(a => a.source === k).length), backgroundColor: keys.map(UI.srcColor), borderWidth: 2, borderColor: UI.cssVar('--surface') }] }, options: { cutout: '64%' } });
    }
    const cDept = el.querySelector('#cDept');
    if (cDept) UI.chart(cDept, { type: 'bar', data: { labels: db.departments.map(d => N(d.name)), datasets: [{ label: L('الإيرادات', 'Revenue'), data: db.departments.map(d => db.invoices.filter(i => i.dept === d.id && new Date(i.date) >= monthStart).reduce((s, i) => s + i.total, 0)), backgroundColor: db.departments.map(d => d.color), borderRadius: 6 }] }, options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } } });
    const cCons = el.querySelector('#cCons');
    if (cCons) { const since = Date.now() - 30 * 864e5; UI.chart(cCons, { type: 'bar', data: { labels: db.departments.map(d => N(d.name)), datasets: [{ label: L('تكلفة المستلزمات', 'Items cost'), data: db.departments.map(d => db.movements.filter(m => m.type === 'out' && m.dept === d.id && new Date(m.at) >= since).reduce((s, m) => s + m.qty * Store.get.product(m.productId).cost, 0)), backgroundColor: db.departments.map(d => d.color), borderRadius: 6 }] }, options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } } } } }); }

    function feed(n) {
      const list = Store.appointments().filter(a => ['vezeeta', 'clinido', 'ekshef', 'website'].includes(a.source)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, n);
      return list.map(a => { const p = Store.get.patient(a.patientId), d = Store.get.doctor(a.doctorId); return `<div class="feed-item ${a._new ? 'new' : ''}">${UI.srcBadge(a.source)}<div class="grow"><div style="font-weight:600">${esc(N(p.name))}</div><div class="small muted">${icon('arrow-left', 'ic-sm')} ${esc(N(d.name))} · ${esc(N(Store.get.dept(a.dept).name))}</div><div class="xs muted">${L('الموعد', 'Appt')}: ${UI.fdt(a.start)} · <span class="ltr">${a.externalRef || ''}</span></div></div><span class="xs muted">${UI.ago(a.createdAt)}</span></div>`; }).join('') || UI.empty();
    }
  }
};
function bindQueue(el) {
  el.querySelectorAll('[data-start]').forEach(b => b.onclick = () => { Store.setStatus(b.dataset.start, 'in_progress'); UI.toast(UI.L('بدأ الكشف', 'Consultation started'), '', 'primary', 'play'); App.refresh(); });
  el.querySelectorAll('[data-finish]').forEach(b => b.onclick = () => Comp.visitModal(b.dataset.finish));
}

/* ============================== BOOKINGS ============================== */
App.pages.bookings = (function () {
  const st = { date: null, doctor: '', dept: '', branch: '', shift: '', source: '', q: '', tab: 'all', view: 'list', reports: true };
  return {
    render(el) {
      const { L, N, esc, icon, money, nf } = UI; const db = Store.db;
      if (!st.date) st.date = UI.isoDay(new Date());
      const isDoc = Store.isDoctor(); if (isDoc) st.doctor = Store.myDoctorId();
      const dayAppts = Store.appointments().filter(a => UI.sameDay(a.start, st.date));
      const filtered = dayAppts.filter(a => (!st.doctor || a.doctorId === st.doctor) && (!st.dept || a.dept === st.dept) && (!st.branch || a.branch === st.branch) && (!st.shift || a.shift === st.shift) && (!st.source || a.source === st.source) &&
        (!st.q || (() => { const p = Store.get.patient(a.patientId); return p.name.ar.includes(st.q) || p.name.en.toLowerCase().includes(st.q.toLowerCase()) || p.phone.includes(st.q) || p.id.includes(st.q) || (a.externalRef || '').includes(st.q); })()));
      const TABS = [['all', L('الكل', 'All'), () => true], ['waiting', L('القادمة', 'Upcoming'), a => ['pending', 'confirmed'].includes(a.status)], ['arrived', L('وصلوا', 'Arrived'), a => a.status === 'arrived'], ['in_progress', L('داخل الكشف', 'In consultation'), a => a.status === 'in_progress'], ['completed', L('المكتملة', 'Completed'), a => a.status === 'completed'], ['cancelled', L('الملغاة / لم يحضر', 'Cancelled / no-show'), a => ['cancelled', 'no_show'].includes(a.status)]];
      const tabFn = TABS.find(t => t[0] === st.tab)[2];
      const rows = filtered.filter(tabFn);
      const svcCount = {}; filtered.forEach(a => a.services.forEach(s => svcCount[s] = (svcCount[s] || 0) + 1));
      const srcCount = {}; filtered.forEach(a => srcCount[a.source] = (srcCount[a.source] || 0) + 1);
      const d = new Date(st.date + 'T00:00');
      const isToday = st.date === UI.isoDay(new Date());

      el.innerHTML = `
      ${App.pageHead(L('الحجوزات', 'Bookings'), isDoc ? L('حجوزاتك فقط — تظهر هنا تلقائياً فور الحجز من أي منصة', 'Your bookings only — they appear here automatically from every platform') : L('كل حجوزات العيادات من فيزيتا وكلينيدو وإكشف والاستقبال في شاشة واحدة', 'All clinic bookings from Vezeeta, CliniDo, Ekshef and reception in one screen'),
        `<div class="btn-group"><button data-view="list" class="${st.view === 'list' ? 'on' : ''}">${icon('list')}${L('قائمة', 'List')}</button><button data-view="board" class="${st.view === 'board' ? 'on' : ''}">${icon('columns-3')}${L('حسب الطبيب', 'By doctor')}</button></div>
         ${isDoc ? '' : `<button class="btn primary" id="bNew">${icon('plus')}${L('إضافة حجز', 'New booking')}</button>`}`)}
      <div class="card" style="margin-bottom:16px"><div class="card-body">
        <div class="row wrap between" style="gap:12px">
          <div class="row"><button class="btn icon" data-day="-1">${icon(UI.lang === 'ar' ? 'chevron-right' : 'chevron-left')}</button><input type="date" class="input" style="width:170px" id="bDate" value="${st.date}"><button class="btn icon" data-day="1">${icon(UI.lang === 'ar' ? 'chevron-left' : 'chevron-right')}</button>${isToday ? `<span class="badge tone-primary">${L('اليوم', 'Today')}</span>` : `<button class="btn sm ghost" id="bToday">${L('اليوم', 'Today')}</button>`}<span class="muted small">${UI.fdate(d, { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
          <div class="search" style="position:relative;min-width:220px"><input class="input" id="bQ" placeholder="${L('ابحث باسم المريض أو الهاتف أو رقم الحجز', 'Search name, phone or booking ref')}" value="${esc(st.q)}"></div>
        </div>
        <div class="filters" style="margin-top:12px">
          ${isDoc ? '' : `<select class="select sm" data-f="doctor">${UI.options(db.doctors.filter(x => !st.dept || x.dept === st.dept), st.doctor, L('كل الأطباء', 'All doctors'))}</select>
          <select class="select sm" data-f="dept">${UI.options(db.departments, st.dept, L('كل الأقسام', 'All clinics'))}</select>`}
          <select class="select sm" data-f="branch">${UI.options(db.branches, st.branch, L('كل الفروع', 'All branches'))}</select>
          <select class="select sm" data-f="shift">${UI.options(db.shifts, st.shift, L('كل الشيفتات', 'All shifts'))}</select>
          <select class="select sm" data-f="source"><option value="">${L('كل المصادر', 'All sources')}</option>${Object.keys(UI.SOURCES).map(s => `<option value="${s}" ${st.source === s ? 'selected' : ''}>${UI.srcLabel(s)}</option>`).join('')}</select>
          ${(st.doctor && !isDoc) || st.dept || st.branch || st.shift || st.source || st.q ? `<button class="btn sm ghost" id="bClear">${icon('x')}${L('مسح الفلاتر', 'Clear')}</button>` : ''}
        </div>
      </div></div>

      <div class="card" style="margin-bottom:16px"><div class="card-head" style="cursor:pointer" id="bRepToggle"><h3>${icon('chart-no-axes-column')}${L('ملخص اليوم', 'Day summary')}</h3>${icon(st.reports ? 'chevron-up' : 'chevron-down')}</div>
      ${st.reports ? `<div class="card-body"><div class="grid g4">
        ${UI.kpi(L('إجمالي الحجوزات', 'Total bookings'), nf(filtered.length), 'calendar-days', 'primary')}
        ${UI.kpi(L('الحجوزات المكتملة', 'Completed'), nf(filtered.filter(a => a.status === 'completed').length), 'circle-check', 'success')}
        ${UI.kpi(L('الملغاة / لم يحضر', 'Cancelled / no-show'), nf(filtered.filter(a => ['cancelled', 'no_show'].includes(a.status)).length), 'circle-x', 'danger')}
        ${UI.kpi(L('الحجوزات المتبقية', 'Remaining'), nf(filtered.filter(a => ['pending', 'confirmed', 'arrived', 'in_progress'].includes(a.status)).length), 'hourglass', 'warning')}
      </div>
      <div class="row wrap" style="margin-top:14px;gap:16px;align-items:flex-start">
        <div class="grow"><div class="section-title">${L('الخدمات', 'Services')}</div><div class="chips">${Object.keys(svcCount).map(id => `<span class="tag">${esc(N(Store.get.service(id).name))} <b>${nf(svcCount[id])}</b></span>`).join('') || '<span class="muted small">—</span>'}</div></div>
        <div class="grow"><div class="section-title">${L('المصادر', 'Sources')}</div><div class="chips">${Object.keys(srcCount).map(s => `<span class="row" style="gap:4px">${UI.srcBadge(s)}<b class="small">${nf(srcCount[s])}</b></span>`).join('') || '<span class="muted small">—</span>'}</div></div>
      </div></div>` : ''}</div>

      <div class="card">
        <div style="padding:0 12px"><div class="tabs">${TABS.map(t => `<button data-tab="${t[0]}" class="${st.tab === t[0] ? 'on' : ''}">${t[1]} <span class="cnt">${nf(filtered.filter(t[2]).length)}</span></button>`).join('')}</div></div>
        <div id="bBody"></div>
      </div>`;

      const body = el.querySelector('#bBody');
      if (st.view === 'list') {
        body.innerHTML = UI.table([
          { label: '#', w: '44px', render: (a, i) => `<span class="muted num">${nf(i + 1)}</span>` },
          { label: L('اسم المريض', 'Patient'), render: a => { const p = Store.get.patient(a.patientId); return `<a href="#/patients/${p.id}" class="cell-main">${esc(N(p.name))}</a><div class="cell-sub">${L('الموعد', 'Time')}: <b>${UI.ftime(a.start)}</b> · <span class="ltr">${a.id}</span></div>`; } },
          { label: L('رقم الهاتف', 'Phone'), render: a => `<span class="ltr small">${Store.get.patient(a.patientId).phone}</span>` },
          { label: L('العيادة / الطبيب', 'Clinic / doctor'), render: a => `<div class="small" style="font-weight:600"><span class="dept-dot" style="background:${Store.get.dept(a.dept).color}"></span> ${esc(N(Store.get.dept(a.dept).name))}</div><div class="cell-sub">${esc(N(Store.get.doctor(a.doctorId).name))}</div>` },
          { label: L('الخدمات', 'Services'), render: a => a.services.map(s => `<span class="tag">${esc(N(Store.get.service(s).name))}</span>`).join(' ') },
          { label: L('المصدر', 'Source'), render: a => `${UI.srcBadge(a.source)}${a.externalRef ? `<div class="cell-sub ltr">${a.externalRef}</div>` : ''}` },
          { label: L('الإجمالي', 'Total'), render: a => `<span class="num">${money(a.invoiceId ? Store.get.invoice(a.invoiceId).total : a.fee)}</span>` },
          { label: L('الحالة', 'Status'), render: a => `${UI.statusBadge(a.status)}${a.status === 'arrived' && a.arrivedAt ? `<div class="cell-sub">${icon('timer', 'ic-sm')} ${L('ينتظر منذ', 'waiting')} ${nf(Math.max(0, Math.round((Date.now() - new Date(a.arrivedAt)) / 60000)))} ${L('د', 'min')}</div>` : ''}` },
          { label: L('الإجراءات', 'Actions'), render: a => actions(a) }
        ], rows, { empty: L('لا توجد حجوزات بهذه الفلاتر', 'No bookings match these filters'), rowAttr: a => a._new ? 'class="flash"' : '' });
      } else {
        const docs = (isDoc ? [Store.get.doctor(Store.myDoctorId())] : db.doctors).filter(x => (!st.doctor || x.id === st.doctor) && (!st.dept || x.dept === st.dept) && (!st.branch || x.branch === st.branch) && (!st.shift || x.shift === st.shift));
        body.innerHTML = `<div class="card-body"><div class="board">${docs.map(doc => { const list = rows.filter(a => a.doctorId === doc.id); const dp = Store.get.dept(doc.dept); return `<div class="board-col"><div class="board-col-head">${UI.avatar(doc.name)}<div class="grow"><div style="font-weight:600;font-size:13px">${esc(N(doc.name))}</div><div class="xs muted">${esc(N(dp.name))}</div></div><span class="badge tone-muted">${nf(list.length)}</span></div><div class="board-col-body">${list.map(a => { const p = Store.get.patient(a.patientId); return `<div class="appt-card ${a._new ? 'flash' : ''}" style="border-inline-start-color:${dp.color}" data-open="${p.id}"><div class="row between"><b class="num">${UI.ftime(a.start)}</b>${UI.statusBadge(a.status)}</div><div style="font-weight:600;margin-top:6px">${esc(N(p.name))}</div><div class="row between" style="margin-top:6px">${UI.srcBadge(a.source)}<span class="xs muted">${a.services.length} ${L('خدمة', 'svc')}</span></div><div class="actions" style="margin-top:8px">${actions(a)}</div></div>`; }).join('') || `<div class="muted small" style="text-align:center;padding:20px">${L('لا توجد حجوزات', 'No bookings')}</div>`}</div></div>`; }).join('')}</div></div>`;
      }
      UI.icons(el);

      function actions(a) {
        const role = Store.me().role; const front = ['admin', 'reception'].includes(role); const clin = role === 'doctor' || role === 'admin';
        const b = [];
        if (a.status === 'pending' && front) b.push(`<button class="btn sm soft" data-act="confirmed" data-id="${a.id}">${icon('check')}${L('تأكيد', 'Confirm')}</button>`);
        if (['pending', 'confirmed'].includes(a.status) && front) b.push(`<button class="btn sm primary" data-act="arrived" data-id="${a.id}">${icon('log-in')}${L('تسجيل حضور', 'Check in')}</button>`);
        if (a.status === 'arrived' && clin) b.push(`<button class="btn sm primary" data-start="${a.id}">${icon('play')}${L('بدء الكشف', 'Start')}</button>`);
        if (a.status === 'in_progress' && clin) b.push(`<button class="btn sm accent" data-finish="${a.id}">${icon('stethoscope')}${L('إنهاء الكشف', 'Complete')}</button>`);
        if (a.status === 'completed' && a.invoiceId && Store.can('sales')) b.push(`<button class="btn sm icon" title="${L('الفاتورة', 'Invoice')}" data-inv="${a.invoiceId}">${icon('receipt-text')}</button>`);
        if (a.status === 'completed' && (front || clin)) { const enc = Store.db.encounters.find(e => e.apptId === a.id); if (enc) b.push(`<button class="btn sm icon" title="${L('إضافة مستلزمات', 'Add items')}" data-items="${enc.id}">${icon('package-plus')}</button>`); }
        if (['pending', 'confirmed'].includes(a.status) && front) { b.push(`<button class="btn sm icon ghost" title="${L('لم يحضر', 'No-show')}" data-act="no_show" data-id="${a.id}">${icon('user-x')}</button>`); b.push(`<button class="btn sm icon ghost" style="color:var(--danger)" title="${L('إلغاء', 'Cancel')}" data-act="cancelled" data-id="${a.id}">${icon('circle-x')}</button>`); }
        b.push(`<a class="btn sm icon ghost" title="${L('ملف المريض', 'Patient file')}" href="#/patients/${a.patientId}">${icon('folder-open')}</a>`);
        return `<div class="actions">${b.join('')}</div>`;
      }

      // events
      el.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { st.view = b.dataset.view; App.refresh(); });
      el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { st.tab = b.dataset.tab; App.refresh(); });
      el.querySelectorAll('[data-day]').forEach(b => b.onclick = () => { const x = new Date(st.date + 'T00:00'); x.setDate(x.getDate() + +b.dataset.day); st.date = UI.isoDay(x); App.refresh(); });
      el.querySelector('#bDate').onchange = e => { st.date = e.target.value || UI.isoDay(new Date()); App.refresh(); };
      const bt = el.querySelector('#bToday'); if (bt) bt.onclick = () => { st.date = UI.isoDay(new Date()); App.refresh(); };
      el.querySelectorAll('[data-f]').forEach(s => s.onchange = () => { st[s.dataset.f] = s.value; if (s.dataset.f === 'dept') st.doctor = ''; App.refresh(); });
      const q = el.querySelector('#bQ'); let tmr; q.oninput = () => { clearTimeout(tmr); tmr = setTimeout(() => { st.q = q.value.trim(); App.refresh(); const n = document.getElementById('bQ'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 300); };
      const bc = el.querySelector('#bClear'); if (bc) bc.onclick = () => { Object.assign(st, { doctor: isDoc ? st.doctor : '', dept: '', branch: '', shift: '', source: '', q: '' }); App.refresh(); };
      el.querySelector('#bRepToggle').onclick = () => { st.reports = !st.reports; App.refresh(); };
      const nb = el.querySelector('#bNew'); if (nb) nb.onclick = () => Comp.newBookingModal({ date: st.date, dept: st.dept });
      el.querySelectorAll('[data-act]').forEach(b => b.onclick = async e => {
        e.stopPropagation(); const s = b.dataset.act;
        if (s === 'cancelled' && !(await UI.confirmBox(L('إلغاء الحجز', 'Cancel booking'), L('هل تريد إلغاء هذا الحجز؟ سيتم تسجيل العملية في السجل.', 'Cancel this booking? This will be logged.'), L('إلغاء الحجز', 'Cancel booking'), 'danger'))) return;
        Store.setStatus(b.dataset.id, s); UI.toast(UI.statusLabel(s), b.dataset.id, s === 'cancelled' ? 'danger' : 'success', 'check'); App.refresh();
      });
      bindQueue(el);
      el.querySelectorAll('[data-inv]').forEach(b => b.onclick = e => { e.stopPropagation(); Comp.invoiceModal(b.dataset.inv); });
      el.querySelectorAll('[data-items]').forEach(b => b.onclick = e => { e.stopPropagation(); Comp.addItemsModal(b.dataset.items); });
      el.querySelectorAll('[data-open]').forEach(c => c.onclick = e => { if (e.target.closest('button,a')) return; App.go('#/patients/' + c.dataset.open); });
    }
  };
})();

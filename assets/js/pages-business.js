/* Inventory, sales & invoices, finance */
App.pages.inventory = (function () {
  const st = { tab: 'products', cat: '', status: '', q: '' };
  const status = p => p.qty <= 0 ? 'out' : p.qty <= p.min ? 'low' : (p.expiry && (new Date(p.expiry) - new Date()) / 864e5 < 45) ? 'exp' : 'ok';
  return {
    render(el) {
      const { L, N, esc, icon, money, nf } = UI; const db = Store.db;
      const canEdit = ['admin', 'store'].includes(Store.me().role);
      const SB = { out: ['tone-danger', L('نفد', 'Out of stock')], low: ['tone-warning', L('تحت حد الطلب', 'Low')], exp: ['tone-info', L('قرب الانتهاء', 'Expiring')], ok: ['tone-success', L('متوفر', 'In stock')] };
      const prods = db.products.filter(p => (!st.cat || p.cat === st.cat) && (!st.status || status(p) === st.status) && (!st.q || N(p.name).toLowerCase().includes(st.q.toLowerCase()) || p.sku.toLowerCase().includes(st.q.toLowerCase())));
      const val = db.products.reduce((s, p) => s + p.qty * p.cost, 0);
      el.innerHTML = `${App.pageHead(L('المخزون والمنتجات', 'Inventory & products'), L('كل صنف يُستخدم لمريض يُخصم تلقائياً — مع تتبع الفئات والكميات والصلاحية', 'Every item used for a patient is auto-deducted — with categories, quantities and expiry tracked'),
        canEdit ? `<button class="btn primary" id="iRecv">${icon('package-plus')}${L('استلام بضاعة', 'Receive stock')}</button>` : '')}
      <div class="grid g4" style="margin-bottom:16px">
        ${UI.kpi(L('قيمة المخزون (بالتكلفة)', 'Stock value (cost)'), money(val), 'warehouse', 'primary', `${nf(db.products.length)} ${L('صنف', 'items')} · ${nf(db.categories.length)} ${L('فئات', 'categories')}`)}
        ${UI.kpi(L('تحت حد الطلب', 'Below reorder level'), nf(db.products.filter(p => status(p) === 'low').length), 'triangle-alert', 'warning')}
        ${UI.kpi(L('نفد من المخزن', 'Out of stock'), nf(db.products.filter(p => p.qty <= 0).length), 'circle-off', 'danger')}
        ${UI.kpi(L('صرف آخر 7 أيام', 'Issued last 7 days'), money(db.movements.filter(m => m.type === 'out' && Date.now() - new Date(m.at) < 7 * 864e5).reduce((s, m) => s + m.qty * Store.get.product(m.productId).cost, 0)), 'arrow-up-from-line', 'accent')}
      </div>
      <div class="card">
        <div style="padding:0 12px"><div class="tabs">${[['products', L('الأصناف', 'Products'), 'boxes'], ['categories', L('الفئات', 'Categories'), 'folder-tree'], ['moves', L('حركة المخزون', 'Stock movements'), 'arrow-left-right'], ['usage', L('الاستهلاك حسب العيادة', 'Usage by clinic'), 'chart-bar']].map(t => `<button data-tab="${t[0]}" class="${st.tab === t[0] ? 'on' : ''}">${icon(t[2], 'ic-sm')}${t[1]}</button>`).join('')}</div></div>
        <div id="iBody"></div>
      </div>`;
      const body = el.querySelector('#iBody');
      if (st.tab === 'products') {
        body.innerHTML = `<div class="card-body" style="border-bottom:1px solid var(--border)"><div class="chips" style="margin-bottom:12px"><button class="chip ${!st.cat ? 'on' : ''}" data-cat="">${L('الكل', 'All')} <span class="cnt">${nf(db.products.length)}</span></button>${db.categories.map(c => `<button class="chip ${st.cat === c.id ? 'on' : ''}" data-cat="${c.id}">${icon(c.icon, 'ic-sm')}${esc(N(c.name))} <span class="cnt">${nf(db.products.filter(p => p.cat === c.id).length)}</span></button>`).join('')}</div>
          <div class="filters"><input class="input sm" id="iQ" placeholder="${L('بحث بالاسم أو الكود', 'Search name or SKU')}" value="${esc(st.q)}"><select class="select sm" id="iS"><option value="">${L('كل الحالات', 'All statuses')}</option>${Object.keys(SB).map(k => `<option value="${k}" ${st.status === k ? 'selected' : ''}>${SB[k][1]}</option>`).join('')}</select></div></div>
        <div class="card-body flush">${UI.table([
          { label: L('الصنف', 'Item'), cls: 'wrap', render: p => `<div class="cell-main">${esc(N(p.name))}</div><div class="cell-sub"><span class="code">${p.sku}</span></div>` },
          { label: L('الفئة', 'Category'), render: p => { const c = Store.get.category(p.cat); return `<span class="tag" style="color:${c.color}">${icon(c.icon, 'ic-sm')}${esc(N(c.name))}</span>`; } },
          { label: L('العيادات', 'Used by'), render: p => p.depts ? p.depts.map(d => `<span class="dept-dot" title="${esc(N(Store.get.dept(d).name))}" style="background:${Store.get.dept(d).color}"></span>`).join(' ') : `<span class="xs muted">${L('عام', 'General')}</span>` },
          { label: L('الكمية', 'On hand'), render: p => `<div style="min-width:120px"><div class="row between small"><b class="num">${nf(p.qty)}</b><span class="muted xs">${esc(N(p.unit))}</span></div><div class="qty-bar"><span style="width:${Math.min(100, p.qty / Math.max(1, p.min * 3) * 100)}%;background:${p.qty <= 0 ? 'var(--danger)' : p.qty <= p.min ? 'var(--warning)' : 'var(--success)'}"></span></div></div>` },
          { label: L('حد الطلب', 'Reorder at'), render: p => nf(p.min) },
          { label: L('التكلفة', 'Cost'), render: p => money(p.cost) }, { label: L('سعر البيع', 'Price'), render: p => p.price ? money(p.price) : `<span class="xs muted">${L('ضمن الخدمة', 'In service')}</span>` },
          { label: L('الصلاحية', 'Expiry'), render: p => p.expiry ? `<span class="small">${UI.fdate(p.expiry)}</span>` : '—' },
          { label: L('الحالة', 'Status'), render: p => `<span class="badge ${SB[status(p)][0]}">${SB[status(p)][1]}</span>` },
          { label: '', render: p => canEdit ? `<div class="actions"><button class="btn sm icon" title="${L('استلام', 'Receive')}" data-recv="${p.id}">${icon('plus')}</button><button class="btn sm icon ghost" title="${L('تسوية جرد', 'Adjust')}" data-adj="${p.id}">${icon('clipboard-pen')}</button></div>` : '' }
        ], prods)}</div>`;
      } else if (st.tab === 'categories') {
        body.innerHTML = `<div class="card-body"><div class="grid g3">${db.categories.map(c => { const ps = db.products.filter(p => p.cat === c.id); return `<div class="card"><div class="card-body"><div class="row"><div class="k-icon" style="width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:${c.color}1f;color:${c.color}">${icon(c.icon)}</div><div class="grow"><b>${esc(N(c.name))}</b><div class="xs muted">${nf(ps.length)} ${L('صنف', 'items')}</div></div></div><dl class="kv" style="margin-top:12px"><dt>${L('القيمة', 'Value')}</dt><dd>${money(ps.reduce((s, p) => s + p.qty * p.cost, 0))}</dd><dt>${L('نواقص', 'Low')}</dt><dd style="color:${ps.some(p => p.qty <= p.min) ? 'var(--danger)' : 'inherit'}">${nf(ps.filter(p => p.qty <= p.min).length)}</dd></dl><button class="btn sm" style="margin-top:12px" data-gocat="${c.id}">${L('عرض الأصناف', 'View items')}</button></div></div>`; }).join('')}</div></div>`;
      } else if (st.tab === 'moves') {
        const R = { consumption: L('صرف لمريض', 'Used for patient'), sale: L('بيع', 'Sale'), purchase: L('شراء / استلام', 'Purchase'), adjustment: L('تسوية جرد', 'Adjustment') };
        body.innerHTML = `<div class="card-body flush">${UI.table([
          { label: L('التاريخ', 'Date'), render: m => UI.fdt(m.at) },
          { label: L('النوع', 'Type'), render: m => m.type === 'in' ? `<span class="badge tone-success">${icon('arrow-down-to-line', 'ic-sm')}${L('وارد', 'In')}</span>` : `<span class="badge tone-danger">${icon('arrow-up-from-line', 'ic-sm')}${L('صادر', 'Out')}</span>` },
          { label: L('الصنف', 'Item'), render: m => `<b>${esc(N(Store.get.product(m.productId).name))}</b>` }, { label: L('الكمية', 'Qty'), render: m => `<b class="num">${m.type === 'in' ? '+' : '−'}${nf(m.qty)}</b>` },
          { label: L('السبب', 'Reason'), render: m => R[m.reason] || m.reason },
          { label: L('المرجع', 'Reference'), render: m => m.patientId ? `<a href="#/patients/${m.patientId}">${esc(N(Store.get.patient(m.patientId).name))}</a><div class="cell-sub ltr">${m.ref || ''}</div>` : `<span class="small">${esc(m.supplier || m.note || '')}</span><div class="cell-sub ltr">${m.ref || ''}</div>` },
          { label: L('العيادة', 'Clinic'), render: m => m.dept ? esc(N(Store.get.dept(m.dept).name)) : '—' },
          { label: L('بواسطة', 'By'), render: m => { const u = Store.get.user(m.by); return u ? `<span class="small">${esc(N(u.name))}</span>` : '—'; } }
        ], db.movements.slice().reverse().slice(0, 200))}</div>`;
      } else {
        body.innerHTML = `<div class="card-body"><div class="grid g-main"><div class="chart-box" style="height:320px"><canvas id="iUse"></canvas></div><div id="iTop"></div></div></div>`;
        const since = Date.now() - 30 * 864e5; const out = db.movements.filter(m => m.type === 'out' && m.reason === 'consumption' && new Date(m.at) >= since);
        UI.chart(body.querySelector('#iUse'), { type: 'bar', data: { labels: db.departments.map(d => N(d.name)), datasets: db.categories.map(c => ({ label: N(c.name), data: db.departments.map(d => out.filter(m => m.dept === d.id && Store.get.product(m.productId).cat === c.id).reduce((s, m) => s + m.qty * Store.get.product(m.productId).cost, 0)), backgroundColor: c.color, borderRadius: 4 })) }, options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true } } } });
        const agg = {}; out.forEach(m => agg[m.productId] = (agg[m.productId] || 0) + m.qty);
        body.querySelector('#iTop').innerHTML = `<div class="section-title">${icon('flame', 'ic-sm')}${L('الأكثر استهلاكاً (30 يوم)', 'Most used (30 days)')}</div>` + Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, q]) => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border)"><span class="small">${esc(N(Store.get.product(id).name))}</span><b class="num">${nf(q)}</b></div>`).join('');
      }
      UI.icons(el);
      el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { st.tab = b.dataset.tab; App.refresh(); });
      el.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { st.cat = b.dataset.cat; App.refresh(); });
      el.querySelectorAll('[data-gocat]').forEach(b => b.onclick = () => { st.cat = b.dataset.gocat; st.tab = 'products'; App.refresh(); });
      const s = el.querySelector('#iS'); if (s) s.onchange = () => { st.status = s.value; App.refresh(); };
      const q = el.querySelector('#iQ'); if (q) { let t; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { st.q = q.value.trim(); App.refresh(); const n = document.getElementById('iQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); }; }
      const recv = pid => UI.modal({
        title: `${icon('package-plus')} ${L('استلام بضاعة', 'Receive stock')}`,
        body: `<form id="rcF" class="form-grid"><div class="field full"><label>${L('الصنف', 'Item')}</label><select class="select" name="pid">${db.products.map(p => `<option value="${p.id}" ${p.id === pid ? 'selected' : ''}>${esc(N(p.name))} (${nf(p.qty)})</option>`).join('')}</select></div>
        <div class="field"><label>${L('الكمية', 'Quantity')}</label><input class="input" type="number" min="1" name="qty" value="10" required></div><div class="field"><label>${L('تكلفة الوحدة', 'Unit cost')}</label><input class="input" type="number" name="cost"></div>
        <div class="field full"><label>${L('المورد', 'Supplier')}</label><input class="input" name="sup" value="${L('المتحدة للأدوية', 'United Pharma')}"></div></form>`,
        footer: `<button class="btn" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn primary" id="rcS">${L('حفظ', 'Save')}</button>`,
        onMount(r, close) { r.querySelector('#rcS').onclick = () => { const f = r.querySelector('#rcF'); if (!f.reportValidity()) return; const d = UI.formData(f); Store.receiveStock(d.pid, +d.qty, d.sup, d.cost ? +d.cost : null); close(); UI.toast(L('تم الاستلام وإضافة الكمية', 'Stock received'), '', 'success', 'check'); App.refresh(); }; }
      });
      const rb = el.querySelector('#iRecv'); if (rb) rb.onclick = () => recv();
      el.querySelectorAll('[data-recv]').forEach(b => b.onclick = () => recv(b.dataset.recv));
      el.querySelectorAll('[data-adj]').forEach(b => b.onclick = () => {
        const p = Store.get.product(b.dataset.adj);
        UI.modal({
          title: `${icon('clipboard-pen')} ${L('تسوية جرد', 'Stock count adjustment')}`, body: `<div class="stack"><div><b>${esc(N(p.name))}</b> — ${L('الرصيد بالنظام', 'System qty')}: ${nf(p.qty)}</div><div class="field"><label>${L('الكمية الفعلية بعد الجرد', 'Counted quantity')}</label><input class="input" type="number" min="0" id="adQ" value="${p.qty}"></div><div class="field"><label>${L('السبب', 'Reason')}</label><input class="input" id="adR" value="${L('جرد دوري', 'Periodic count')}"></div></div>`,
          footer: `<button class="btn" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn primary" id="adS">${L('حفظ', 'Save')}</button>`,
          onMount(r, close) { r.querySelector('#adS').onclick = () => { Store.adjustStock(p.id, Math.max(0, +r.querySelector('#adQ').value), r.querySelector('#adR').value); close(); App.refresh(); }; }
        });
      });
    }
  };
})();

App.pages.sales = (function () {
  const st = { tab: 'all', kind: '', q: '' };
  return {
    render(el) {
      const { L, N, esc, icon, money, nf } = UI; const db = Store.db;
      const all = Store.invoices().slice().reverse();
      const rows = all.filter(i => (st.tab === 'all' || i.status === st.tab) && (!st.kind || i.kind === st.kind) && (!st.q || i.id.includes(st.q.toUpperCase()) || N(Store.get.patient(i.patientId).name).toLowerCase().includes(st.q.toLowerCase())));
      const today = UI.isoDay(new Date()); const ms = new Date(); ms.setDate(1); ms.setHours(0, 0, 0, 0);
      const collectedToday = all.filter(i => UI.sameDay(i.date, today)).reduce((s, i) => s + i.paid, 0);
      const month = all.filter(i => new Date(i.date) >= ms);
      el.innerHTML = `${App.pageHead(L('المبيعات والفواتير', 'Sales & invoices'), L('فواتير الكشوفات والمستلزمات والباقات ومبيعات المنتجات — مع التحصيل والتأمين', 'Visit, item, package and product invoices — with collections and insurance'),
        Store.can('sales') ? `<button class="btn primary" id="sNew">${icon('shopping-cart')}${L('بيع منتجات', 'Product sale')}</button><a class="btn" href="#/packages">${icon('package')}${L('بيع باقة', 'Sell package')}</a>` : '')}
      <div class="grid g4" style="margin-bottom:16px">
        ${UI.kpi(L('محصل اليوم', 'Collected today'), money(collectedToday), 'banknote', 'success')}
        ${UI.kpi(L('مبيعات الشهر', 'Month sales'), money(month.reduce((s, i) => s + i.total, 0)), 'trending-up', 'primary', `${nf(month.length)} ${L('فاتورة', 'invoices')}`)}
        ${UI.kpi(L('مستحقات المرضى', 'Patient receivables'), money(all.reduce((s, i) => s + Store.invBalance(i), 0)), 'wallet', 'warning', `${nf(all.filter(i => i.status !== 'paid').length)} ${L('فاتورة مفتوحة', 'open')}`)}
        ${UI.kpi(L('مطالبات التأمين (الشهر)', 'Insurance claims (month)'), money(month.reduce((s, i) => s + (i.insShare || 0), 0)), 'shield-plus', 'info')}
      </div>
      <div class="card">
        <div style="padding:0 12px"><div class="tabs">${[['all', L('الكل', 'All')], ['unpaid', L('غير مدفوعة', 'Unpaid')], ['partial', L('مدفوعة جزئياً', 'Partial')], ['paid', L('مدفوعة', 'Paid')]].map(t => `<button data-tab="${t[0]}" class="${st.tab === t[0] ? 'on' : ''}">${t[1]} <span class="cnt">${nf(t[0] === 'all' ? all.length : all.filter(i => i.status === t[0]).length)}</span></button>`).join('')}</div></div>
        <div class="card-body filters" style="border-bottom:1px solid var(--border)"><input class="input sm" id="sQ" placeholder="${L('رقم الفاتورة أو اسم المريض', 'Invoice no. or patient')}" value="${esc(st.q)}"><select class="select sm" id="sK"><option value="">${L('كل الأنواع', 'All types')}</option><option value="visit" ${st.kind === 'visit' ? 'selected' : ''}>${L('كشوفات', 'Visits')}</option><option value="product" ${st.kind === 'product' ? 'selected' : ''}>${L('منتجات', 'Products')}</option><option value="package" ${st.kind === 'package' ? 'selected' : ''}>${L('باقات', 'Packages')}</option></select>
        <button class="btn sm" id="sCsv">${icon('download')}${L('تصدير Excel', 'Export CSV')}</button></div>
        <div class="card-body flush">${invTable(rows.slice(0, 200))}</div>
      </div>`;
      el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { st.tab = b.dataset.tab; App.refresh(); });
      el.querySelector('#sK').onchange = e => { st.kind = e.target.value; App.refresh(); };
      const q = el.querySelector('#sQ'); let t; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { st.q = q.value.trim(); App.refresh(); const n = document.getElementById('sQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); };
      el.querySelector('#sCsv').onclick = () => UI.downloadCSV('invoices', [[L('رقم الفاتورة', 'Invoice'), L('التاريخ', 'Date'), L('المريض', 'Patient'), L('النوع', 'Type'), L('الإجمالي', 'Total'), L('التأمين', 'Insurance'), L('المدفوع', 'Paid'), L('الحالة', 'Status')]].concat(rows.map(i => [i.id, i.date.slice(0, 10), N(Store.get.patient(i.patientId).name), i.kind, i.total, i.insShare || 0, i.paid, i.status])));
      const nb = el.querySelector('#sNew'); if (nb) nb.onclick = () => {
        let picker;
        UI.modal({
          size: 'lg', title: `${icon('shopping-cart')} ${L('بيع منتجات', 'Product sale')}`,
          body: `<div class="stack"><div class="field"><label>${L('المريض', 'Patient')}</label><input class="input" list="spPat" id="spP"><datalist id="spPat">${db.patients.map(p => `<option value="${p.id} — ${esc(N(p.name))}">`).join('')}</datalist></div><div id="spPick"></div><div class="field"><label>${L('طريقة الدفع', 'Method')}</label><select class="select" id="spM">${['cash', 'card', 'instapay', 'wallet'].map(m => `<option value="${m}">${UI.methodLabel(m)}</option>`).join('')}</select></div></div>`,
          footer: `<button class="btn" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn primary" id="spS">${L('إتمام البيع', 'Complete sale')}</button>`,
          onMount(r, close) {
            picker = Comp.itemPicker(r.querySelector('#spPick'), { sellableOnly: true, showPrice: true });
            r.querySelector('#spS').onclick = () => {
              const pid = r.querySelector('#spP').value.split(' — ')[0].trim(); if (!Store.get.patient(pid)) { UI.toast(L('اختر مريضاً', 'Pick a patient'), '', 'warning', 'info'); return; }
              const lines = picker.get(); if (!lines.length) return;
              try { const inv = Store.sellProducts(pid, lines, r.querySelector('#spM').value); close(); App.refresh(); Comp.invoiceModal(inv.id); } catch (e) { Comp.stockError(e); }
            };
          }
        });
      };
    }
  };
})();

App.pages.finance = {
  render(el) {
    const { L, N, esc, icon, money, nf } = UI; const db = Store.db;
    const ms = new Date(); ms.setDate(1); ms.setHours(0, 0, 0, 0);
    const month = db.invoices.filter(i => new Date(i.date) >= ms);
    const revenue = month.reduce((s, i) => s + i.total, 0);
    const commissions = month.filter(i => i.kind === 'visit').reduce((s, i) => s + Math.round(i.lines.filter(l => l.kind === 'service').reduce((a, l) => a + l.qty * l.price, 0) * (i.commissionRate || 0) / 100), 0);
    const cogs = db.movements.filter(m => m.type === 'out' && new Date(m.at) >= ms).reduce((s, m) => s + m.qty * Store.get.product(m.productId).cost, 0);
    const daysPassed = new Date().getDate(); const daysInMonth = new Date(ms.getFullYear(), ms.getMonth() + 1, 0).getDate();
    const opex = db.expenses.reduce((s, x) => s + x.amount, 0) * daysPassed / daysInMonth;
    const net = revenue - commissions - cogs - opex;
    const methods = {}; month.forEach(i => methods[i.method] = (methods[i.method] || 0) + i.total);
    el.innerHTML = `${App.pageHead(L('المالية', 'Finance'), L(`ملخص الشهر الحالي حتى اليوم (${nf(daysPassed)} يوم)`, `Month to date (${daysPassed} days)`))}
    <div class="grid g4" style="margin-bottom:16px">
      ${UI.kpi(L('إجمالي الإيرادات', 'Total revenue'), money(revenue), 'trending-up', 'primary')}
      ${UI.kpi(L('نسب الأطباء', 'Doctor shares'), money(commissions), 'hand-coins', 'accent')}
      ${UI.kpi(L('تكلفة المستلزمات المستهلكة', 'Supplies consumed (cost)'), money(cogs), 'boxes', 'warning')}
      ${UI.kpi(L('صافي الربح التقديري', 'Estimated net profit'), money(net), 'piggy-bank', net >= 0 ? 'success' : 'danger', `${L('بعد المصروفات التشغيلية', 'after operating expenses')} ${money(opex)}`)}
    </div>
    <div class="grid g2" style="margin-bottom:16px">
      <div class="card"><div class="card-head"><h3>${icon('building-2')}${L('الإيراد والربح حسب العيادة', 'Revenue & margin by clinic')}</h3></div><div class="card-body flush">${UI.table([
        { label: L('العيادة', 'Clinic'), render: d => `<span class="dept-dot" style="background:${d.color}"></span> <b>${esc(N(d.name))}</b>` },
        { label: L('الإيراد', 'Revenue'), render: d => money(d.rev) }, { label: L('نسب الأطباء', 'Doctor share'), render: d => money(d.com) }, { label: L('المستلزمات', 'Supplies'), render: d => money(d.cost) },
        { label: L('هامش العيادة', 'Clinic margin'), render: d => `<b style="color:${d.rev - d.com - d.cost >= 0 ? 'var(--success)' : 'var(--danger)'}">${money(d.rev - d.com - d.cost)}</b>` }
      ], db.departments.map(d => { const inv = month.filter(i => i.dept === d.id); return Object.assign({}, d, { rev: inv.reduce((s, i) => s + i.total, 0), com: inv.filter(i => i.kind === 'visit').reduce((s, i) => s + Math.round(i.lines.filter(l => l.kind === 'service').reduce((a, l) => a + l.qty * l.price, 0) * (i.commissionRate || 0) / 100), 0), cost: db.movements.filter(m => m.type === 'out' && m.dept === d.id && new Date(m.at) >= ms).reduce((s, m) => s + m.qty * Store.get.product(m.productId).cost, 0) }); }))}</div></div>
      <div class="card"><div class="card-head"><h3>${icon('credit-card')}${L('طرق الدفع', 'Payment methods')}</h3></div><div class="card-body"><div class="chart-box"><canvas id="fM"></canvas></div></div></div>
    </div>
    <div class="grid g2">
      <div class="card"><div class="card-head"><h3>${icon('receipt')}${L('المصروفات التشغيلية الشهرية', 'Monthly operating expenses')}</h3></div><div class="card-body flush">${UI.table([{ label: L('البند', 'Item'), render: x => esc(N(x.cat)) }, { label: L('المبلغ الشهري', 'Monthly'), render: x => money(x.amount) }], db.expenses)}</div></div>
      <div class="card"><div class="card-head"><h3>${icon('hand-coins')}${L('مستحقات الأطباء هذا الشهر', 'Doctor payouts this month')}</h3></div><div class="card-body flush">${UI.table([
        { label: L('الطبيب', 'Doctor'), render: d => esc(N(d.name)) }, { label: L('النسبة', 'Share'), render: d => `${d.commission}%` },
        { label: L('المستحق', 'Payable'), render: d => `<b>${money(month.filter(i => i.doctorId === d.id).reduce((s, i) => s + Math.round(i.lines.filter(l => l.kind === 'service').reduce((a, l) => a + l.qty * l.price, 0) * (i.commissionRate || 0) / 100), 0))}</b>` }
      ], db.doctors)}</div></div>
    </div>`;
    const keys = Object.keys(methods); const col = { cash: '#169b5b', card: '#5b5bd6', instapay: '#d6409f', wallet: '#e58a1f', insurance: '#0b7fc0' };
    UI.chart(el.querySelector('#fM'), { type: 'doughnut', data: { labels: keys.map(UI.methodLabel), datasets: [{ data: keys.map(k => methods[k]), backgroundColor: keys.map(k => col[k]), borderColor: UI.cssVar('--surface'), borderWidth: 2 }] }, options: { cutout: '62%' } });
  }
};

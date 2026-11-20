/* Data store, permissions, business actions and analytics */
window.Store = (function () {
  const KEY = 'nabd_hms_demo_v1';
  let db = null;
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { } }
  };

  function load() {
    const raw = ls.get(KEY);
    if (raw) { try { db = JSON.parse(raw); } catch (e) { db = null; } }
    if (!db || db.version !== 4 || isStale(db)) { db = Seed.generate(); save(); }
    return db;
  }
  // regenerate if demo data was created on an earlier day so "today" always has activity
  function isStale(d) { try { return new Date(d.generatedAt).toDateString() !== new Date().toDateString(); } catch (e) { return true; } }
  function save() { ls.set(KEY, JSON.stringify(db)); }
  function reset() { ls.del(KEY); db = Seed.generate(); save(); }

  // ---------- lookups
  const by = (arr, id) => arr.find(x => x.id === id);
  const get = {
    doctor: id => by(db.doctors, id), dept: id => by(db.departments, id), patient: id => by(db.patients, id),
    product: id => by(db.products, id), service: id => by(db.services, id), user: id => by(db.users, id),
    branch: id => by(db.branches, id), shift: id => by(db.shifts, id), insurer: id => by(db.insurers, id),
    category: id => by(db.categories, id), invoice: id => by(db.invoices, id), appt: id => by(db.appointments, id),
    encounter: id => by(db.encounters, id), pkg: id => by(db.packages, id), connector: id => by(db.connectors, id)
  };

  // ---------- auth & permissions
  const ROLES = {
    admin: { name: { ar: 'مدير النظام', en: 'Administrator' }, modules: '*', logDepts: '*' },
    doctor: { name: { ar: 'طبيب', en: 'Doctor' }, modules: ['dashboard', 'bookings', 'patients', 'records', 'prescriptions', 'lab', 'performance', 'inventory', 'logs'], logDepts: ['medical'] },
    reception: { name: { ar: 'استقبال', en: 'Reception' }, modules: ['dashboard', 'bookings', 'patients', 'records', 'services', 'packages', 'insurance', 'sales', 'inventory', 'integrations', 'logs'], logDepts: ['bookings', 'integration'] },
    sales: { name: { ar: 'مبيعات وخزينة', en: 'Sales & Cashier' }, modules: ['dashboard', 'sales', 'packages', 'services', 'insurance', 'patients', 'finance', 'reports', 'logs'], logDepts: ['sales'] },
    store: { name: { ar: 'مخازن', en: 'Inventory' }, modules: ['dashboard', 'inventory', 'reports', 'logs'], logDepts: ['inventory'] },
    accountant: { name: { ar: 'حسابات', en: 'Accounts' }, modules: ['dashboard', 'sales', 'finance', 'performance', 'reports', 'insurance', 'logs'], logDepts: ['sales', 'inventory'] }
  };
  let session = null;
  function restoreSession() { const id = ls.get(KEY + '_session'); session = id ? get.user(id) || null : null; return session; }
  function login(username, password) {
    const u = db.users.find(x => x.username.toLowerCase() === String(username).trim().toLowerCase() && x.password === password && x.active);
    if (!u) return null;
    session = u; ls.set(KEY + '_session', u.id);
    log('auth', { ar: 'تسجيل دخول', en: 'Signed in' });
    return u;
  }
  function logout() { if (session) log('auth', { ar: 'تسجيل خروج', en: 'Signed out' }); session = null; ls.del(KEY + '_session'); }
  const me = () => session;
  const role = () => session ? ROLES[session.role] : null;
  function can(module) { const r = role(); return !!r && (r.modules === '*' || r.modules.includes(module)); }
  const isAdmin = () => session && session.role === 'admin';
  const isDoctor = () => session && session.role === 'doctor';
  const myDoctorId = () => isDoctor() ? session.doctorId : null;

  // ---------- scoped data
  function appointments() { const d = myDoctorId(); return d ? db.appointments.filter(a => a.doctorId === d) : db.appointments; }
  function encounters() { const d = myDoctorId(); return d ? db.encounters.filter(e => e.doctorId === d) : db.encounters; }
  function patients() {
    const d = myDoctorId(); if (!d) return db.patients;
    const ids = new Set(db.appointments.filter(a => a.doctorId === d).map(a => a.patientId));
    return db.patients.filter(p => ids.has(p.id));
  }
  function invoices() { const d = myDoctorId(); return d ? db.invoices.filter(i => i.doctorId === d) : db.invoices; }
  function logs() {
    const r = role(); if (!r) return [];
    if (r.logDepts === '*') return db.logs;
    if (isDoctor()) {
      // a doctor sees their own actions + system events about their own bookings only
      const mine = l => l.meta && (l.meta.doctorId === session.doctorId || (l.meta.apptId && (get.appt(l.meta.apptId) || {}).doctorId === session.doctorId));
      return db.logs.filter(l => l.userId === session.id || (l.userId === 'system' && mine(l)));
    }
    return db.logs.filter(l => r.logDepts.includes(l.dept) || l.userId === session.id);
  }

  // ---------- logging & notifications
  // byId: 'system' for automatic events (platform bookings) so they are never attributed to whoever is signed in
  function log(dept, msg, meta, byId) {
    db.logs.push({ id: 'LG-' + (db.seq.log++), dept, userId: byId || (session ? session.id : 'system'), msg, meta: meta || null, at: new Date().toISOString() });
    if (db.logs.length > 1500) db.logs.splice(0, db.logs.length - 1500);
    save();
  }
  function notify(n) {
    db.notifications.unshift(Object.assign({ id: 'N' + Date.now() + Math.floor(Math.random() * 999), at: new Date().toISOString(), read: false }, n));
    db.notifications = db.notifications.slice(0, 60); save();
  }
  function myNotifications() {
    if (!session) return [];
    const NOTIF_ROLES = { booking: ['admin', 'reception', 'doctor'], stock: ['admin', 'store', 'reception'], invoice: ['admin', 'sales', 'reception', 'accountant'] };
    return db.notifications.filter(n => (NOTIF_ROLES[n.kind] || ['admin']).includes(session.role) && (!isDoctor() || n.doctorId === myDoctorId()));
  }

  // ---------- money helpers
  const invDue = inv => inv.total - (inv.insShare || 0);
  const invBalance = inv => Math.max(0, invDue(inv) - (inv.paid || 0));

  // ---------- actions
  function addPatient(data, opts) {
    opts = opts || {};
    const id = 'P-' + (db.seq.pat += 7);
    const p = Object.assign({ id, allergies: [], chronic: [], prefs: [], blood: '', insurer: null, branch: 'b1', createdAt: new Date().toISOString(), notes: '' }, data);
    db.patients.push(p);
    if (opts.system) log('bookings', { ar: `إنشاء ملف مريض جديد ${id} تلقائياً من حجز المنصة`, en: `Patient file ${id} created automatically from a platform booking` }, { doctorId: opts.doctorId }, 'system');
    else log('bookings', { ar: 'إضافة مريض جديد ' + id, en: 'New patient registered ' + id });
    return p;
  }
  function createAppointment(data, opts) {
    opts = opts || {};
    const doc = get.doctor(data.doctorId);
    const svcs = data.services && data.services.length ? data.services : [db.services.find(s => s.dept === doc.dept).id];
    const a = Object.assign({ id: 'A-' + (db.seq.appt++), dept: doc.dept, branch: doc.branch, shift: doc.shift, source: 'walkin', status: 'confirmed', externalRef: null, createdAt: new Date().toISOString(), notes: '' }, data);
    a.services = svcs; a.fee = svcs.reduce((s, id) => s + get.service(id).price, 0);
    db.appointments.push(a); db.appointments.sort((x, y) => x.start.localeCompare(y.start));
    const pat = get.patient(a.patientId);
    if (opts.fromPlatform) {
      const c = get.connector(a.source); if (c) c.lastSync = new Date().toISOString();
      log('integration', { ar: `حجز جديد من ${c ? c.nameAr : a.source} (${a.externalRef}) → ${doc.name.ar}`, en: `New ${c ? c.name : a.source} booking (${a.externalRef}) → ${doc.name.en}` }, { apptId: a.id, doctorId: doc.id }, 'system');
      notify({ kind: 'booking', source: a.source, doctorId: doc.id, apptId: a.id, title: { ar: 'حجز جديد من ' + (c ? c.nameAr : ''), en: 'New booking from ' + (c ? c.name : '') }, body: { ar: `${pat.name.ar} ← ${doc.name.ar}`, en: `${pat.name.en} → ${doc.name.en}` } });
    } else log('bookings', { ar: `حجز جديد ${a.id} للمريض ${pat.name.ar} مع ${doc.name.ar}`, en: `New booking ${a.id} for ${pat.name.en} with ${doc.name.en}` }, { apptId: a.id });
    save(); return a;
  }
  const STATUS_LOG = {
    confirmed: ['تأكيد الحجز', 'Booking confirmed'], arrived: ['تسجيل حضور المريض', 'Patient checked in'], in_progress: ['بدء الكشف', 'Consultation started'],
    cancelled: ['إلغاء الحجز', 'Booking cancelled'], no_show: ['تسجيل عدم حضور', 'Marked as no-show'], pending: ['إعادة الحجز للانتظار', 'Booking set to pending']
  };
  function setStatus(apptId, status) {
    const a = get.appt(apptId); if (!a) return;
    a.status = status; const now = new Date().toISOString();
    if (status === 'arrived') a.arrivedAt = now;
    if (status === 'in_progress') { a.startedAt = now; if (a.arrivedAt) a.waitMin = Math.max(1, Math.round((Date.now() - new Date(a.arrivedAt)) / 60000)); else a.waitMin = 0; }
    const t = STATUS_LOG[status] || [status, status];
    log(status === 'in_progress' ? 'medical' : 'bookings', { ar: `${t[0]} — ${a.id}`, en: `${t[1]} — ${a.id}` }, { apptId });
    save();
  }
  function stockOut(productId, qty, reason, ref, patientId, dept) {
    const p = get.product(productId);
    if (!p) throw new Error('product');
    if (p.qty < qty) { const e = new Error('stock'); e.product = p; throw e; }
    p.qty -= qty;
    db.movements.push({ id: 'M-' + (db.seq.mov++), productId, type: 'out', qty, reason, ref, patientId, dept, by: session.id, at: new Date().toISOString() });
    if (p.qty <= p.min) notify({ kind: 'stock', title: { ar: 'تنبيه مخزون منخفض', en: 'Low stock alert' }, body: { ar: `${p.name.ar}: متبقي ${p.qty}`, en: `${p.name.en}: ${p.qty} left` } });
  }
  function checkStock(items) {
    const need = {}; items.forEach(i => need[i.productId] = (need[i.productId] || 0) + i.qty);
    for (const id in need) { const p = get.product(id); if (p.qty < need[id]) return p; }
    return null;
  }
  function completeVisit(apptId, data) {
    const a = get.appt(apptId); const doc = get.doctor(a.doctorId); const pat = get.patient(a.patientId);
    const short = checkStock(data.items || []); if (short) { const e = new Error('stock'); e.product = short; throw e; }
    const now = new Date().toISOString();
    const enc = { id: 'E-' + (db.seq.enc++), apptId, patientId: a.patientId, doctorId: a.doctorId, dept: a.dept, date: now, complaint: data.complaint, diagnosis: data.diagnosis, notes: data.notes, outcome: data.outcome || 'stable', vitals: data.vitals || {}, items: [], followUp: !!data.followUp };
    (data.items || []).forEach(it => { stockOut(it.productId, it.qty, 'consumption', enc.id, a.patientId, a.dept); enc.items.push({ productId: it.productId, qty: it.qty, by: 'doctor', at: now }); });
    if (data.rx && data.rx.length) {
      const rx = { id: 'RX-' + (db.seq.rx++), encounterId: enc.id, patientId: a.patientId, doctorId: a.doctorId, date: now, items: data.rx };
      db.prescriptions.push(rx); enc.rxId = rx.id;
    }
    db.encounters.push(enc);
    a.status = 'completed'; a.durationMin = a.startedAt ? Math.max(1, Math.round((Date.now() - new Date(a.startedAt)) / 60000)) : 15;
    const lines = a.services.map(id => { const s = get.service(id); return { kind: 'service', refId: id, name: s.name, qty: 1, price: s.price }; });
    enc.items.forEach(it => { const p = get.product(it.productId); if (p.price > 0) lines.push({ kind: 'item', refId: p.id, name: p.name, qty: it.qty, price: p.price }); });
    const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const ins = pat.insurer ? get.insurer(pat.insurer) : null;
    const inv = { id: 'INV-' + (db.seq.inv++), patientId: a.patientId, apptId, encounterId: enc.id, doctorId: a.doctorId, dept: a.dept, branch: a.branch, date: now, lines, total, insurer: ins ? ins.id : null, insShare: ins ? Math.round(total * ins.coverage / 100) : 0, paid: 0, status: 'unpaid', method: ins ? 'insurance' : 'cash', commissionRate: doc.commission, kind: 'visit' };
    db.invoices.push(inv); enc.invoiceId = inv.id; a.invoiceId = inv.id;
    log('medical', { ar: `إنهاء كشف ${a.id} للمريض ${pat.name.ar} (${enc.items.length} أصناف مستخدمة)`, en: `Visit ${a.id} completed for ${pat.name.en} (${enc.items.length} items used)` }, { encId: enc.id });
    log('sales', { ar: `إصدار فاتورة ${inv.id} بقيمة ${total} ج.م`, en: `Invoice ${inv.id} issued, EGP ${total}` }, { invId: inv.id });
    notify({ kind: 'invoice', title: { ar: 'فاتورة جديدة جاهزة للتحصيل', en: 'New invoice ready for payment' }, body: { ar: `${inv.id} — ${pat.name.ar}`, en: `${inv.id} — ${pat.name.en}` } });
    save(); return enc;
  }
  function addItemsToEncounter(encId, items) {
    const enc = get.encounter(encId); const short = checkStock(items); if (short) { const e = new Error('stock'); e.product = short; throw e; }
    const now = new Date().toISOString(); const inv = enc.invoiceId ? get.invoice(enc.invoiceId) : null;
    items.forEach(it => {
      stockOut(it.productId, it.qty, 'consumption', enc.id, enc.patientId, enc.dept);
      enc.items.push({ productId: it.productId, qty: it.qty, by: session.role === 'doctor' ? 'doctor' : 'reception', at: now, addedBy: session.id });
      const p = get.product(it.productId);
      if (inv && p.price > 0) {
        const ex = inv.lines.find(l => l.kind === 'item' && l.refId === p.id); if (ex) ex.qty += it.qty; else inv.lines.push({ kind: 'item', refId: p.id, name: p.name, qty: it.qty, price: p.price });
      }
    });
    if (inv) { inv.total = inv.lines.reduce((s, l) => s + l.qty * l.price, 0); if (inv.insurer) inv.insShare = Math.round(inv.total * get.insurer(inv.insurer).coverage / 100); inv.status = invBalance(inv) <= 0 ? 'paid' : inv.paid > 0 ? 'partial' : 'unpaid'; }
    log('inventory', { ar: `إضافة ${items.length} صنف إضافي لزيارة ${enc.id} وخصمها من المخزون`, en: `Added ${items.length} extra item(s) to visit ${enc.id}, deducted from stock` }, { encId });
    save();
  }
  function payInvoice(invId, amount, method) {
    const inv = get.invoice(invId); inv.paid = Math.min(invDue(inv), (inv.paid || 0) + amount); inv.method = inv.insurer ? inv.method : method;
    inv.status = invBalance(inv) <= 0 ? 'paid' : 'partial';
    log('sales', { ar: `تحصيل ${amount} ج.م على الفاتورة ${inv.id}`, en: `Collected EGP ${amount} on ${inv.id}` }, { invId }); save();
  }
  function sellProducts(patientId, lines, method) {
    const short = checkStock(lines); if (short) { const e = new Error('stock'); e.product = short; throw e; }
    const id = 'INV-' + (db.seq.inv++);
    const invLines = lines.map(l => { const p = get.product(l.productId); stockOut(p.id, l.qty, 'sale', id, patientId, null); return { kind: 'item', refId: p.id, name: p.name, qty: l.qty, price: p.price }; });
    const total = invLines.reduce((s, l) => s + l.qty * l.price, 0);
    const inv = { id, patientId, date: new Date().toISOString(), lines: invLines, total, insurer: null, insShare: 0, paid: total, status: 'paid', method, kind: 'product', branch: 'b1' };
    db.invoices.push(inv); log('sales', { ar: `بيع منتجات فاتورة ${id} بقيمة ${total} ج.م`, en: `Product sale ${id}, EGP ${total}` }); save(); return inv;
  }
  function sellPackage(patientId, packageId, method) {
    const pk = get.pkg(packageId); const id = 'INV-' + (db.seq.inv++);
    db.subscriptions.push({ id: 'SUB-' + (400 + db.subscriptions.length), packageId, patientId, start: new Date().toISOString(), used: 0, total: pk.sessions, status: 'active' });
    db.invoices.push({ id, patientId, date: new Date().toISOString(), lines: [{ kind: 'package', refId: pk.id, name: pk.name, qty: 1, price: pk.price }], total: pk.price, insurer: null, insShare: 0, paid: pk.price, status: 'paid', method, kind: 'package', dept: pk.dept, branch: 'b1' });
    log('sales', { ar: `بيع ${pk.name.ar}`, en: `Sold ${pk.name.en}` }); save();
  }
  function receiveStock(productId, qty, supplier, unitCost) {
    const p = get.product(productId); p.qty += qty; if (unitCost) p.cost = unitCost;
    db.movements.push({ id: 'M-' + (db.seq.mov++), productId, type: 'in', qty, reason: 'purchase', ref: 'PO-' + (1400 + db.seq.mov), supplier, unitCost: p.cost, by: session.id, at: new Date().toISOString() });
    log('inventory', { ar: `استلام ${qty} ${p.unit.ar} من ${p.name.ar}`, en: `Received ${qty} ${p.unit.en} of ${p.name.en}` }); save();
  }
  function adjustStock(productId, newQty, reason) {
    const p = get.product(productId); const diff = newQty - p.qty; p.qty = newQty;
    db.movements.push({ id: 'M-' + (db.seq.mov++), productId, type: diff >= 0 ? 'in' : 'out', qty: Math.abs(diff), reason: 'adjustment', note: reason, by: session.id, at: new Date().toISOString() });
    log('inventory', { ar: `تسوية جرد ${p.name.ar}: ${diff >= 0 ? '+' : ''}${diff}`, en: `Stock count adjustment ${p.name.en}: ${diff >= 0 ? '+' : ''}${diff}` }); save();
  }
  function addProgressNote(patientId, text, kind) {
    db.progressNotes.push({ id: 'PN-' + Date.now(), patientId, doctorId: myDoctorId(), userId: session.id, text, kind: kind || 'note', at: new Date().toISOString() });
    log('medical', { ar: 'إضافة ملاحظة متابعة للمريض ' + patientId, en: 'Progress note added for ' + patientId }); save();
  }

  // ---------- analytics
  function inRange(iso, from, to) { const t = new Date(iso).getTime(); return t >= from.getTime() && t < to.getTime(); }
  function periods() {
    // half-month report periods (1–15, 16–end) — last 6
    const out = []; const now = new Date(); let y = now.getFullYear(), m = now.getMonth(), half = now.getDate() > 15 ? 2 : 1;
    for (let k = 0; k < 6; k++) {
      const from = new Date(y, m, half === 1 ? 1 : 16); const to = half === 1 ? new Date(y, m, 16) : new Date(y, m + 1, 1);
      out.push({ id: `${y}-${m + 1}-${half}`, from, to, half, month: m, year: y, current: k === 0 });
      if (half === 2) half = 1; else { half = 2; m--; if (m < 0) { m = 11; y--; } }
    }
    return out;
  }
  function doctorPerformance(doctorId, from, to) {
    const doc = get.doctor(doctorId);
    const appts = db.appointments.filter(a => a.doctorId === doctorId && inRange(a.start, from, to) && new Date(a.start) <= new Date());
    const done = appts.filter(a => a.status === 'completed');
    const noShow = appts.filter(a => a.status === 'no_show').length, cancelled = appts.filter(a => a.status === 'cancelled').length;
    const encs = db.encounters.filter(e => e.doctorId === doctorId && inRange(e.date, from, to));
    const invs = db.invoices.filter(i => i.doctorId === doctorId && i.kind === 'visit' && inRange(i.date, from, to));
    const revenue = invs.reduce((s, i) => s + i.total, 0);
    const serviceRevenue = invs.reduce((s, i) => s + i.lines.filter(l => l.kind === 'service').reduce((a, l) => a + l.qty * l.price, 0), 0);
    const commission = Math.round(serviceRevenue * doc.commission / 100);
    const ratings = done.filter(a => a.rating); const avgRating = ratings.length ? ratings.reduce((s, a) => s + a.rating, 0) / ratings.length : 0;
    const waits = done.filter(a => a.waitMin != null); const avgWait = waits.length ? waits.reduce((s, a) => s + a.waitMin, 0) / waits.length : 0;
    const durs = done.filter(a => a.durationMin); const avgDur = durs.length ? durs.reduce((s, a) => s + a.durationMin, 0) / durs.length : 0;
    const improved = encs.filter(e => e.outcome === 'improved').length, worse = encs.filter(e => e.outcome === 'worse').length;
    const pts = new Set(done.map(a => a.patientId));
    const returning = [...pts].filter(pid => db.appointments.some(a => a.patientId === pid && a.doctorId === doctorId && a.status === 'completed' && new Date(a.start) < from)).length;
    const itemsCost = encs.reduce((s, e) => s + e.items.reduce((a, it) => a + it.qty * (get.product(it.productId).cost || 0), 0), 0);
    const platform = appts.filter(a => ['vezeeta', 'clinido', 'ekshef', 'website'].includes(a.source)).length;
    const days = Math.max(1, new Set(appts.map(a => a.start.slice(0, 10))).size);
    const sh = get.shift(doc.shift); const capacityPerDay = (parseInt(sh.to) - parseInt(sh.from)) * 2;
    const utilization = Math.min(100, Math.round(done.length / (days * capacityPerDay) * 100));
    const r = {
      doctor: doc, booked: appts.length, completed: done.length, noShow, cancelled, patients: pts.size, newPatients: pts.size - returning, returning,
      noShowRate: appts.length ? noShow / appts.length * 100 : 0, cancelRate: appts.length ? cancelled / appts.length * 100 : 0,
      completionRate: appts.length ? done.length / appts.length * 100 : 0, avgRating, avgWait, avgDur,
      improvedRate: encs.length ? improved / encs.length * 100 : 0, worseRate: encs.length ? worse / encs.length * 100 : 0,
      followUps: encs.filter(e => e.followUp).length, revenue, serviceRevenue, commission, hospitalShare: revenue - commission, itemsCost,
      platformShare: appts.length ? platform / appts.length * 100 : 0, utilization, revenuePerPatient: done.length ? revenue / done.length : 0
    };
    r.score = Math.round(Math.max(0, Math.min(100,
      (r.avgRating / 5) * 30 + (r.completionRate / 100) * 20 + (r.improvedRate / 100) * 20 + Math.max(0, 1 - r.avgWait / 60) * 15 + (r.utilization / 100) * 15)));
    return r;
  }
  function insights(rows) {
    // rule-based weak-point detection
    const out = [];
    const avg = k => rows.reduce((s, r) => s + r[k], 0) / Math.max(1, rows.length);
    const T = (ar, en) => ({ ar, en });
    rows.forEach(r => {
      const n = r.doctor.name;
      if (r.noShowRate > 12) out.push({ tone: 'danger', icon: 'user-x', who: n, title: T('نسبة عدم حضور مرتفعة', 'High no-show rate'), text: T(`${r.noShowRate.toFixed(0)}% من الحجوزات لم تحضر. فعّل رسائل التذكير عبر واتساب قبل الموعد بـ 24 ساعة وساعتين، واطلب عربون للحجوزات من المنصات.`, `${r.noShowRate.toFixed(0)}% of bookings did not show. Enable WhatsApp reminders 24h and 2h before, and consider a deposit for platform bookings.`) });
      if (r.avgWait > 25) out.push({ tone: 'warning', icon: 'timer', who: n, title: T('وقت انتظار طويل', 'Long waiting time'), text: T(`متوسط الانتظار ${r.avgWait.toFixed(0)} دقيقة. راجع توزيع المواعيد على الشيفت وقلل الحجز المزدوج في نفس الفترة.`, `Average wait is ${r.avgWait.toFixed(0)} min. Rebalance slot spacing in the shift and reduce double-booking.`) });
      if (r.avgRating && r.avgRating < 4) out.push({ tone: 'danger', icon: 'star', who: n, title: T('تقييم المرضى منخفض', 'Low patient rating'), text: T(`التقييم ${r.avgRating.toFixed(1)}/5. راجع شكاوى المرضى ومدة الكشف (${r.avgDur.toFixed(0)} دقيقة) مع الطبيب.`, `Rating is ${r.avgRating.toFixed(1)}/5. Review complaints and consultation length (${r.avgDur.toFixed(0)} min) with the doctor.`) });
      if (r.utilization < 25 && r.booked) out.push({ tone: 'info', icon: 'calendar-plus', who: n, title: T('سعة غير مستغلة', 'Unused capacity'), text: T(`نسبة الإشغال ${r.utilization}% فقط. زد الظهور على فيزيتا وكلينيدو أو قدم باقات متابعة لزيادة الحجوزات.`, `Utilization is only ${r.utilization}%. Boost visibility on Vezeeta/CliniDo or offer follow-up packages.`) });
      if (r.improvedRate > 70 && r.avgRating >= 4.5) out.push({ tone: 'success', icon: 'trophy', who: n, title: T('أداء متميز', 'Top performer'), text: T(`${r.improvedRate.toFixed(0)}% من المرضى تحسنوا وتقييم ${r.avgRating.toFixed(1)}. يُنصح بزيادة مواعيده وإبرازه في الحملات التسويقية.`, `${r.improvedRate.toFixed(0)}% of patients improved, rating ${r.avgRating.toFixed(1)}. Consider adding slots and featuring them in campaigns.`) });
    });
    const lowStock = db.products.filter(p => p.qty <= p.min);
    if (lowStock.length) out.push({ tone: 'warning', icon: 'package-x', who: null, title: T('نقص في المخزون يهدد الخدمة', 'Stock shortages risk service'), text: T(`${lowStock.length} أصناف عند أو تحت حد الطلب. أنشئ أمر شراء قبل أن يتوقف تقديم الخدمة.`, `${lowStock.length} items are at or below reorder level. Raise a purchase order before services are affected.`) });
    const unpaid = db.invoices.filter(i => i.status !== 'paid');
    if (unpaid.length) out.push({ tone: 'info', icon: 'wallet', who: null, title: T('مستحقات غير محصلة', 'Uncollected balances'), text: T(`${unpaid.length} فاتورة غير مسددة بالكامل بإجمالي ${Math.round(unpaid.reduce((s, i) => s + invBalance(i), 0)).toLocaleString()} ج.م.`, `${unpaid.length} invoices not fully paid, EGP ${Math.round(unpaid.reduce((s, i) => s + invBalance(i), 0)).toLocaleString()} outstanding.`) });
    const order = { danger: 0, warning: 1, info: 2, success: 3 };
    return out.sort((a, b) => order[a.tone] - order[b.tone]);
  }

  return {
    load, save, reset, get db() { return db; }, get, ROLES, restoreSession, login, logout, me, role, can, isAdmin, isDoctor, myDoctorId,
    appointments, encounters, patients, invoices, logs, log, notify, myNotifications, invDue, invBalance,
    addPatient, createAppointment, setStatus, completeVisit, addItemsToEncounter, payInvoice, sellProducts, sellPackage, receiveStock, adjustStock, addProgressNote,
    periods, doctorPerformance, insights, inRange
  };
})();

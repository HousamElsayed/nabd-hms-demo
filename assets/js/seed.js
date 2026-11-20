/* Demo seed data generator — deterministic, dates relative to "today" */
window.Seed = (function () {
  function generate() {
    let s = 20251118;
    const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const at = (off, h, m) => { const x = new Date(today); x.setDate(x.getDate() + off); x.setHours(h, m || 0, 0, 0); return x.toISOString(); };
    const T = (ar, en) => ({ ar, en });

    const branches = [
      { id: 'b1', name: T('الفرع الرئيسي - مدينة نصر', 'Main Branch - Nasr City') },
      { id: 'b2', name: T('فرع المعادي', 'Maadi Branch') }
    ];
    const shifts = [
      { id: 's1', name: T('الشيفت الصباحي', 'Morning shift'), from: '09:00', to: '15:00' },
      { id: 's2', name: T('الشيفت المسائي', 'Evening shift'), from: '15:00', to: '22:00' }
    ];
    const departments = [
      { id: 'oph', name: T('عيادة العيون', 'Ophthalmology'), icon: 'eye', color: '#0e8f82', floor: T('الدور الأول', '1st floor') },
      { id: 'ped', name: T('عيادة الأطفال', 'Pediatrics'), icon: 'baby', color: '#e58a1f', floor: T('الدور الأرضي', 'Ground floor') },
      { id: 'ort', name: T('عيادة العظام', 'Orthopedics'), icon: 'bone', color: '#5b5bd6', floor: T('الدور الثاني', '2nd floor') },
      { id: 'der', name: T('عيادة الجلدية', 'Dermatology'), icon: 'sparkles', color: '#d6409f', floor: T('الدور الأول', '1st floor') },
      { id: 'car', name: T('عيادة القلب', 'Cardiology'), icon: 'heart-pulse', color: '#d93f45', floor: T('الدور الثالث', '3rd floor') },
      { id: 'den', name: T('عيادة الأسنان', 'Dentistry'), icon: 'smile', color: '#0b7fc0', floor: T('الدور الأرضي', 'Ground floor') },
      { id: 'phy', name: T('العلاج الطبيعي', 'Physiotherapy'), icon: 'activity', color: '#169b5b', floor: T('الدور الثاني', '2nd floor') }
    ];
    const doctors = [
      { id: 'd1', dept: 'oph', branch: 'b1', shift: 's1', name: T('د. أحمد مصطفى', 'Dr. Ahmed Moustafa'), title: T('استشاري طب وجراحة العيون', 'Consultant Ophthalmologist'), fee: 400, commission: 50, rating: 4.8, platformIds: { vezeeta: 'VZ-104233', clinido: 'CD-5521', ekshef: 'EK-8812' } },
      { id: 'd2', dept: 'ped', branch: 'b1', shift: 's1', name: T('د. منى الشريف', 'Dr. Mona El-Sherif'), title: T('استشاري طب الأطفال وحديثي الولادة', 'Consultant Pediatrician'), fee: 350, commission: 45, rating: 4.9, platformIds: { vezeeta: 'VZ-104871', clinido: 'CD-5530', ekshef: 'EK-8820' } },
      { id: 'd3', dept: 'ort', branch: 'b1', shift: 's2', name: T('د. كريم عبد الله', 'Dr. Karim Abdallah'), title: T('أخصائي جراحة العظام والمفاصل', 'Orthopedic Surgeon'), fee: 450, commission: 50, rating: 4.4, platformIds: { vezeeta: 'VZ-105002', clinido: 'CD-5544', ekshef: null } },
      { id: 'd4', dept: 'der', branch: 'b1', shift: 's2', name: T('د. سارة حسن', 'Dr. Sara Hassan'), title: T('أخصائي الجلدية والتجميل والليزر', 'Dermatologist & Laser Specialist'), fee: 400, commission: 40, rating: 4.7, platformIds: { vezeeta: 'VZ-105310', clinido: null, ekshef: 'EK-8841' } },
      { id: 'd5', dept: 'car', branch: 'b1', shift: 's1', name: T('د. يوسف إبراهيم', 'Dr. Youssef Ibrahim'), title: T('استشاري أمراض القلب والأوعية الدموية', 'Consultant Cardiologist'), fee: 500, commission: 55, rating: 4.6, platformIds: { vezeeta: 'VZ-105377', clinido: 'CD-5560', ekshef: 'EK-8850' } },
      { id: 'd6', dept: 'den', branch: 'b2', shift: 's2', name: T('د. نور الدين سامي', 'Dr. Nour El-Din Samy'), title: T('أخصائي طب وتجميل الأسنان', 'Cosmetic Dentist'), fee: 300, commission: 40, rating: 4.2, platformIds: { vezeeta: 'VZ-105420', clinido: 'CD-5571', ekshef: null } },
      { id: 'd7', dept: 'phy', branch: 'b2', shift: 's1', name: T('د. هبة فاروق', 'Dr. Heba Farouk'), title: T('أخصائي العلاج الطبيعي والتأهيل', 'Physiotherapy Specialist'), fee: 250, commission: 35, rating: 4.8, platformIds: { vezeeta: 'VZ-105498', clinido: 'CD-5580', ekshef: 'EK-8866' } },
      { id: 'd8', dept: 'oph', branch: 'b2', shift: 's2', name: T('د. عمر خالد', 'Dr. Omar Khaled'), title: T('أخصائي طب وجراحة العيون', 'Ophthalmologist'), fee: 380, commission: 45, rating: 3.9, platformIds: { vezeeta: 'VZ-105533', clinido: null, ekshef: 'EK-8871' } }
    ];
    // performance profile per doctor (drives realistic differences in the reports)
    const prof = {
      d1: { load: [3, 5], noShow: .06, cancel: .05, wait: [8, 18], dur: [12, 20], rate: [4, 5], improve: .7 },
      d2: { load: [3, 6], noShow: .05, cancel: .04, wait: [6, 15], dur: [10, 16], rate: [4, 5], improve: .78 },
      d3: { load: [2, 4], noShow: .12, cancel: .09, wait: [20, 45], dur: [8, 14], rate: [3, 5], improve: .55 },
      d4: { load: [2, 5], noShow: .08, cancel: .06, wait: [10, 22], dur: [12, 22], rate: [4, 5], improve: .65 },
      d5: { load: [2, 4], noShow: .07, cancel: .05, wait: [12, 25], dur: [15, 25], rate: [4, 5], improve: .6 },
      d6: { load: [1, 3], noShow: .15, cancel: .12, wait: [15, 35], dur: [20, 40], rate: [3, 5], improve: .6 },
      d7: { load: [3, 5], noShow: .04, cancel: .03, wait: [5, 12], dur: [30, 45], rate: [4, 5], improve: .82 },
      d8: { load: [1, 3], noShow: .18, cancel: .1, wait: [25, 55], dur: [7, 12], rate: [2, 4], improve: .45 }
    };

    const users = [
      { id: 'u0', username: 'admin', password: '123456', role: 'admin', name: T('م. خالد منصور', 'Eng. Khaled Mansour'), title: T('مالك المستشفى / مدير النظام', 'Hospital Owner / Admin'), active: true },
      { id: 'u9', username: 'reception', password: '123456', role: 'reception', name: T('مي عادل', 'Mai Adel'), title: T('موظفة الاستقبال', 'Receptionist'), active: true, branch: 'b1' },
      { id: 'u10', username: 'sales', password: '123456', role: 'sales', name: T('تامر سعيد', 'Tamer Saeed'), title: T('مسؤول المبيعات والخزينة', 'Sales & Cashier'), active: true },
      { id: 'u11', username: 'store', password: '123456', role: 'store', name: T('هاني جمال', 'Hany Gamal'), title: T('أمين المخزن', 'Storekeeper'), active: true },
      { id: 'u12', username: 'accounts', password: '123456', role: 'accountant', name: T('ريهام فتحي', 'Reham Fathy'), title: T('المحاسب', 'Accountant'), active: true }
    ];
    const docUser = ['ahmed', 'mona', 'karim', 'sara', 'youssef', 'nour', 'heba', 'omar'];
    doctors.forEach((d, i) => users.push({ id: 'u' + (i + 1), username: 'dr.' + docUser[i], password: '123456', role: 'doctor', doctorId: d.id, name: d.name, title: d.title, active: true }));

    const services = [
      ['oph', 'كشف عيون', 'Eye examination', 400, 15], ['oph', 'قياس نظر بالكمبيوتر', 'Computerized refraction', 150, 10], ['oph', 'قياس ضغط العين', 'Eye pressure test', 200, 10], ['oph', 'فحص قاع العين', 'Fundus examination', 350, 15],
      ['ped', 'كشف أطفال', 'Pediatric consultation', 350, 15], ['ped', 'تطعيم', 'Vaccination', 250, 10], ['ped', 'متابعة نمو', 'Growth follow-up', 150, 10],
      ['ort', 'كشف عظام', 'Orthopedic consultation', 450, 15], ['ort', 'حقن مفصل', 'Joint injection', 900, 20], ['ort', 'تجبيس', 'Casting', 600, 30],
      ['der', 'كشف جلدية', 'Dermatology consultation', 400, 15], ['der', 'جلسة ليزر', 'Laser session', 1200, 30], ['der', 'تقشير كيميائي', 'Chemical peel', 900, 30],
      ['car', 'كشف قلب', 'Cardiology consultation', 500, 20], ['car', 'رسم قلب ECG', 'ECG', 300, 15], ['car', 'إيكو على القلب', 'Echocardiography', 900, 30],
      ['den', 'كشف أسنان', 'Dental check-up', 300, 15], ['den', 'حشو عصب', 'Root canal filling', 1500, 60], ['den', 'تنظيف جير', 'Scaling & polishing', 500, 30], ['den', 'خلع', 'Extraction', 400, 20],
      ['phy', 'جلسة علاج طبيعي Basic', 'Physiotherapy session (Basic)', 250, 45], ['phy', 'جلسة علاج طبيعي متقدمة', 'Advanced physiotherapy session', 400, 60]
    ].map((r, i) => ({ id: 'sv' + (i + 1), dept: r[0], name: T(r[1], r[2]), price: r[3], duration: r[4], active: true }));

    const packages = [
      { id: 'pk1', dept: 'phy', name: T('باقة علاج طبيعي 10 جلسات', 'Physiotherapy 10 sessions'), sessions: 10, price: 2000, validDays: 60 },
      { id: 'pk2', dept: 'car', name: T('باقة متابعة الضغط والقلب 3 شهور', 'Cardio follow-up 3 months'), sessions: 4, price: 1500, validDays: 90 },
      { id: 'pk3', dept: 'den', name: T('باقة تنظيف وتبييض الأسنان', 'Cleaning & whitening bundle'), sessions: 2, price: 2500, validDays: 60 },
      { id: 'pk4', dept: 'ped', name: T('باقة متابعة الطفل - سنة', 'Child follow-up - 1 year'), sessions: 6, price: 1800, validDays: 365 },
      { id: 'pk5', dept: 'der', name: T('باقة ليزر 6 جلسات', 'Laser bundle 6 sessions'), sessions: 6, price: 6000, validDays: 120 }
    ];
    const insurers = [
      { id: 'in1', name: T('أكسا مصر', 'AXA Egypt'), coverage: 80, contract: 'AXA-EG-2025-114' },
      { id: 'in2', name: T('أليانز', 'Allianz'), coverage: 70, contract: 'ALZ-3321' },
      { id: 'in3', name: T('ميتلايف', 'MetLife'), coverage: 75, contract: 'MLF-7781' },
      { id: 'in4', name: T('جلوب ميد', 'GlobeMed'), coverage: 80, contract: 'GM-EG-9012' },
      { id: 'in5', name: T('بوبا مصر', 'Bupa Egypt'), coverage: 90, contract: 'BUPA-4410' }
    ];
    const categories = [
      { id: 'c1', name: T('أدوية', 'Medications'), icon: 'pill', color: '#5b5bd6' },
      { id: 'c2', name: T('مستلزمات طبية مستهلكة', 'Medical consumables'), icon: 'syringe', color: '#0e8f82' },
      { id: 'c3', name: T('مستلزمات العيون', 'Ophthalmic supplies'), icon: 'eye', color: '#0b7fc0' },
      { id: 'c4', name: T('مستلزمات الأسنان', 'Dental supplies'), icon: 'smile', color: '#e58a1f' },
      { id: 'c5', name: T('مستلزمات المعمل', 'Lab supplies'), icon: 'flask-conical', color: '#d6409f' },
      { id: 'c6', name: T('مستلزمات العظام والعلاج الطبيعي', 'Ortho & physio supplies'), icon: 'bone', color: '#169b5b' },
      { id: 'c7', name: T('أدوات وقاية وتعقيم', 'PPE & sterilization'), icon: 'shield-check', color: '#d93f45' }
    ];
    const P = (cat, sku, ar, en, uAr, uEn, cost, price, qty, min, expDays, depts) => ({ cat, sku, name: T(ar, en), unit: T(uAr, uEn), cost, price, qty, min, expiry: expDays == null ? null : at(expDays, 0).slice(0, 10), depts });
    const products = [
      P('c1', 'MED-001', 'قطرة موسعة للحدقة (تروبيكاميد)', 'Tropicamide eye drops', 'عبوة', 'bottle', 38, 70, 46, 15, 210, ['oph']),
      P('c1', 'MED-002', 'قطرة مخدر موضعي (بينوكسينات)', 'Benoxinate anaesthetic drops', 'عبوة', 'bottle', 42, 80, 12, 15, 160, ['oph']),
      P('c1', 'MED-003', 'حقنة ديبوميدرول 40 مجم', 'Depo-Medrol 40mg injection', 'أمبول', 'ampoule', 95, 180, 30, 10, 300, ['ort']),
      P('c1', 'MED-004', 'حقنة هيالورونيك أسيد للمفاصل', 'Hyaluronic acid joint injection', 'سرنجة', 'syringe', 650, 1100, 9, 5, 420, ['ort']),
      P('c1', 'MED-005', 'شراب باراسيتامول للأطفال', 'Paracetamol pediatric syrup', 'زجاجة', 'bottle', 18, 35, 120, 30, 25, ['ped']),
      P('c1', 'MED-006', 'لقاح الإنفلونزا الموسمي', 'Seasonal flu vaccine', 'جرعة', 'dose', 210, 350, 22, 10, 18, ['ped']),
      P('c1', 'MED-007', 'كريم كورتيزون موضعي', 'Topical hydrocortisone cream', 'أنبوبة', 'tube', 22, 45, 64, 20, 365, ['der']),
      P('c1', 'MED-008', 'أقراص أسبرين 81 مجم', 'Aspirin 81mg tablets', 'شريط', 'strip', 6, 14, 0, 30, 500, ['car']),
      P('c2', 'CON-001', 'سرنجة 5 مل', 'Syringe 5 ml', 'قطعة', 'piece', 2, 5, 840, 200, 900, null),
      P('c2', 'CON-002', 'شاش معقم 10×10', 'Sterile gauze 10x10', 'باكو', 'pack', 8, 15, 310, 100, 700, null),
      P('c2', 'CON-003', 'قطن طبي 100 جم', 'Medical cotton 100g', 'لفة', 'roll', 15, 25, 95, 40, 900, null),
      P('c2', 'CON-004', 'كانيولا مقاس 22', 'IV cannula G22', 'قطعة', 'piece', 9, 20, 140, 50, 600, null),
      P('c2', 'CON-005', 'لاصق طبي', 'Medical tape', 'لفة', 'roll', 12, 22, 38, 40, 800, null),
      P('c2', 'CON-006', 'أقطاب رسم القلب', 'ECG electrodes', 'باكو 50', 'pack of 50', 85, 0, 14, 6, 500, ['car']),
      P('c3', 'OPH-001', 'شرائط فلوريسين', 'Fluorescein strips', 'باكو 100', 'pack of 100', 160, 0, 7, 3, 400, ['oph']),
      P('c3', 'OPH-002', 'شرائط شيرمر لاختبار الدموع', 'Schirmer test strips', 'باكو 50', 'pack of 50', 140, 0, 2, 3, 380, ['oph']),
      P('c3', 'OPH-003', 'عدسات لاصقة تجريبية', 'Trial contact lenses', 'زوج', 'pair', 60, 120, 54, 20, 600, ['oph']),
      P('c4', 'DEN-001', 'بنج أسنان (أرتيكايين)', 'Articaine dental anaesthetic', 'كارتريدج', 'carpule', 14, 40, 210, 80, 330, ['den']),
      P('c4', 'DEN-002', 'حشو كومبوزيت ضوئي', 'Light-cure composite', 'سرنجة', 'syringe', 320, 0, 11, 6, 450, ['den']),
      P('c4', 'DEN-003', 'إبر أسنان', 'Dental needles', 'علبة 100', 'box of 100', 180, 0, 5, 3, 700, ['den']),
      P('c4', 'DEN-004', 'معجون تلميع', 'Prophy paste', 'عبوة', 'jar', 95, 0, 3, 4, 260, ['den']),
      P('c5', 'LAB-001', 'أنابيب سحب دم EDTA', 'EDTA blood tubes', 'قطعة', 'piece', 3, 0, 620, 200, 280, null),
      P('c5', 'LAB-002', 'شرائط قياس السكر', 'Glucose test strips', 'علبة 50', 'box of 50', 210, 0, 18, 8, 12, ['car', 'ped']),
      P('c6', 'ORT-001', 'جبس 10 سم', 'Plaster bandage 10cm', 'لفة', 'roll', 28, 60, 75, 30, 900, ['ort']),
      P('c6', 'ORT-002', 'رباط ضاغط', 'Elastic bandage', 'لفة', 'roll', 20, 45, 66, 25, 900, ['ort', 'phy']),
      P('c6', 'ORT-003', 'دعامة ركبة', 'Knee brace', 'قطعة', 'piece', 220, 420, 14, 5, null, ['ort', 'phy']),
      P('c6', 'PHY-001', 'جل الموجات فوق الصوتية', 'Ultrasound gel', 'زجاجة', 'bottle', 35, 0, 26, 10, 500, ['phy']),
      P('c6', 'PHY-002', 'أقطاب جهاز التنبيه الكهربائي', 'TENS electrodes', 'باكو 4', 'pack of 4', 45, 90, 40, 15, 600, ['phy']),
      P('c7', 'PPE-001', 'جوانتي فحص لاتكس', 'Latex exam gloves', 'علبة 100', 'box of 100', 120, 0, 48, 20, 700, null),
      P('c7', 'PPE-002', 'كمامات طبية', 'Surgical masks', 'علبة 50', 'box of 50', 45, 0, 36, 15, 800, null),
      P('c7', 'PPE-003', 'مطهر أسطح وأدوات', 'Surface & instrument disinfectant', 'لتر', 'litre', 95, 0, 19, 8, 365, null),
      P('c7', 'PPE-004', 'أكياس تعقيم', 'Sterilization pouches', 'علبة 200', 'box of 200', 210, 0, 9, 4, 900, ['den'])
    ].map((p, i) => Object.assign({ id: 'pr' + (i + 1) }, p));

    // which products each department typically consumes per visit
    const deptItems = {
      oph: [['MED-001', 1, .7], ['MED-002', 1, .4], ['OPH-001', 0, .0], ['OPH-003', 1, .15], ['PPE-001', 0, 0]],
      ped: [['CON-001', 1, .3], ['MED-005', 1, .35], ['MED-006', 1, .15], ['CON-003', 1, .3]],
      ort: [['MED-003', 1, .3], ['MED-004', 1, .12], ['ORT-001', 2, .15], ['ORT-002', 1, .35], ['CON-001', 1, .4], ['ORT-003', 1, .08]],
      der: [['MED-007', 1, .35], ['CON-002', 1, .4], ['CON-003', 1, .3]],
      car: [['CON-006', 0, 0], ['CON-005', 1, .3], ['CON-002', 1, .2]],
      den: [['DEN-001', 2, .75], ['CON-002', 2, .7], ['CON-003', 1, .5]],
      phy: [['ORT-002', 1, .15], ['PHY-002', 1, .3]]
    };
    const bySku = {}; products.forEach(p => bySku[p.sku] = p);

    const clinical = {
      oph: { c: [['ضعف في الإبصار', 'Blurred vision'], ['احمرار وحكة بالعين', 'Red itchy eyes'], ['صداع وإجهاد بالعين', 'Headache & eye strain'], ['متابعة ضغط العين', 'Glaucoma follow-up']], d: [['قصر نظر', 'Myopia'], ['التهاب الملتحمة التحسسي', 'Allergic conjunctivitis'], ['جفاف العين', 'Dry eye syndrome'], ['جلوكوما مفتوحة الزاوية', 'Open-angle glaucoma']] },
      ped: { c: [['ارتفاع في درجة الحرارة', 'Fever'], ['كحة ورشح', 'Cough & runny nose'], ['متابعة نمو', 'Growth check'], ['إسهال', 'Diarrhoea']], d: [['التهاب الحلق الفيروسي', 'Viral pharyngitis'], ['نزلة برد', 'Common cold'], ['نمو طبيعي', 'Normal growth'], ['نزلة معوية', 'Gastroenteritis']] },
      ort: { c: [['ألم بالركبة', 'Knee pain'], ['ألم أسفل الظهر', 'Low back pain'], ['التواء بالكاحل', 'Ankle sprain'], ['ألم بالكتف', 'Shoulder pain']], d: [['خشونة الركبة', 'Knee osteoarthritis'], ['انزلاق غضروفي قطني', 'Lumbar disc herniation'], ['التواء أربطة الكاحل', 'Ankle ligament sprain'], ['التهاب أوتار الكتف', 'Rotator cuff tendinitis']] },
      der: { c: [['حبوب بالوجه', 'Facial acne'], ['تساقط الشعر', 'Hair loss'], ['حكة وطفح جلدي', 'Itchy rash'], ['تصبغات', 'Pigmentation']], d: [['حب الشباب', 'Acne vulgaris'], ['الثعلبة الوراثية', 'Androgenic alopecia'], ['إكزيما', 'Eczema'], ['كلف', 'Melasma']] },
      car: { c: [['ضيق تنفس مع المجهود', 'Exertional dyspnea'], ['خفقان', 'Palpitations'], ['متابعة الضغط', 'Hypertension follow-up'], ['ألم بالصدر', 'Chest pain']], d: [['ارتفاع ضغط الدم', 'Hypertension'], ['عدم انتظام ضربات القلب', 'Arrhythmia'], ['ارتفاع الكوليسترول', 'Dyslipidemia'], ['ذبحة صدرية مستقرة', 'Stable angina']] },
      den: { c: [['ألم بالضرس', 'Toothache'], ['نزيف باللثة', 'Bleeding gums'], ['تنظيف دوري', 'Routine cleaning'], ['تسوس', 'Caries']], d: [['التهاب العصب', 'Pulpitis'], ['التهاب اللثة', 'Gingivitis'], ['جير متراكم', 'Calculus'], ['تسوس سطحي', 'Superficial caries']] },
      phy: { c: [['جلسة تأهيل بعد إصابة', 'Post-injury rehab'], ['ألم الرقبة', 'Neck pain'], ['ألم أسفل الظهر', 'Low back pain'], ['تيبس الكتف', 'Frozen shoulder']], d: [['برنامج تأهيل', 'Rehabilitation program'], ['شد عضلي بالرقبة', 'Cervical strain'], ['ألم ميكانيكي بالظهر', 'Mechanical back pain'], ['التهاب كبسولة الكتف', 'Adhesive capsulitis']] }
    };
    const rxByDept = {
      oph: [['قطرة توبرادكس', 'Tobradex drops', 'نقطة 4 مرات يومياً لمدة أسبوع', '1 drop 4x daily for 1 week'], ['قطرة هايفريش', 'Hyfresh drops', 'نقطة 3 مرات يومياً', '1 drop 3x daily']],
      ped: [['شراب بروفين', 'Brufen syrup', '5 مل كل 8 ساعات عند اللزوم', '5 ml every 8h as needed'], ['أوجمنتين 457', 'Augmentin 457', '5 مل مرتين يومياً لمدة 7 أيام', '5 ml twice daily for 7 days']],
      ort: [['أقراص أركوكسيا 90', 'Arcoxia 90 tablets', 'قرص يومياً بعد الأكل لمدة 10 أيام', '1 tablet daily after meals for 10 days'], ['جل فولتارين', 'Voltaren gel', 'دهان مرتين يومياً', 'Apply twice daily']],
      der: [['كريم ديفرين', 'Differin cream', 'دهان مساءً', 'Apply at night'], ['أقراص بيوتين', 'Biotin tablets', 'قرص يومياً لمدة 3 شهور', '1 tablet daily for 3 months']],
      car: [['أقراص كونكور 5', 'Concor 5 tablets', 'قرص صباحاً', '1 tablet every morning'], ['أقراص ليبيتور 20', 'Lipitor 20 tablets', 'قرص مساءً', '1 tablet at night']],
      den: [['أقراص أموكسيسيلين 500', 'Amoxicillin 500', 'كبسولة كل 8 ساعات لمدة 5 أيام', '1 capsule every 8h for 5 days'], ['مضمضة هيكسيتول', 'Hexitol mouthwash', 'مضمضة مرتين يومياً', 'Rinse twice daily']],
      phy: [['تمارين منزلية', 'Home exercise program', 'مرتين يومياً 15 دقيقة', 'Twice daily, 15 min']]
    };

    // ---- patients
    const fM = [['محمد', 'Mohamed'], ['أحمد', 'Ahmed'], ['محمود', 'Mahmoud'], ['مصطفى', 'Moustafa'], ['عمر', 'Omar'], ['يوسف', 'Youssef'], ['إبراهيم', 'Ibrahim'], ['حسن', 'Hassan'], ['طارق', 'Tarek'], ['شريف', 'Sherif'], ['ياسين', 'Yassin'], ['آدم', 'Adam'], ['سهيل', 'Sohail'], ['كريم', 'Karim'], ['وليد', 'Walid']];
    const fF = [['فاطمة', 'Fatma'], ['مريم', 'Mariam'], ['نورهان', 'Nourhan'], ['سلمى', 'Salma'], ['ياسمين', 'Yasmin'], ['هالة', 'Hala'], ['دينا', 'Dina'], ['رنا', 'Rana'], ['منة', 'Menna'], ['جنى', 'Jana'], ['آية', 'Aya'], ['شيماء', 'Shaimaa'], ['ليلى', 'Laila'], ['نادية', 'Nadia']];
    const lN = [['السيد', 'El-Sayed'], ['عبد الرحمن', 'Abdelrahman'], ['حسين', 'Hussein'], ['فؤاد', 'Fouad'], ['الشافعي', 'El-Shafei'], ['رمضان', 'Ramadan'], ['سليمان', 'Soliman'], ['عثمان', 'Osman'], ['النجار', 'El-Naggar'], ['زكي', 'Zaki'], ['شاكر', 'Shaker'], ['منصور', 'Mansour'], ['الجمال', 'El-Gammal'], ['بدوي', 'Badawy']];
    const allergiesPool = [['بنسلين', 'Penicillin'], ['سلفا', 'Sulfa drugs'], ['لاتكس', 'Latex'], ['أسبرين', 'Aspirin']];
    const chronicPool = { car: [['ارتفاع ضغط الدم', 'Hypertension'], ['سكري نوع 2', 'Type 2 diabetes']], oph: [['جلوكوما', 'Glaucoma']], ort: [['خشونة المفاصل', 'Osteoarthritis']], der: [['إكزيما مزمنة', 'Chronic eczema']] };
    const patients = [];
    const deptIds = departments.map(d => d.id);
    for (let i = 0; i < 300; i++) {
      const female = rnd() < .5;
      const f = pick(female ? fF : fM), mid = pick(fM), l = pick(lN);
      const prefs = [pick(deptIds)]; if (rnd() < .35) prefs.push(pick(deptIds));
      const age = prefs[0] === 'ped' ? ri(1, 13) : prefs[0] === 'car' ? ri(42, 74) : ri(16, 66);
      const dob = new Date(today); dob.setFullYear(dob.getFullYear() - age); dob.setMonth(ri(0, 11)); dob.setDate(ri(1, 28));
      const chronic = []; prefs.forEach(p => { if (chronicPool[p] && rnd() < .6) chronic.push(T(...pick(chronicPool[p]))); });
      patients.push({
        id: 'P-' + (10230 + i * 7), name: T(f[0] + ' ' + mid[0] + ' ' + l[0], f[1] + ' ' + mid[1] + ' ' + l[1]), gender: female ? 'F' : 'M', dob: dob.toISOString().slice(0, 10),
        phone: '+2010' + String(ri(10000000, 99999999)), blood: pick(['A+', 'A-', 'B+', 'O+', 'O+', 'O-', 'AB+']), insurer: rnd() < .4 ? pick(insurers).id : null,
        allergies: rnd() < .2 ? [T(...pick(allergiesPool))] : [], chronic, prefs, branch: pick(['b1', 'b1', 'b2']), createdAt: at(-ri(40, 400), 10), notes: ''
      });
    }

    // ---- appointments, encounters, invoices, stock moves
    const appointments = [], encounters = [], invoices = [], movements = [], prescriptions = [], labOrders = [], subscriptions = [];
    const sources = ['vezeeta', 'vezeeta', 'vezeeta', 'vezeeta', 'clinido', 'clinido', 'ekshef', 'walkin', 'walkin', 'phone', 'website'];
    let aSeq = 50120, eSeq = 1, iSeq = 30500, mSeq = 1, rxSeq = 7700, labSeq = 900;
    // "demo clock": keep today's clinics mid-day even when the demo is opened early morning / late night,
    // so there is always a live queue (waiting, in consultation, upcoming) to show.
    const realH = new Date().getHours() + new Date().getMinutes() / 60;
    const nowH = realH >= 10 && realH <= 20 ? realH : 13.5;
    const busy = {}; // one patient "in consultation" per doctor
    const patVitals = {}; // trend state per patient

    function vitalsFor(p, dept, improving) {
      const st = patVitals[p.id] || (patVitals[p.id] = { sys: ri(128, 165), dia: ri(82, 100), glu: ri(120, 210), w: p.gender === 'F' ? ri(58, 92) : ri(68, 108), va: ri(3, 7) });
      if (improving) { st.sys = Math.max(118, st.sys - ri(0, 5)); st.dia = Math.max(76, st.dia - ri(0, 3)); st.glu = Math.max(95, st.glu - ri(0, 12)); st.va = Math.min(10, st.va + (rnd() < .4 ? 1 : 0)); }
      else { st.sys += ri(-2, 3); st.dia += ri(-1, 2); st.glu += ri(-5, 8); }
      const v = { bpSys: st.sys, bpDia: st.dia, pulse: ri(68, 96), temp: dept === 'ped' ? +(36.6 + rnd() * 2).toFixed(1) : +(36.5 + rnd() * .6).toFixed(1), weight: dept === 'ped' ? ri(9, 40) : st.w };
      if (dept === 'car' || p.chronic.some(c => c.en.includes('diabetes'))) v.glucose = st.glu;
      if (dept === 'oph') v.visualAcuity = st.va + '/10';
      if (dept === 'phy' || dept === 'ort') v.painScore = Math.max(1, 9 - Math.round((patVitals[p.id].sessions = (patVitals[p.id].sessions || 0) + 1) * (improving ? 1.1 : .4)) + ri(-1, 1));
      return v;
    }

    for (let off = -45; off <= 10; off++) {
      const day = new Date(today); day.setDate(day.getDate() + off);
      // hospital works 7 days a week
      doctors.forEach(doc => {
        const pf = prof[doc.id];
        let n = off === 0 ? ri(pf.load[0] + 3, pf.load[1] + 3) : off > 0 ? ri(0, pf.load[1] - 1) : ri(pf.load[0], pf.load[1]);
        const sh = shifts.find(x => x.id === doc.shift);
        const startH = parseInt(sh.from), endH = parseInt(sh.to);
        const slots = [];
        for (let h = startH; h < endH; h += .5) slots.push(h);
        for (let k = 0; k < n && slots.length; k++) {
          const h = slots.splice(Math.floor(rnd() * Math.min(slots.length, 6 + k)), 1)[0];
          const pool = patients.filter(p => p.prefs.includes(doc.dept));
          const pat = rnd() < .85 && pool.length ? pick(pool) : pick(patients);
          const deptServices = services.filter(x => x.dept === doc.dept);
          const svc = [deptServices[0].id]; if (rnd() < .35) svc.push(pick(deptServices.slice(1)).id);
          if (doc.dept === 'phy') svc[0] = deptServices[0].id;
          const src = pick(sources);
          const start = at(off, Math.floor(h), (h % 1) * 60);
          let status;
          if (off < 0) { const r = rnd(); status = r < pf.noShow ? 'no_show' : r < pf.noShow + pf.cancel ? 'cancelled' : 'completed'; }
          else if (off === 0) {
            if (h + .5 < nowH) { const r = rnd(); status = r < pf.noShow ? 'no_show' : r < pf.noShow + pf.cancel ? 'cancelled' : 'completed'; }
            else if (h <= nowH + 1) { if (!busy[doc.id] && h <= nowH) { status = 'in_progress'; busy[doc.id] = 1; } else status = 'arrived'; }
            else status = rnd() < .75 ? 'confirmed' : 'pending';
          } else status = rnd() < .85 ? 'confirmed' : 'pending';
          const ext = src === 'vezeeta' ? 'VZ-' + ri(7000000, 7999999) : src === 'clinido' ? 'CD-' + ri(300000, 399999) : src === 'ekshef' ? 'EK-' + ri(90000, 99999) : src === 'website' ? 'WEB-' + ri(1000, 9999) : null;
          const fee = svc.reduce((a, id) => a + services.find(x => x.id === id).price, 0);
          const appt = {
            id: 'A-' + (aSeq++), patientId: pat.id, doctorId: doc.id, dept: doc.dept, branch: doc.branch, shift: doc.shift, services: svc, start,
            source: src, externalRef: ext, status, fee, createdAt: at(off - ri(0, 6), ri(8, 22), ri(0, 59)), notes: ''
          };
          if (['arrived', 'in_progress', 'completed'].includes(status)) {
            appt.waitMin = ri(pf.wait[0], pf.wait[1]);
            const arr = new Date(start); arr.setMinutes(arr.getMinutes() - ri(0, 15));
            if (status !== 'completed') arr.setTime(Date.now() - ri(4, 28) * 60000); // live queue: arrived minutes ago
            appt.arrivedAt = arr.toISOString();
          }
          if (status === 'in_progress') appt.startedAt = new Date(Date.now() - ri(2, 12) * 60000).toISOString();
          appointments.push(appt);

          if (status === 'completed') {
            appt.durationMin = ri(pf.dur[0], pf.dur[1]);
            appt.rating = Math.min(5, Math.max(1, ri(pf.rate[0], pf.rate[1])));
            const improving = rnd() < pf.improve;
            const cl = clinical[doc.dept]; const ci = ri(0, cl.c.length - 1);
            const items = [];
            (deptItems[doc.dept] || []).forEach(([sku, q, prob]) => { if (q && rnd() < prob) items.push({ productId: bySku[sku].id, qty: q, by: 'doctor', at: start }); });
            if (rnd() < .15 && items.length) items.push({ productId: bySku['CON-002'].id, qty: 1, by: 'reception', at: start });
            const enc = {
              id: 'E-' + (eSeq++), apptId: appt.id, patientId: pat.id, doctorId: doc.id, dept: doc.dept, date: start,
              complaint: T(...cl.c[ci]), diagnosis: T(...cl.d[ci]), notes: improving ? T('تحسن ملحوظ مقارنة بالزيارة السابقة، الاستمرار على نفس الخطة العلاجية.', 'Noticeable improvement vs. last visit; continue the same plan.') : T('الحالة مستقرة، تم تعديل الخطة العلاجية ومتابعة بعد أسبوعين.', 'Stable; treatment plan adjusted, follow up in 2 weeks.'),
              outcome: improving ? 'improved' : (rnd() < .8 ? 'stable' : 'worse'), vitals: vitalsFor(pat, doc.dept, improving), items, followUp: rnd() < .45
            };
            encounters.push(enc);
            items.forEach(it => movements.push({ id: 'M-' + (mSeq++), productId: it.productId, type: 'out', qty: it.qty, reason: 'consumption', ref: enc.id, patientId: pat.id, dept: doc.dept, by: it.by === 'doctor' ? 'u' + doc.id.slice(1) : 'u9', at: start }));
            if (rxByDept[doc.dept] && rnd() < .6) {
              const r = pick(rxByDept[doc.dept]);
              prescriptions.push({ id: 'RX-' + (rxSeq++), encounterId: enc.id, patientId: pat.id, doctorId: doc.id, date: start, items: [{ drug: T(r[0], r[1]), dose: T(r[2], r[3]) }] });
              enc.rxId = 'RX-' + (rxSeq - 1);
            }
            if ((doc.dept === 'car' || doc.dept === 'ped') && rnd() < .3) {
              const done = off < -1;
              labOrders.push({ id: 'LAB-' + (labSeq++), patientId: pat.id, doctorId: doc.id, encounterId: enc.id, date: start, tests: doc.dept === 'car' ? ['lipid', 'hba1c'] : ['cbc'], status: done ? 'ready' : 'sample', results: done ? (doc.dept === 'car' ? { lipid: ri(150, 260), hba1c: +(5.4 + rnd() * 3).toFixed(1) } : { cbc: +(10 + rnd() * 4).toFixed(1) }) : null });
            }
            // invoice
            const lines = svc.map(id => { const sv = services.find(x => x.id === id); return { kind: 'service', refId: id, name: sv.name, qty: 1, price: sv.price }; });
            items.forEach(it => { const pr = products.find(x => x.id === it.productId); if (pr.price > 0) lines.push({ kind: 'item', refId: pr.id, name: pr.name, qty: it.qty, price: pr.price }); });
            const total = lines.reduce((a, l) => a + l.qty * l.price, 0);
            const ins = pat.insurer ? insurers.find(x => x.id === pat.insurer) : null;
            const insShare = ins ? Math.round(total * ins.coverage / 100) : 0;
            const r = rnd();
            const payStatus = off < -3 ? (r < .93 ? 'paid' : 'partial') : (r < .78 ? 'paid' : r < .9 ? 'partial' : 'unpaid');
            const due = total - insShare;
            const paid = payStatus === 'paid' ? due : payStatus === 'partial' ? Math.round(due / 2) : 0;
            invoices.push({ id: 'INV-' + (iSeq++), patientId: pat.id, apptId: appt.id, encounterId: enc.id, doctorId: doc.id, dept: doc.dept, branch: doc.branch, date: start, lines, total, insurer: ins ? ins.id : null, insShare, paid, status: payStatus, method: ins ? 'insurance' : pick(['cash', 'cash', 'card', 'instapay', 'wallet']), commissionRate: doc.commission, kind: 'visit' });
            enc.invoiceId = 'INV-' + (iSeq - 1);
            appt.invoiceId = enc.invoiceId;
          }
        }
      });
    }
    appointments.sort((a, b) => a.start.localeCompare(b.start));

    // product sales (pharmacy counter) & package subscriptions
    for (let k = 0; k < 40; k++) {
      const off = -ri(0, 40); const pat = pick(patients); const sellable = products.filter(p => p.price > 0);
      const pr = pick(sellable); const qty = ri(1, 3);
      invoices.push({ id: 'INV-' + (iSeq++), patientId: pat.id, date: at(off, ri(9, 21), ri(0, 59)), lines: [{ kind: 'item', refId: pr.id, name: pr.name, qty, price: pr.price }], total: qty * pr.price, insurer: null, insShare: 0, paid: qty * pr.price, status: 'paid', method: pick(['cash', 'card', 'wallet']), kind: 'product', branch: 'b1' });
      movements.push({ id: 'M-' + (mSeq++), productId: pr.id, type: 'out', qty, reason: 'sale', ref: 'INV-' + (iSeq - 1), patientId: pat.id, by: 'u10', at: at(off, 12) });
    }
    for (let k = 0; k < 18; k++) {
      const pk = pick(packages); const pat = pick(patients.filter(p => p.prefs.includes(pk.dept)).concat(patients.slice(0, 2)));
      const off = -ri(1, 50); const used = ri(0, pk.sessions);
      subscriptions.push({ id: 'SUB-' + (400 + k), packageId: pk.id, patientId: pat.id, start: at(off, 11), used, total: pk.sessions, status: used >= pk.sessions ? 'completed' : 'active' });
      invoices.push({ id: 'INV-' + (iSeq++), patientId: pat.id, date: at(off, 11), lines: [{ kind: 'package', refId: pk.id, name: pk.name, qty: 1, price: pk.price }], total: pk.price, insurer: null, insShare: 0, paid: pk.price, status: 'paid', method: pick(['cash', 'card', 'instapay']), kind: 'package', dept: pk.dept, branch: 'b1' });
    }
    // stock receipts
    products.forEach(p => {
      const n = ri(1, 3);
      for (let k = 0; k < n; k++) movements.push({ id: 'M-' + (mSeq++), productId: p.id, type: 'in', qty: Math.max(5, Math.round(p.min * (1 + rnd() * 2))), reason: 'purchase', ref: 'PO-' + ri(1200, 1399), supplier: pick(['المتحدة للأدوية', 'ابن سينا فارما', 'فارما أوفرسيز', 'الشركة المصرية لتجارة الأدوية']), by: 'u11', at: at(-ri(1, 45), ri(9, 14)), unitCost: p.cost });
    });
    invoices.sort((a, b) => a.date.localeCompare(b.date));
    movements.sort((a, b) => a.at.localeCompare(b.at));

    const connectors = [
      { id: 'vezeeta', name: 'Vezeeta', nameAr: 'فيزيتا', color: '#1f6fd1', short: 'V', enabled: true, status: 'connected', method: 'API + Webhook', lastSync: new Date().toISOString() },
      { id: 'clinido', name: 'CliniDo', nameAr: 'كلينيدو', color: '#e1306c', short: 'C', enabled: true, status: 'connected', method: 'API polling (60s)', lastSync: new Date().toISOString() },
      { id: 'ekshef', name: 'Ekshef', nameAr: 'إكشف', color: '#f08c00', short: 'E', enabled: true, status: 'connected', method: 'Email / SMS parser', lastSync: new Date().toISOString() },
      { id: 'website', name: 'Hospital website', nameAr: 'موقع المستشفى', color: '#0e8f82', short: 'W', enabled: true, status: 'connected', method: 'Native booking widget', lastSync: new Date().toISOString() }
    ];

    // seed logs
    const logs = [];
    const L = (dept, user, ar, en, offMin) => { const d = new Date(Date.now() - offMin * 60000); logs.push({ id: 'LG-' + (logs.length + 1), dept, userId: user, msg: T(ar, en), at: d.toISOString() }); };
    L('auth', 'u0', 'تسجيل دخول المدير', 'Admin signed in', 600);
    L('inventory', 'u11', 'استلام شحنة من المتحدة للأدوية (PO-1342)', 'Received shipment from United Pharma (PO-1342)', 540);
    L('integration', 'system', 'مزامنة ناجحة مع فيزيتا: 14 حجز جديد', 'Vezeeta sync OK: 14 new bookings', 480);
    L('bookings', 'u9', 'تسجيل حضور مريض للحجز A-50211', 'Patient checked in for A-50211', 300);
    L('sales', 'u10', 'تحصيل فاتورة INV-30611 نقداً', 'Collected INV-30611 in cash', 240);
    L('medical', 'u1', 'إنهاء كشف وإضافة روشتة', 'Visit completed and prescription added', 200);
    L('inventory', 'u11', 'تنبيه: أقراص أسبرين 81 مجم نفدت من المخزن', 'Alert: Aspirin 81mg out of stock', 150);
    L('admin', 'u0', 'تعديل نسبة عمولة د. عمر خالد إلى 45%', "Changed Dr. Omar Khaled's commission to 45%", 120);
    L('integration', 'system', 'مزامنة ناجحة مع كلينيدو: 6 حجوزات', 'CliniDo sync OK: 6 bookings', 60);
    L('sales', 'u10', 'بيع باقة علاج طبيعي 10 جلسات', 'Sold physiotherapy 10-session package', 45);
    logs.sort((a, b) => a.at.localeCompare(b.at));

    return {
      version: 4, generatedAt: new Date().toISOString(),
      hospital: { name: T('مستشفى النخبة التخصصي', 'Al Nokhba Specialized Hospital'), phone: '+20 2 2401 5500', address: T('شارع عباس العقاد، مدينة نصر، القاهرة', 'Abbas El-Akkad St, Nasr City, Cairo'), vat: 14 },
      branches, shifts, departments, doctors, users, services, packages, insurers, categories, products, patients,
      appointments, encounters, invoices, movements, prescriptions, labOrders, subscriptions, connectors, logs,
      progressNotes: [], notifications: [], expenses: [
        { id: 'X1', cat: T('رواتب', 'Salaries'), amount: 120000 }, { id: 'X2', cat: T('إيجار ومرافق', 'Rent & utilities'), amount: 45000 },
        { id: 'X3', cat: T('صيانة أجهزة', 'Equipment maintenance'), amount: 12000 }, { id: 'X4', cat: T('تسويق وعمولات المنصات', 'Marketing & platform fees'), amount: 9500 }
      ],
      seq: { appt: aSeq, enc: eSeq, inv: iSeq, mov: mSeq, rx: rxSeq, lab: labSeq, pat: 10230 + 300 * 7, log: logs.length + 1 }
    };
  }
  return { generate };
})();

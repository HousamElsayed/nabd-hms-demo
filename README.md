# نبض HMS — Nabd Hospital Management System (Demo)

نسخة تجريبية تفاعلية لنظام إدارة حجوزات وعمليات المستشفيات، مربوط بمنصات الحجز المصرية (فيزيتا، كلينيدو، إكشف).
Interactive demo of a hospital reservations & operations system connected to Egyptian booking platforms.

## الحسابات التجريبية — Demo accounts
كلمة المرور لكل الحسابات / password for all: `123456`

| الدور / Role | اسم المستخدم / Username |
|---|---|
| مالك المستشفى (كل الصلاحيات) / Owner–admin | `admin` |
| أطباء / Doctors | `dr.ahmed` (عيون) · `dr.mona` (أطفال) · `dr.karim` (عظام) · `dr.sara` (جلدية) · `dr.youssef` (قلب) · `dr.nour` (أسنان) · `dr.heba` (علاج طبيعي) · `dr.omar` (عيون - المعادي) |
| الاستقبال / Reception | `reception` |
| المبيعات والخزينة / Sales | `sales` |
| المخازن / Inventory | `store` |
| الحسابات / Accounts | `accounts` |

## ما الذي يمكن تجربته — What to try
1. ادخل كـ `admin` ← **ربط المنصات** ← "محاكاة حجز وارد الآن": الحجز يظهر فوراً عند الطبيب المختص.
2. ادخل كـ `reception` ← **الحجوزات** ← تسجيل حضور مريض.
3. ادخل كـ `dr.ahmed` ← بدء الكشف ← إنهاء الكشف: تشخيص + علامات حيوية + مستلزمات (تُخصم من المخزون) + روشتة ← تصدر فاتورة تلقائياً.
4. `reception` ← إضافة مستلزمات إضافية لزيارة مكتملة.
5. `admin` ← **أداء الأطباء**: التقرير نصف الشهري، نسبة كل طبيب، نقاط الضعف والتوصيات.

## Tech
Static demo (HTML/CSS/vanilla JS, no build). Data is generated in the browser and kept in `localStorage`
(refreshes daily; "Reset demo data" in Settings). Libraries: Chart.js, Lucide icons, IBM Plex Sans Arabic.

Run locally: `python -m http.server 8765` then open http://localhost:8765

See [REQUIREMENTS.md](REQUIREMENTS.md) for the full client brief.

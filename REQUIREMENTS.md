# Nabd HMS — Project requirements (from client brief)

Living record of what the client asked for, so the production build stays aligned with the demo.
Status column: **Demo** = shown in the clickable demo · **Prod** = needs real backend work.

## 1. Goal
A hospital system sold to multiple hospitals in Egypt. Its purpose is to **find the hospital's weak points** so it
runs at full capacity and becomes **more successful and more profitable**. Arabic first (RTL), clear and readable for doctors.

## 2. Booking-platform integration (core)
| # | Requirement | Status |
|---|---|---|
| 2.1 | Patients book on **Vezeeta**, **CliniDo**, **Ekshef** (and similar Egyptian platforms) for a specific hospital | Demo (simulated) |
| 2.2 | Each booking enters the system **automatically** and is routed to the **right department/clinic and the right doctor** (e.g. eye exam → Ophthalmology → ophthalmologist) | Demo |
| 2.3 | The doctor sees the booking in their queue instantly (notification) | Demo |
| 2.4 | Mapping of each doctor to their ID on each platform | Demo |
| 2.5 | Real connection per platform: partner API / webhook; fallback = parse the platform's booking email/SMS | Prod |

## 3. Patients
| 3.1 | Every patient has a separate profile: upcoming appointments, all visits, all items used, invoices | Demo |
| 3.2 | Doctor can track the patient's health and progress over time (vitals charts, improved/stable/worse per visit, progress notes) | Demo |
| 3.3 | Prescriptions and lab results inside the profile | Demo |

## 4. Inventory
| 4.1 | Every item used for a patient is **deducted from stock** | Demo |
| 4.2 | All items organised in **categories** | Demo |
| 4.3 | **Extra items** used can be added **later by the receptionist** (deducted + added to the invoice + patient file) | Demo |
| 4.4 | Stock quantities, reorder alerts, expiry, receiving, stock counts, movement history | Demo |

## 5. Sales, invoices, finance
| 5.1 | System aware of sales, invoices, stock and quantities | Demo |
| 5.2 | Invoices per visit (services + items), product sales, packages, insurance share, partial payments | Demo |
| 5.3 | Payment methods common in Egypt: cash, card, InstaPay, mobile wallets, insurance | Demo |
| 5.4 | E-invoicing (ETA) integration for Egyptian tax authority | Prod (optional) |

## 6. Doctors' percentage & performance reports (owner)
| 6.1 | Each doctor has a **percentage of each appointment** (configurable per doctor) | Demo |
| 6.2 | Reports on doctor performance: patients received, how they were treated (rating, wait, visit length), patient progress, revenue, doctor share vs hospital share | Demo |
| 6.3 | **Two reports per month** (1–15 and 16–end of month) for the owner | Demo (generated on demand; auto-send = Prod) |
| 6.4 | Reports highlight **weak points** with recommendations to increase sales and doctor performance | Demo (rule-based) |

## 7. Access, separation, logs
| 7.1 | Each doctor has their own username/password and sees only their own data | Demo |
| 7.2 | Each clinic is separated | Demo |
| 7.3 | Admin login with full access | Demo |
| 7.4 | Departments separated (sales, inventory, reception…) each with **its own logs** | Demo |
| 7.5 | Full audit log of who did what and when | Demo |
| 7.6 | Real authentication (hashed passwords, sessions, 2FA optional) | Prod |

## 8. Dashboard & categories
Dashboard inspired by the client's reference screenshot (bookings screen with date, filters by doctor/branch/shift/department,
report cards total/completed/cancelled/remaining, services summary, tabs, patient table) — **redesigned**, plus sidebar
categories: Bookings, Sales, Medical reports, Services, Departments, Shifts, Packages, Patients, Prescriptions, Lab,
Insurance, Products/Inventory, Finance, Reports, Settings. (Nutrition module from the screenshot = optional, not in demo.)

## 9. Additions proposed by us (in demo)
- Live "incoming bookings" feed + simulate button for the client presentation
- Patient no-show / waiting-time / utilization tracking per doctor
- Package subscriptions (session bundles)
- Board view of bookings per doctor
- CSV/Excel export and print-to-PDF on reports and invoices
- Dark mode, English toggle, mobile-friendly layout

## 10. Ideas for production (not in demo)
- WhatsApp/SMS reminders to cut no-shows; post-visit rating request
- Multi-hospital (multi-tenant) SaaS with per-hospital subscription
- Real-time sync (WebSockets), offline-tolerant reception screen
- Backups, data hosting in compliance with Egyptian data-protection law (Law 151/2020)

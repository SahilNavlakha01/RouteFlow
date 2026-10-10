# 🚀 RouteFlow — Hyperlocal Route Ledger & Micro-ERP (PWA)

> **Modern, High-Speed Daily Route Ledger for Neighborhood Businesses**  
> Specially crafted for Laundry & Pressing, Tiffin & Catering, Grocery/Dairy Delivery, and local route-based service operators.

---

## 🌟 Key Highlights & Features

### 1. ⚡ High-Speed Mobile Route Sheet (`/route`)
- **One-Hand Thumb Ergonomics:** Select Society → Select Wing → Tap Flat Card (`A/302`, `B/901`, etc.).
- **Tactile Quick Counters:** Big `[-]` and `[+]` counter pills with live price calculation.
- **Dynamic Catalog:** Automatically loads your configured services with rates (e.g. Ironing @ ₹8, Wash & Iron @ ₹16, Dry Clean @ ₹120, Tiffin Meals @ ₹80).
- **One-Tap Save & Next:** Saves the daily log, updates live balances, and moves to the next customer.

### 2. 🧾 Auto-Billing, PDF Statements & WhatsApp (`/invoices`)
- **Date-Range Statement:** Generate customer statements for current month, past 30 days, or custom dates.
- **Itemized Ledger:** Date, clothes/meals collected, services, unit rate, and total line price.
- **Account Summary:** `Previous Balance + Current Charges - Payments Received = Total Due`.
- **1-Click WhatsApp Share:** Opens WhatsApp with pre-formatted billing breakdown message.
- **Print / Save PDF:** Clean, high-resolution invoice statement ready for printing or saving to PDF.

### 3. 👥 Resident Customer & Flat Master (`/customers`)
- Map residents to **Society → Wing/Block → Flat Number**.
- Live balance tracker (Dues vs Clear) computed dynamically across all route entries and payments.
- Chronological customer transaction history & ledger drawer.
- Instant cash/UPI payment recording.

### 4. 🏢 Society & Locations Hierarchy (`/locations`)
- Organize routes by Complexes, Societies, Towers, Wings, and Blocks.
- See active flat counts per tower.

### 5. 🛠 Custom Service Catalog (`/services`)
- Add custom services with custom pricing and units (`pcs`, `kg`, `meal`, `pack`, `ltr`, `visit`).
- Intelligent auto-seeding presets for **Laundry**, **Tiffin**, and **Grocery**.

### 6. 📱 Progressive Web App (PWA)
- Installable on mobile & desktop with native app experience (`manifest.json` + `sw.js`).
- Standalone display mode with custom theme color (`#09090b` and `#f59e0b`).

---

## 🏗 Technology Architecture

- **Frontend:** Next.js 16 (App Router), Tailwind CSS, Lucide Icons, Service Worker PWA.
- **Backend:** Node.js + Express REST API (ES Modules).
- **Database:** PostgreSQL (with automatic zero-config embedded PostgreSQL engine + standard `pg` connection pool support).
- **Auth:** JWT Token authentication with bcrypt password hashing.

---

## 🏃 Running the Application

### Backend:
```bash
cd backend
npm install
npm run dev
# Running on http://localhost:5001
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```

### Quick Demo Access:
- **Email:** `demo@routeflow.io`
- **Password:** `demo123`
*(Or click the 1-Tap "Instant Preview" button on the login screen)*

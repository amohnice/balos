# Balos - Mitumba Business Management System

Balos is a multi-tenant business management and Point of Sale (POS) system designed for second-hand clothing (*mitumba*) businesses. It streamlines bale tracking, stock sorting, category approvals, pricing, and point-of-sale operations across multiple shops or branches.

---

## 🌟 Key Features

- **Multi-Shop Management**: Easily switch between and manage multiple business outlets or branches.
- **Role-Based Access Control (RBAC)**:
  - **Platform Roles**: `OWNER` (account creator), `MEMBER` (staff member).
  - **Shop Roles**: `OWNER`, `MANAGER` (approvals & store operations), `SORTER` (bale opening & category creation), `CASHIER` (POS sales).
- **Bale & Inventory Tracking**: Record purchases from suppliers, log weight & pricing, and manage bale status (`ARRIVED`, `SORTING`, `ACTIVE`, `CLEARED`).
- **Sorting & Approval Workflow**:
  1. Sorters open bales and create item categories (`PENDING`).
  2. Managers/Owners approve categories for active sale (`APPROVED`).
- **Point of Sale (POS)**: Fast sales recording with cash, M-Pesa, or card payment support.
- **Dashboard & Analytics**: Real-time overview of revenue, active stock, pending approvals, and top-selling items.

---

## 🏗️ Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database & ORM**: PostgreSQL (Neon DB), Prisma ORM
- **Authentication**: JWT (JSON Web Tokens), bcrypt password hashing

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database URL (or Neon DB connection string)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables (.env)
# DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
# JWT_SECRET="your_secret_key"

# Generate Prisma Client & Sync Database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Backend will run on `http://localhost:5000`.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will run on `http://localhost:3000`.

---

## 📂 Project Structure

```text
balos/
├── backend/
│   ├── prisma/          # Database schema & migrations
│   └── src/
│       ├── lib/         # Permissions, Prisma client, JWT helpers
│       ├── middleware/  # Auth & role-based access control
│       └── routes/      # API endpoints (bales, sales, auth, dashboard, etc.)
└── frontend/
    └── src/
        ├── app/         # Next.js App Router pages (auth & dashboard)
        ├── components/  # Reusable UI components & layouts
        ├── contexts/    # React contexts (Auth, ActiveBusiness, Toast)
        └── lib/         # API client & auth utilities
```
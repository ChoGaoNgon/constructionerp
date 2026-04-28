# Project Context: Construction Management System (Supabase Version)

## 🏗️ Overview
A real-time construction project monitoring dashboard designed for Project Management Boards (BCH) and Directors (PGD). The system focuses on tracking progress variance, cost health, and daily field reporting.

## 🛠️ Technical Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend / DB**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Hooks (useState, useEffect)
- **Deployment**: AI Studio / Cloud Run

## 📂 Core Requirements & Features

### 1. Project Management
- **Dashboard**: High-level overview of all active projects.
- **Customizable Grid**: Users can toggle column visibility (Progress, Cost Variance, Receivable, etc.).
- **Soft Delete**: Admin-only feature to hide projects from the main list without physical deletion.
- **Dynamic Status**: 
  - 🔴 **Risk**: Progress lag > 5% or Cost > 110% of budget.
  - 🟡 **Warning**: Any progress lag or cost over budget.
  - 🟢 **Normal**: On track.

### 2. Personnel Management
- **Searchable Directory**: Search by name, email, or role (min 4 characters).
- **Role-based Access**: 
  - `admin`: Full access, management of users and projects.
  - `PGD`: Supervisory access, can create/edit projects.
  - `BCH`: Site commanders, can submit daily reports.
  - `accountant`: Financial monitoring access.
- **User Creation**: Automated invite/signup flow with manual database sync for reliability.

### 3. Daily Reports (Timeline)
- **Role-Based Capture**: 
  - **BCH (Field Commanders)**: Focus on site activity—submit `progress_percent`, `issues`, and `suggestions`.
  - **Admin/Accountant**: Responsible for indexing `actual_cost`. This field is hidden from BCH to ensure financial privacy and data integrity.
- **Latest State**: Project progress reflects the **most recent** report entry based on date.
- **Cost Accumulation**: Project-level `actual_cost` is dynamically summed from all associated daily reports.

### 4. Financial Tracking
- **Financial Management Page**: A dedicated module for Accountants and Admins to log actual costs by project and date without needing the full Daily Report context.
- **Access Control**: Users with `BCH` or `PGD` roles are restricted from viewing financial health metrics (Planned/Actual Cost, Collected/Receivable) across the dashboard and project details.
- **Metrics**: 
  - `planned_cost`: Initial budget.
  - `actual_cost`: Real-time spending total.
  - `collected_amount`: Cash inflow.
  - `receivable_amount`: Pending revenue.

### 5. UI & UX Refinements
- **Searchable Select (Autocomplete)**: Implemented custom React Autocomplete components for project filters to handle large datasets efficiently.
- **Filter Reset**: Global "Reset" button for quick clearing of search criteria.
- **Visual Consistency**: Material Design inspired interface with custom Tailwind utility classes for high-density information display.

## 🗄️ Database Schema (Supabase)

### `public.users`
- `id` (UUID, PK)
- `email` (Unique)
- `name` 
- `role` (BCH, PGD, accountant, admin)

### `public.projects`
- `id` (Text, PK)
- `name`
- `commander_id` (FK to users)
- `director_id` (FK to users)
- `planned_progress` (Real)
- `planned_cost` (BigInt)
- `collected_amount` (BigInt)
- `receivable_amount` (BigInt)
- `is_deleted` (Boolean, default: false)

### `public.daily_reports`
- `project_id` (FK to projects)
- `date` (Date)
- `progress_percent` (Real)
- `actual_cost` (BigInt)
- `issues` (Text)
- `suggestions` (Text)

## 🔐 Security (RLS)
- Data is secured via PostgreSQL Row Level Security.
- Policies ensure that only authenticated users with correct roles can write to projects or reports.
- `Public` users (all authenticated) can read projects/users to ensure the dashboard works for all team members.

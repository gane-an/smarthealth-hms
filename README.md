# SmartHealth Hospital Management System

Modern full‑stack hospital management system with a React/Vite frontend and a Node.js/Express API powered by Prisma and MySQL.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
  - [Node.js and Package Manager](#nodejs-and-package-manager)
  - [Database (MySQL)](#database-mysql)
  - [Global Tools](#global-tools)
- [Getting the Code](#getting-the-code)
  - [Cloning from GitHub](#cloning-from-github)
  - [Pushing this Project to GitHub](#pushing-this-project-to-github)
- [Environment Configuration](#environment-configuration)
  - [Frontend .env](#frontend-env)
  - [Backend .env](#backend-env)
- [Installing Dependencies](#installing-dependencies)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Database Setup](#database-setup)
  - [Create Database and User](#create-database-and-user)
  - [Apply Prisma Schema](#apply-prisma-schema)
- [Running the Application](#running-the-application)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
- [Database Seeding (server/prisma/seed.js)](#database-seeding-serverprismaseedjs)
  - [What the Seed Script Creates](#what-the-seed-script-creates)
  - [Seeding Prerequisites](#seeding-prerequisites)
  - [Running the Seed Script](#running-the-seed-script)
  - [Expected Output and Success Indicators](#expected-output-and-success-indicators)
  - [Verifying Seeded Data](#verifying-seeded-data)
  - [Troubleshooting Seeding Errors](#troubleshooting-seeding-errors)
- [Scripts Reference](#scripts-reference)

---

## Overview

This project implements a hospital management system with:

- Patient, doctor and admin roles.
- Department management.
- Appointment booking, queue management and lifecycle logging.
- Medical record and prescription management.
- Real‑time updates using WebSockets.

The repository is structured as:

- Frontend React app at the project root.
- Backend Node.js/Express API in the `server/` folder.
- Prisma ORM with a MySQL database.

---

## Tech Stack

- **Frontend**
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - Radix UI components

- **Backend**
  - Node.js (ES modules)
  - Express
  - Prisma ORM
  - JSON Web Tokens (JWT)
  - Socket.IO

- **Database**
  - MySQL (via Prisma datasource configured in `server/prisma/schema.prisma`)

---

## Project Structure

High‑level structure:

```text
.
├── README.md
├── package.json            # Frontend package definition
├── pnpm-workspace.yaml     # Workspace config (frontend + backend)
├── src/                    # React application
├── public/                 # Static assets
├── vite.config.ts          # Vite build config
├── vite.config.dev.ts      # Vite development config
├── .env                    # Frontend env (Vite)
└── server/
    ├── package.json        # Backend package definition
    ├── prisma/
    │   ├── schema.prisma   # Prisma schema (MySQL)
    │   ├── migrations/     # Database migrations
    │   └── seed.js         # Database seed script
    ├── src/
    │   ├── index.js        # Express app entry
    │   ├── config.js       # Server config (PORT, JWT)
    │   ├── prismaClient.js # Prisma client instance
    │   ├── routes/         # Route handlers
    │   └── middleware/     # Middleware
    └── .env                # Backend environment variables
```

---

## Prerequisites

### Node.js and Package Manager

- Node.js **≥ 20**
- npm **≥ 10**

Check your versions:

```bash
node -v
npm -v
```

You can use `pnpm` or `npm`. Examples below use `npm`, but the commands map directly to `pnpm` if you prefer it.

### Database (MySQL)

- MySQL **8.0+** installed and running locally or accessible remotely.
- Ability to create a database and user.

Prisma is configured in [`server/prisma/schema.prisma`](file:///c:/Users/ELCOT/Desktop/HMS%201.3/hospital-mgnt-sys/server/prisma/schema.prisma) to use:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### Global Tools

Recommended:

- Git
- A terminal (PowerShell, cmd, bash, zsh)
- An editor such as VS Code/Trae IDE

---

## Getting the Code

### Cloning from GitHub

Once this project is pushed to GitHub, clone it on any new system:

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

Replace `<your-username>` and `<your-repo>` with your actual GitHub username and repository name.

### Pushing this Project to GitHub

If you are starting from this local folder and want to push it to GitHub:

1. Create a new empty repository on GitHub (without README, license, or .gitignore).
2. In the project root, initialize Git and make the initial commit:

   ```bash
   cd "c:/Users/ELCOT/Desktop/HMS 1.3/hospital-mgnt-sys"
   git init
   git add .
   git commit -m "Initial commit: SmartHealth hospital management system"
   ```

3. Set the default branch to `main` (if not already):

   ```bash
   git branch -M main
   ```

4. Add the GitHub remote and push:

   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

5. Before pushing, make sure sensitive configuration is not committed publicly. At minimum:
   - Do not commit real passwords, secrets or production connection strings.
   - Consider adding `.env` and `server/.env` to `.gitignore` and re‑creating them manually on each environment.

---

## Environment Configuration

The project uses separate environment files for frontend and backend.

### Frontend .env

Location: [`./.env`](file:///c:/Users/ELCOT/Desktop/HMS%201.3/hospital-mgnt-sys/.env)

Example content:

```env
VITE_APP_ID=app-9nsq8l8utrsx
```

You generally do not need to change this for local development unless you integrate additional services.

### Backend .env

Location: [`./server/.env`](file:///c:/Users/ELCOT/Desktop/HMS%201.3/hospital-mgnt-sys/server/.env)

Example content for local development:

```env
DATABASE_URL="mysql://root:your-password@localhost:3306/smarthealth"
JWT_SECRET="a-strong-secret-value"
JWT_EXPIRES_IN="1h"
PORT=4000
```

- `DATABASE_URL` must point to your MySQL instance and database.
- `JWT_SECRET` should be a long random string in production.
- `PORT` is the port used by the backend API (default 4000).

Always keep `.env` files out of public repositories in real deployments.

---

## Installing Dependencies

Run these commands after cloning the repository.

### Frontend

From the project root:

```bash
cd <project-root>
npm install
```

This installs all dependencies defined in the root [`package.json`](file:///c:/Users/ELCOT/Desktop/HMS%201.3/hospital-mgnt-sys/package.json).

### Backend

From the `server` folder:

```bash
cd server
npm install
```

This installs backend dependencies defined in [`server/package.json`](file:///c:/Users/ELCOT/Desktop/HMS%201.3/hospital-mgnt-sys/server/package.json).

---

## Database Setup

### Create Database and User

Connect to MySQL (for example, using the MySQL CLI or a GUI such as MySQL Workbench) and create a database and user:

```sql
CREATE DATABASE smarthealth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'smarthealth_user'@'localhost' IDENTIFIED BY 'strong-password';
GRANT ALL PRIVILEGES ON smarthealth.* TO 'smarthealth_user'@'localhost';
FLUSH PRIVILEGES;
```

Update `DATABASE_URL` in `server/.env` accordingly, for example:

```env
DATABASE_URL="mysql://smarthealth_user:strong-password@localhost:3306/smarthealth"
```

### Apply Prisma Schema

From the `server` directory:

```bash
cd server
npm run prisma:migrate
```

This runs `prisma db push` and makes sure the MySQL schema matches `schema.prisma`. Run this after any schema changes and before seeding.

If you prefer using the Prisma CLI directly:

```bash
npx prisma db push
```

---

## Running the Application

### Development Mode

You typically run frontend and backend in two terminals.

1. **Start the backend**

   ```bash
   cd server
   npm run dev
   ```

   The backend starts on the port configured in `server/.env` (default `4000`).

2. **Start the frontend**

   In another terminal, from the project root:

   ```bash
   cd <project-root>
   npx vite --config vite.config.dev.ts --host 127.0.0.1 --port 5173
   ```

   Then open http://127.0.0.1:5173 in your browser.

### Production Mode

In production you usually:

1. Build the frontend.

   From the project root:

   ```bash
   cd <project-root>
   npx vite build --config vite.config.ts
   ```

   This generates a `dist/` directory with static assets.

2. Serve the built frontend using any static file server or your preferred hosting platform (for example, Nginx, Apache, or a cloud static hosting solution).

3. Start the backend in production mode.

   On the server:

   ```bash
   cd server
   npm install --production
   npm run start
   ```

   Use a process manager such as PM2 or a systemd service to keep the backend running.

---

## Database Seeding (server/prisma/seed.js)

The seed script initializes the database with realistic demo data so you can use the application immediately after setup.

Script location: [`server/prisma/seed.js`](file:///c:/Users/ELCOT/Desktop/HMS%201.3/hospital-mgnt-sys/server/prisma/seed.js)

### What the Seed Script Creates

The seed script uses Prisma to `upsert` and `create` data:

- **Departments**
  - Cardiology
  - Pediatrics
  - Neurology
  - Orthopedics
  - Dermatology
  - General Medicine

- **Admin user**
  - Email: `admin@smarthealth.com`
  - Password: `Admin@123` (hashed with bcrypt in the script)

- **Doctors**
  - Multiple doctors (doctor1–doctor10) with realistic profiles:
    - Emails e.g. `doctor1@smarthealth.com`, `doctor2@smarthealth.com`, …
    - Assigned departments (Cardiology, Pediatrics, etc.).
    - Degrees, license IDs, availability schedules.
    - `approvalStatus` set to `"approved"` for seeded doctors.

- **Patients**
  - Several patients (patient1–patient5) with:
    - Emails like `patient1@smarthealth.com`, etc.
    - Date of birth and gender.
    - Approved flags.

- **Appointments**
  - A set of appointments for one of the cardiology doctors (`doctor7@smarthealth.com`) with varied statuses:
    - `booked`
    - `completed`
    - `cancelled`
  - Mix of time slots (morning, afternoon), emergency and non‑emergency visits.
  - Reasons for visit filled with real‑world descriptions.

This data enables you to:

- Log in as admin or doctor and see existing departments.
- View patient lists and sample appointments.
- Test appointment lifecycle behavior and real‑time queue updates.

### Seeding Prerequisites

Before running the seed script, ensure:

1. **Database is reachable**
   - MySQL is running.
   - `DATABASE_URL` in `server/.env` points to a valid database with correct user credentials.

2. **Prisma schema is applied**
   - From `server` directory:

     ```bash
     cd server
     npm run prisma:migrate
     ```

3. **Backend dependencies installed**

   ```bash
   cd server
   npm install
   ```

### Running the Seed Script

From the `server` directory you have two equivalent options:

```bash
cd server
npm run seed
```

or:

```bash
cd server
npx prisma db seed
```

Both commands execute `server/prisma/seed.js` as configured in [`server/package.json`](file:///c:/Users/ELCOT/Desktop/HMS%201.3/hospital-mgnt-sys/server/package.json).

### Expected Output and Success Indicators

During seeding you should see console logs from Prisma and the script. On successful completion:

- The process exits with code `0`.
- No unhandled errors are printed.
- At the end, the script logs a JSON block containing a `seedVerification` object similar to:

```json
{
  "seedVerification": {
    "doctor7Exists": true,
    "doctor7UserId": "uuid-...",
    "doctor7ProfileId": "uuid-...",
    "appointmentCount": 5,
    "appointmentStatuses": ["booked", "completed", "cancelled", "booked", "completed"]
  }
}
```

If you see this structure, the seed has successfully created sample data for `doctor7` and associated appointments.

### Verifying Seeded Data

To confirm the data is in the database:

1. **Check with MySQL directly**

   Connect to the database and run queries such as:

   ```sql
   USE smarthealth;

   SELECT COUNT(*) FROM departments;
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM appointments;

   SELECT email, role FROM users WHERE email IN (
     'admin@smarthealth.com',
     'doctor1@smarthealth.com',
     'patient1@smarthealth.com'
   );
   ```

2. **Verify through the application**

   - Start the backend (`npm run dev` in `server`).
   - Start the frontend and open it in the browser.
   - Log in with the seeded users (for example, `admin@smarthealth.com` / `Admin@123`, or one of the doctor/patient accounts as defined in the seed script).
   - Check that:
     - Departments are listed.
     - Doctors appear under the correct departments.
     - Sample appointments show up in the UI.

### Troubleshooting Seeding Errors

Common issues and fixes:

- **Error: `P1001` (database unreachable)**
  - MySQL is not running or connection details are wrong.
  - Verify `DATABASE_URL` host, port, username, password, and database name.

- **Error: `P1003` (database does not exist)**
  - The database name in `DATABASE_URL` does not exist.
  - Create it using `CREATE DATABASE smarthealth;` and re‑run `npm run prisma:migrate`.

- **Unique constraint violations**
  - The script uses `upsert`, so it is safe to run multiple times. If you manually modify data and encounter conflicts, consider truncating tables or using a fresh database for testing.

- **Timeouts or connection issues**
  - Check firewall rules or remote database access if not running locally.
  - Confirm the user has privileges on the `smarthealth` database.

If errors persist, run the seed command with verbose Prisma logging for more detail:

```bash
cd server
DEBUG="prisma:*" npm run seed
```

---

## Scripts Reference

### Root (frontend) scripts

Defined in [`package.json`](file:///c:/Users/ELCOT/Desktop/HMS%201.3/hospital-mgnt-sys/package.json):

- `npm run lint` – Runs type and style checks. Prefer using `npx vite` / `npx vite build` directly for dev and build as shown above.

### Backend scripts

Defined in [`server/package.json`](file:///c:/Users/ELCOT/Desktop/HMS%201.3/hospital-mgnt-sys/server/package.json):

- `npm run dev` – Start the Express server in development mode.
- `npm run start` – Start the Express server (suitable for production when used with a process manager).
- `npm run seed` – Run the Prisma seed script at `prisma/seed.js`.
- `npm run prisma:migrate` – Apply Prisma schema to the database (`prisma db push`).
- `npm run prisma:generate` – Generate Prisma client.
- `npm test` – Run appointment rule tests.
- `npm run test:register` – Run registration flow tests.

Use these scripts as building blocks when creating CI/CD pipelines or custom deployment workflows.

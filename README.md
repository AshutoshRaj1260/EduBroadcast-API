# EduBroadcast API

![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)
![Express](https://img.shields.io/badge/Express-4.x-blue.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.x-orange.svg)
![Security](https://img.shields.io/badge/Security-JWT-black.svg)
![Code Style](https://img.shields.io/badge/Code_Style-Prettier-ff69b4.svg)

A straightforward, secure backend system built for educational environments. It allows Teachers to upload subject-specific study materials, Principals to approve them, and students to view them through a continuously looping public broadcast.

This API was developed precisely to the specifications of the technical assignment, prioritizing clean code, edge-case handling, and scalable backend logic without over-engineering. Code consistency was maintained using **Prettier**, and development was assisted by **GitHub Copilot**.

> 🧠 **Note for Evaluators:** For a deep dive into the system design, mathematical rotation logic, and database normalization, please see the [`ARCHITECTURE.md`](./ARCHITECTURE.md) file.

---

## 📌 Features & Logic Overview

### 1. Role-Based Access Control (RBAC) & Security
- **Authentication**: JWT-based authentication using HTTP-only cookies to protect against XSS vulnerabilities. Passwords are securely hashed using `bcrypt`.
- **Roles**: Distinct separation of privileges between `teacher` and `principal`. 

### 2. Content Upload & Approval Pipeline
- **File Uploads**: Administered securely using `multer`. Supports `.jpg`, `.png`, and `.gif` up to 10MB.
- **Workflow**: Content strictly follows the lifecycle: `uploaded` → `pending` → `approved`/`rejected`.
- **Feedback**: If a Principal rejects content, a mandatory rejection reason is saved to the database for the Teacher to review.

### 3. Dynamic Scheduling Engine (Core Logic)
Instead of relying on heavy, resource-intensive background processes (like Cron workers) to handle content rotation, the system uses a mathematical **Time-Based Modulo Algorithm**:
1. When the public broadcasting API is called, it fetches only `approved` content falling exactly within its `start_time` and `end_time` boundaries.
2. It groups the active items by their `subject` and sums up their collective `duration` (e.g., Content A (5m) + Content B (5m) = 10m loop).
3. It takes the exact elapsed time (in minutes) since the first content's scheduled `start_time` and uses the modulo operator (`%`) against the total loop duration. This prevents timing-skips and perfectly synchronizes which single piece of content actively broadcasts at that exact minute!

This guarantees a flawless, looping chronological rotation completely on the fly!

### 4. Edge Cases Handled
- **No Content**: Properly returns a friendly `{"message": "No content to display"}` instead of crashing or returning errors if a teacher has zero approved files.
- **Out of Schedule**: If an approved file's `start_time` hasn't arrived yet, or the `end_time` has expired, it is safely excluded from the broadcast.
- **Param Security**: Student requests specifically mapped as `/teacher-1` dynamically parse into secure integers cleanly to block SQL injection.

---

## 🚀 Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0 or higher)
- [MySQL](https://www.mysql.com/) Server

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file referencing `.env.example`:
```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=edubroadcast_db
JWT_SECRET=super_secret_jwt_key
```

### 3. Database Setup (Local MySQL)
For security purposes, cloud database credentials are not included in this repository. Please configure a local MySQL instance to test the application.

1. Create a local database named `edubroadcast_db` in your MySQL server.
2. Rename the provided `.env.example` file to `.env` and fill in your local MySQL credentials.
3. Run the database initialization script. This will automatically generate the required tables (`Users`, `Content`, `ContentSlots`, `ContentSchedule`):
```bash
node src/utils/init.db.js
```

### 4. Run the Server
```bash
npm start
```
The API is now running locally on `http://localhost:3000`. Uploaded images map statically to `/uploads/`.

---

## 🧪 Postman API Testing 

A fully configured Postman collection has been mapped out for your convenience to immediately test these capabilities without manually tracing endpoints!

1. Open Postman and click **Import**.
2. Navigate to the `docs/` folder in this repository.
3. Import both `EduBroadcast.postman_collection.json` (The Endpoints) and `EduBroadcast_Local.postman_environment.json` (The predefined URL variables).
4. Run the API calls linearly starting from **Register**, directly into the **Broadcast Loop**!

---

## 📡 API Endpoints

### Auth (`/api/auth`)
- `POST /register` - Register a `teacher` or `principal`.
- `POST /login` - Sign in and receive an HTTP-only JWT.

### Teacher Portal (`/api/content`) _(Needs Teacher JWT)_
- `POST /upload` - Upload content via `multipart/form-data` (`title`, `subject`, `file`, `start_time`, `end_time`, `duration`).
- `GET /my-content` - View personal upload history and statuses.

### Principal Dashboard (`/api/content`) _(Needs Principal JWT)_
- `GET /pending` - Review all queued content needing approval.
- `GET /all` - View everything ever uploaded natively.
- `PUT /:id/approve` - Approve content to enter the live rotation.
- `PUT /:id/reject` - Reject content (Requires JSON: `{ "rejection_reason": "Too blurry" }`).

### Public Broadcast (`/content/live`) _(No Auth Needed, Rate-Limited)_
- `GET /:teacherIdParam` - Fetches the live broadcasting loop item. 
  - Example: `http://localhost:3000/content/live/teacher-1?subject=Maths`

---

## 📎 Assignment Requirements & Notes

**Implemented Features & Bonuses:**
- **✅ Rate Limiting (Bonus):** Implemented via `express-rate-limit` on the public API protecting it from spam (60 requests/minute).
- **✅ Subject Filtering:** The public broadcast endpoint actively supports query-based filtering to isolate specific subjects (e.g., `?subject=Maths`).

**Evaluation Links:**
- **Demo Video:** [Insert Link Here](#)
- **API Documentation (Postman/Swagger):** [Insert Link Here](#)
- **Deployment Link:** [Insert Link Here](#)

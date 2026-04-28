# 🏛️ EduBroadcast Setup - Backend Architecture Notes

This document provides a deep, technical breakdown of the system architecture according to Section 5 of the assignment requirements.

---

## 1. Authentication & RBAC Flow
The system utilizes robust JSON Web Tokens (JWT) for stateless authentication.
- **Login/Registration:** Users are issued a cookie containing their JWT upon a successful login, neutralizing cross-site scripting (XSS) attacks. Passwords are hashed using `bcrypt` before storage.
- **Role-Based Access Control (RBAC):** Access is strictly governed via two middleware intercepts. `authenticate` verifies the JWT signature and expiration, while `authorize(['principal', 'teacher'])` ensures the decoded user possesses the exact privileges required for the route. For example, only a user with the `teacher` role can hit the `/upload` endpoint, and only a `principal` can hit `/approve`.

## 2. Subject-Based System Design
Content is natively coupled to its `subject` string (e.g., Maths, Science). When a teacher uploads content, the backend dynamically verifies if a specific `ContentSlots` group exists for that subject. If missing, it automatically creates a new slot isolated for that discipline. 
This relational isolation guarantees that fetching a live feed for a specific subject (via the query param `?subject=Maths`) executes extremely fast and only returns that isolated chunk.

## 3. Upload Handling Approach
File uploads are intercepted and processed asynchronously using `multer`.
- An `upload.js` middleware filters incoming `multipart/form-data` to strictly enforce permitted Mimetypes (`image/jpeg`, `image/png`, `image/gif`).
- A 10MB size limit is stringently enforced at the buffer level to prevent memory exhaustion protocols.
- Files are saved persistently to a local `./uploads` directory. Their metadata (file path, exact mimetype, and byte size) is extracted and mapped into the relational SQL database for indexing.

## 4. Approval Workflow Design
- Content lifecycle begins statically as `uploaded` but is overridden to `pending` upon initial Database insertion by the Teacher.
- The Principal has a dedicated authorized endpoint (`/pending`) to query only rows trapped in this state.
- The Principal triggers a `PUT` mutation to update the `status` enum to either `approved` (capturing `approved_by` and `approved_at` timestamps) or `rejected` (mandating a JSON payload containing the `rejection_reason`).
- Only content explicitly verified as `status = 'approved'` qualifies for the final public broadcasting mathematical loop.

## 5. Scheduling & Rotation Logic (Core Engine)
The continuous rotation Engine entirely bypasses the need for resource-heavy Cron-jobs or background workers. It resolves mathematically on-the-fly during the Public `GET` request:
1. **Database Query Stage:** The SQL engine natively filters out content unapproved, lacking a `start_time`/`end_time`, or currently existing outside of those configured active bounds relative to the current server `NOW()`. The retrieved dataset is ordered chronologically by `rotation_order` securely.
2. **Modulo Arithmetic Loop:** The algorithm groups the retrieved array by its generic subject. It calculates the elapsed minutes since the initial `start_time` of that specific subject queue, then sums the total `duration` parameter of all content within that specific block to define the *Cycle Scope*.
3. **Active Iteration Execution:** It utilizes the modulo operator (`elapsedMinutes % totalCycleDuration`) to map precisely which minute of the continuous loop the world clock currently exists in, perfectly identifying exactly which single piece of content owns the active broadcast scope right now.
4. **Fluid Safety Overrides:** Empty databases or completely expired boundaries safely bypass the math returning a 200 OK `{"message": "No content available"}` status rather than an error exception. 

## 6. Database Design Decisions
A highly normalized, 4-tier relational MySQL structure:
- `Users`: Central authentication hub holding roles and hashes.
- `Content`: The raw file repository and metadata vault.
- `ContentSlots` & `ContentSchedule`: Architecturally detaches the conceptual definition of a "rotation block" completely away from the raw file metadata. This design allows infinite files to stack into a single subject slot linearly (`rotation_order`) without ever duplicating data payload tables.
- **Connection Pipeline:** The `mysql2` transaction layer utilizes a Pool configuration (`connectionLimit: 10`) protecting the API from connection bottlenecks during high concurrent load.

## 7. Folder Structure Configuration
Organized via an industry-standard Express.js implementation:
- `/controllers`: Houses the raw procedural logic, SQL parsing, and algorithmic math (The Brain).
- `/routes`: Declares mapping contexts and forwards raw HTTP inputs to their respective controllers.
- `/middlewares`: Offloads isolated global validations like JWT checks and Multer file extractions natively.
- `/utils`: Houses external Database connectivity mechanisms and the automated initialization script.

## 8. Middleware Usage Strategy
- Core environment parsers (`cors`, `express.json`) map initial headers efficiently.
- `authenticate` securely slices Bearer Tokens decoupled completely from business endpoints.
- `authorize` catches permission violations instantly to avoid spinning up unnecessary DB resources.
- `multer` cleanly offloads multi-part binary transformations preventing main-thread asynchronous blocking.
- `express-rate-limit` brackets the Public broadcast routes explicitly protecting from targeted polling exhaustion logic (Bonus Feature).

## 9. Scalability Approach (Caching & Queues)
- **Zero-Process Architecture:** By utilizing declarative mathematical modulo operations on timestamps over Node `child_processes` or Cron Jobs, horizontal containerization scales perfectly. There is zero state drift or overlapping clock errors if deployed across 10 identical Kubernetes instances simultaneously. 
- **Future Flexibility:** The `/content/live/:teacherId` architecture explicitly calculates an `active_until_minutes` property on output. This allows seamless future refactoring to implement a **Redis Cache** relying natively on a TTL identical to this pre-calculated remaining duration perfectly optimizing database hit limits.

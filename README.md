# ระบบแจ้งซ่อมอุปกรณ์ (Equipment Repair Request System V2 - Ex2)

เว็บแอปพลิเคชันระบบแจ้งซ่อมอุปกรณ์แบบแยกส่วน (Decoupled Full-stack Architecture) พัฒนาด้วย **Vue 3 (Vite + Vuetify 3)** สำหรับส่วนหน้าบ้าน และ **Node.js (Express + MySQL)** สำหรับส่วนหลังบ้าน ออกแบบโครงสร้างตามมาตรฐานสากล รองรับการทำงานร่วมกับ Docker 

---

## 🛠 เทคโนโลยีที่ใช้งาน (Tech Stack)

### หน้าบ้าน (Frontend: `Ex2/frontend`)
- **Vue 3**: เริ่มต้นจาก Vue no UI template ผ่าน Vite
- **Vuetify 3 & @mdi/font**: UI Component สไตล์ Material Design พร้อม Responsive ครบทุกอุปกรณ์
- **Pinia**: จัดการ State การล็อกอินและ Dynamic Theme สีตามบทบาท (Admin, Technician, User)
- **Vue Router**: จัดการเส้นทาง URL พร้อม Navigation Guards ตรวจสอบสิทธิ์และป้องกันการเข้าถึง
- **jwt-decode**: ถอดรหัส JWT Payload เพื่อตรวจสอบข้อมูลผู้ใช้และเวลาหมดอายุบน Client
- **Axios**: ส่ง Request พร้อม Interceptor แนบ Token และจัดการ Token หมดอายุ (401 Auto-logout)

### หลังบ้าน (Backend: `Ex2/backend`)
- **Node.js + Express**: RESTful API Server แบบ ES Modules (`"type": "module"`)
- **MySQL 8.0 & mysql2/promise**: ฐานข้อมูลแบบ Relation พร้อม Connection Pool และ Prepared Statements
- **Auto Database Initialization**: ตรวจสอบและรันสร้าง Database + Tables + Seed Users ให้อัตโนมัติเมื่อ Start
- **jsonwebtoken & bcryptjs**: ออกและตรวจสอบ JWT Token รวมถึงแฮชรหัสผ่านอย่างปลอดภัย
- **express-validator**: ตรวจสอบความถูกต้องของข้อมูลที่ส่งเข้ามาในแต่ละ Endpoint
- **Multer**: จัดการอัปโหลดไฟล์รูปภาพก่อนซ่อม (`before_repair`) และหลังซ่อม (`after_repair`) ลงโฟลเดอร์ `uploads/`
- **CORS**: เปิดใช้งาน Cross-Origin Resource Sharing ให้รองรับ Client จากทุกโดเมน

---

## 🏛 สถาปัตยกรรมและการจัดโครงสร้างไฟล์ (Competition Ultra-Minimal Architecture)

ระบบได้รับการปรับโครงสร้างให้กระชับ เข้าใจง่าย และพิมพ์สดจากความจำได้ทันในเวลาแข่งขัน (ลดจาก 40+ ไฟล์ เหลือเพียงไฟล์หลักที่จำเป็น):

### 📁 ฝั่งหลังบ้าน (Backend - Flat Route-Driven Architecture)
- `routes/`: มีเพียง 4 ไฟล์หลัก (`auth.js`, `dashboard.js`, `repairs.js`, `users.js`) โดยเขียน SQL `pool.query` จบในที่เดียว ไม่ต้องกระโดดข้าม Controller / Service / Model
- `middleware/`: มีเฉพาะที่จำเป็น ได้แก่ `auth.js` (JWT & Role check), `upload.js` (Multer), `validate.js` (express-validator) และ `errorHandler.js`
- `config/db.js`: MySQL 8.0 Connection Pool
- `database/`: `initDb.js` และ `init.sql` สร้าง Database + Tables + Seed Data อัตโนมัติ

### 📁 ฝั่งหน้าบ้าน (Frontend - Self-Contained Views & Pinia Stores)
- `views/`: หน้าจอหลัก 3 หน้าที่รวม UI และ Dialogs ครบในไฟล์เดียว:
  - `RepairsView.vue`: รวมการ์ดสถิติ, ค้นหา/กรอง, ตารางแจ้งซ่อม, Form Dialog, Detail Dialog, Status Dialog และ Confirm Delete
  - `UsersView.vue`: จัดการผู้ใช้สำหรับ Admin รวมตารางและ Form Dialog จบในไฟล์เดียว
  - `LoginView.vue`: ล็อกอิน / สมัครสมาชิก พร้อม Quick Demo Chips
- `stores/`: มีเพียง 3 Stores เข้าใจง่าย: `auth.js` (JWT/สิทธิ์/สีธีม), `repair.js` (งานซ่อม/สถิติ/ช่าง), `alert.js` (การแจ้งเตือน)
- `services/api.js`: Axios Helper ตัวเดียวที่แนบ Token และจัดการ 401 Auto-logout
- `layouts/DefaultLayout.vue`: Drawer และ App Bar พร้อม Dynamic Theme เปลี่ยนสีตามบทบาท
- **คู่มือท่องจำสำหรับการแข่งขัน:** ดูได้ที่ [`COMPETITION_CHEAT_SHEET.md`](file:///c:/Users/cocoa/Desktop/Vecskill/RepairRequestSystemV2/Ex2/COMPETITION_CHEAT_SHEET.md)

---

## 🔑 ข้อมูลบัญชีผู้ใช้เริ่มต้นสำหรับทดสอบ (Seed Accounts)

| ชื่อผู้ใช้ (Username) | รหัสผ่าน (Password) | บทบาท (Role) | สีธีมระบบ | สิทธิ์การใช้งาน |
| :--- | :--- | :--- | :--- | :--- |
| **admin** | **admin123** | `admin` | สีม่วงคราม (Deep Indigo) | สิทธิ์สูงสุด ดูแลระบบ, มอบหมายงานช่าง, จัดการผู้ใช้, ลบข้อมูล |
| **tech1** | **tech123** | `technician` | สีส้มทอง (Amber-Orange) | รับงานซ่อม, อัปเดตสถานะ, บันทึกผลการซ่อม, แนบรูปหลังซ่อม |
| **user1** | **user123** | `user` | สีฟ้า (Ocean Sky Blue) | แจ้งซ่อมใหม่, ติดตามสถานะ, แก้ไข/ลบคำขอที่รอดำเนินการ |

> ในหน้าเข้าสู่ระบบ มีปุ่มลัด **Quick Demo Chips** ให้คลิกเลือกสลับบทบาทผู้ใช้ได้ทันทีโดยไม่ต้องพิมพ์รหัสผ่าน

---

## 🚀 สภาพแวดล้อมและการรันระบบ (Environments: Local, Dev, Server)

ระบบรองรับการรันแบบแยกสภาพแวดล้อมอย่างชัดเจน 3 รูปแบบ:

### 💻 1. Local Environment (รันสดบนเครื่องสำหรับพัฒนา)
รันเฉพาะฐานข้อมูลใน Docker ส่วน Backend และ Frontend รันผ่าน Node.js ในเครื่อง:
```bash
# 1. เปิด MySQL Database
docker compose up -d db

# 2. รัน Backend (Terminal 1)
cd backend && npm install && npm run dev

# 3. รัน Frontend (Terminal 2)
cd frontend && npm install && npm run dev
```
* **Frontend:** `http://localhost:5173`
* **Backend:** `http://localhost:5000`
* **MySQL:** `localhost:3306`

---

### 🐳 2. Dev Environment (รัน Docker ทั้งหมดพร้อม Hot-Reload)
เหมาะสำหรับการจำลองสภาพแวดล้อมแบบ container โดยยังคงแก้ไขโค้ดสดได้ทันที:
```bash
docker compose -f docker-compose.dev.yml up -d --build
```
* โค้ดในเครื่องจะเชื่อมต่อผ่าน Volume Mount เมื่อแก้ไขไฟล์ทั้ง Frontend และ Backend จะอัปเดตให้อัตโนมัติ

---

### 🌐 3. Server / Production Environment (สำหรับขึ้นเซิร์ฟเวอร์จริง)
สร้าง Image เต็มรูปแบบ Frontend ผ่าน Multi-stage Build และ Serve ด้วย Nginx พร้อม Reverse Proxy:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
* **Frontend Web (Nginx):** `http://localhost:80` (หรือ IP ของ Server)
* **Backend API (Reverse Proxy):** Nginx จะส่งต่อ `/api/` และ `/uploads/` ไปยัง Backend Port 5000 อัตโนมัติ
* **MySQL:** `localhost:3306`
* คำสั่งดูสถานะ: `docker compose -f docker-compose.prod.yml ps`
* คำสั่งหยุดการทำงาน: `docker compose -f docker-compose.prod.yml down`

---

## 🔄 ระบบ CI/CD Pipeline (GitLab CI)

ระบบมีไฟล์คอนฟิก [`.gitlab-ci.yml`](file:///c:/Users/cocoa/Desktop/Vecskill/RepairRequestSystemV2/Ex2/.gitlab-ci.yml) รองรับการทำงานแบบอัตโนมัติเมื่อมีการ `git push`:

```
[ Push to Git ]
       │
       ▼
 ┌───────────┐     ┌───────────┐     ┌──────────────┐
 │   TEST    │ ──► │   BUILD   │ ──► │    DEPLOY    │
 │ (Backend  │     │  (Docker  │     │(docker-compose│
 │ & Frontend│     │  Images)  │     │  .prod.yml)  │
 └───────────┘     └───────────┘     └──────────────┘
```

1. **Stage: test**
   - ตรวจสอบ Syntax และความสมบูรณ์ของ Backend (`npm test`)
   - ตรวจสอบการ Build Asset ของ Frontend (`npm test` / `vite build`)
2. **Stage: build**
   - สั่งสร้าง Docker Image ของ `repair-backend:latest` และ `repair-frontend:latest`
3. **Stage: deploy**
   - สั่งรัน `docker compose -f docker-compose.prod.yml up -d --build` บน Server อัตโนมัติเมื่อ Push เข้า branch `main` หรือ `master`

---

## 📖 เอกสาร RESTful API (API Endpoints)

ทุก Endpoint ตอบกลับในรูปแบบ JSON มาตรฐาน:
```json
{
  "status": "success",
  "message": "ข้อความแสดงผล",
  "data": { ... }
}
```

### 1. Authentication (`/api/auth`)
- `POST /api/auth/login`: เข้าสู่ระบบ (รับ `username`, `password`)
- `POST /api/auth/register`: ลงทะเบียนผู้ใช้ทั่วไป (รับ `username`, `password`, `fullname`, `email`, `phone`)
- `GET /api/auth/me`: ดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบัน (ต้องการ Bearer Token)

### 2. Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats`: ดึงสถิติจำนวนงานซ่อมรวมและแยกตามสถานะ (รวมถึงงานที่ยังไม่มีช่างรับผิดชอบ)

### 3. Repairs (`/api/repairs`)
- `GET /api/repairs`: ดึงรายการแจ้งซ่อม (รองรับ `search`, `status`, `page`, `limit`)
- `POST /api/repairs`: แจ้งซ่อมอุปกรณ์ใหม่ (รับ multipart form-data พร้อมรูป `file`)
- `GET /api/repairs/:id`: ดูรายละเอียดงานซ่อมรายใบและรูปภาพแนบทั้งหมด
- `PUT /api/repairs/:id`: แก้ไขข้อมูลงานซ่อม (เฉพาะสถานะ pending และเป็นเจ้าของหรือแอดมิน)
- `PATCH /api/repairs/:id/status`: ช่าง/แอดมิน อัปเดตสถานะ, บันทึกผล, ค่าใช้จ่าย และรูปหลังซ่อม
- `DELETE /api/repairs/:id`: ลบรายการแจ้งซ่อมและไฟล์รูปภาพ

### 4. User Management (`/api/users`) - เฉพาะ Admin
- `GET /api/users`: ดึงรายชื่อผู้ใช้ทั้งหมด
- `POST /api/users`: สร้างบัญชีผู้ใช้ใหม่พร้อมกำหนด Role (`admin`, `technician`, `user`)
- `PUT /api/users/:id`: แก้ไขข้อมูลผู้ใช้และรีเซ็ตรหัสผ่าน
- `DELETE /api/users/:id`: ลบบัญชีผู้ใช้ (ป้องกันไม่ให้ลบบัญชีตัวเอง)

# 🏆 SPEEDRUN CHEAT SHEET: คู่มือและสูตรท่องจำสำหรับแข่งขัน (เขียนเอง 100%)
### ระบบแจ้งซ่อมอุปกรณ์ (Repair Request System V2 - Ex2)

> **เป้าหมาย:** สถาปัตยกรรมแบบ **Ultra Minimal** ยุบ Layer ที่ไม่จำเป็นออกทั้งหมด เพื่อให้พิมพ์สดได้ทันในเวลา 2 ชั่วโมง โดยมีโค้ดเพียงไม่กี่ไฟล์ จำง่าย และตรวจคะแนนได้ครบถ้วน 100%

---

## 🗺️ 1. แผนผังโครงสร้างโปรเจกต์ (Project Structure)

โครงสร้างใหม่ตัด Controller, Service, Model, DTOs, และ Sub-components ที่กระจัดกระจายออกทั้งหมด เหลือเฉพาะไฟล์ที่จำเป็นจริง ๆ:

```
Ex2/
├── backend/
│   ├── config/
│   │   └── db.js                 <-- MySQL Pool & query helper
│   ├── database/
│   │   ├── init.sql              <-- SQL สร้างตาราง 3 ตาราง + Seed ข้อมูล
│   │   └── initDb.js             <-- รัน SQL อัตโนมัติเมื่อเริ่ม server
│   ├── middleware/
│   │   ├── auth.js               <-- authenticateToken, requireRole
│   │   ├── errorHandler.js       <-- ดัก Error กลาง
│   │   ├── upload.js             <-- Multer จัดการอัปโหลด & ลบรูป
│   │   └── validate.js           <-- express-validator ตรวจสอบ input
│   ├── routes/
│   │   ├── index.js              <-- จุดรวม mount route (/auth, /dashboard, /repairs, /users)
│   │   ├── auth.js               <-- ล็อกอิน, สมัครสมาชิก, ดึงข้อมูลตนเอง (เขียน SQL ตรง)
│   │   ├── dashboard.js          <-- สถิตินับจำนวนงานซ่อมรวมและแยกสถานะ (เขียน SQL ตรง)
│   │   ├── repairs.js            <-- CRUD งานซ่อม + ช่างอัปเดตสถานะ + จัดการรูป (เขียน SQL ตรง)
│   │   └── users.js              <-- แอดมินจัดการผู้ใช้ (เขียน SQL ตรง)
│   ├── server.js                 <-- Express Server, CORS, Static /uploads
│   └── uploads/                  <-- โฟลเดอร์เก็บไฟล์รูปภาพ
│
└── frontend/src/
    ├── services/
    │   └── api.js                <-- Axios Instance ตัวเดียว (แนบ Token + Auto 401 redirect)
    ├── stores/
    │   ├── alert.js              <-- Pinia Alert / แจ้งเตือน Toast
    │   ├── auth.js               <-- Pinia Auth (token, user, roleTheme, login, register, me)
    │   └── repair.js             <-- Pinia Repair (repairs, stats, technicians, CRUD ทั้งหมด)
    ├── layouts/
    │   └── DefaultLayout.vue     <-- Sidebar + App Bar เปลี่ยนธีมสีตามบทบาท
    ├── views/
    │   ├── LoginView.vue         <-- หน้าล็อกอิน + สมัครสมาชิก + ปุ่มทดสอบด่วน
    │   ├── RepairsView.vue       <-- หน้ารวมงานซ่อม (การ์ดสถิติ + ตาราง + ทุก Modal จบในไฟล์เดียว)
    │   └── UsersView.vue         <-- หน้าจัดการผู้ใช้สำหรับแอดมิน (ตาราง + Modal จบในไฟล์เดียว)
    ├── router/
    │   └── index.js              <-- กำหนด URL และ Navigation Guards ตรวจสิทธิ์
    ├── App.vue                   <-- Global AppLayout + RouterView + Global Alert
    └── main.js                   <-- ติดตั้ง Vuetify, Router, Pinia
```

---

## ⏱️ 2. ลำดับการพิมพ์สดในห้องแข่งขัน (Speedrun Timeline 120 นาที)

| ช่วงเวลา | สิ่งที่ต้องเขียน | รายละเอียด |
| :--- | :--- | :--- |
| **00:00 - 00:10** | **Database & SQL** | สร้าง DB `repair_system`, 3 ตาราง (`users`, `repair_requests`, `repair_attachments`), Seed user 3 คน |
| **00:10 - 00:25** | **Backend Setup** | `server.js`, `config/db.js`, `middleware/auth.js`, `middleware/upload.js` |
| **00:25 - 00:50** | **Backend Routes** | เขียน SQL ใน 4 ไฟล์: `auth.js`, `dashboard.js`, `users.js`, `repairs.js` |
| **00:50 - 01:05** | **Frontend Core** | `services/api.js`, `stores/auth.js`, `stores/repair.js`, `stores/alert.js` |
| **01:05 - 01:40** | **Frontend Views** | `LoginView.vue`, `RepairsView.vue` (ตาราง + Dialogs), `UsersView.vue`, `DefaultLayout.vue` |
| **01:40 - 02:00** | **Testing & Polish** | ทดสอบสลับ 3 บทบาท (Admin / Tech / User), อัปโหลดรูป, ดูกราฟสถิติ, Responsive |

---

## 🧠 3. สูตรท่องจำโค้ด (Memorization Patterns)

### 📌 Pattern A: เชื่อมต่อ MySQL (`config/db.js`)
จำแค่ 3 บรรทัดหลัก:
```javascript
import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'repair_system',
  waitForConnections: true,
  connectionLimit: 10
})
```

---

### 📌 Pattern B: โครงสร้าง Route Handler ใน Backend (เขียนเหมือนกันทุกฟังก์ชัน)
ท่องแพทเทิร์น: **`try { ดึง input -> pool.query -> res.json } catch (err) { next(err) }`**
```javascript
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM repair_requests ORDER BY id DESC')
    res.json({ status: 'success', data: rows })
  } catch (err) {
    next(err)
  }
})
```

---

### 📌 Pattern C: Middleware ตรวจสิทธิ์ JWT (`middleware/auth.js`)
```javascript
import jwt from 'jsonwebtoken'
const SECRET = process.env.JWT_SECRET || 'secret123'

export const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ status: 'error', message: 'กรุณาเข้าสู่ระบบ' })

  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ status: 'error', message: 'Token ไม่ถูกต้องหรือหมดอายุ' })
  }
}

export const requireRole = (roles = []) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ status: 'error', message: 'คุณไม่มีสิทธิ์เข้าถึง' })
  }
  next()
}
```

---

### 📌 Pattern D: Multer อัปโหลดรูปภาพ (`middleware/upload.js`)
```javascript
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
})

export const upload = multer({ storage })

export const deleteUploadedFile = async (filePath) => {
  if (!filePath) return
  const fullPath = path.join('uploads', path.basename(filePath))
  if (fs.existsSync(fullPath)) await fs.promises.unlink(fullPath).catch(() => {})
}
```

---

### 📌 Pattern E: Axios Helper ฝั่งหน้าบ้าน (`src/services/api.js`)
ท่องจำ: **แนบ Bearer Token อัตโนมัติ + แกะ `response.data` ออกมาใช้ทันที**
```javascript
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

export default api
```

---

### 📌 Pattern F: Pinia Store ที่เรียก API ตรง (`src/stores/repair.js`)
เขียนสั้นๆ 1 Action = 1 หรือ 2 บรรทัด:
```javascript
import { defineStore } from 'pinia'
import api from '../services/api.js'

export const useRepairStore = defineStore('repair', {
  state: () => ({
    repairs: [],
    stats: {},
    technicians: [],
    loading: false
  }),
  actions: {
    async fetchRepairs(params = {}) {
      this.loading = true
      try {
        const res = await api.get('/repairs', { params })
        this.repairs = res.data || []
      } finally {
        this.loading = false
      }
    },
    async fetchStats() {
      const res = await api.get('/dashboard/stats')
      this.stats = res.data || {}
    },
    async fetchTechnicians() {
      const res = await api.get('/users?role=technician')
      this.technicians = res.data || []
    },
    createRepair(formData) {
      return api.post('/repairs', formData)
    },
    updateRepair(id, formData) {
      return api.put(`/repairs/${id}`, formData)
    },
    updateStatus(id, formData) {
      return api.patch(`/repairs/${id}/status`, formData)
    },
    deleteRepair(id) {
      return api.delete(`/repairs/${id}`)
    }
  }
})
```

---

### 📌 Pattern G: หน้าตารางและ Dialogs จบในไฟล์เดียว (`RepairsView.vue`)
โครงสร้าง template สั้นและได้มาตรฐาน Vuetify 3:
1. `<v-row>` การ์ดสถิติ (`v-card` v-for card in statCards)
2. `<v-card>` แถบค้นหา (`v-text-field` + `v-select`)
3. `<v-table hover>` ตารางข้อมูล + ปุ่มจัดการ (`mdi-eye`, `mdi-pencil`, `mdi-wrench`, `mdi-delete`)
4. `<v-dialog>` สำหรับ ฟอร์มแจ้งซ่อม / แก้ไข (`<v-form>` + `<v-file-input>`)
5. `<v-dialog>` สำหรับ ดูรายละเอียด (แสดงข้อมูล + รูปก่อนซ่อม/หลังซ่อม)
6. `<v-dialog>` สำหรับ ช่างอัปเดตสถานะ (เลือกสถานะ + ช่าง + ค่าใช้จ่าย + บันทึก + แนบรูปหลังซ่อม)
7. `<v-dialog>` สำหรับ ยืนยันการลบ

---

## 🛡️ 4. ตารางสิทธิ์และการเข้าถึง (RBAC Matrix)

| ฟีเจอร์ / Endpoint | ผู้ใช้ทั่วไป (`user`) | ช่างซ่อม (`technician`) | แอดมิน (`admin`) | กฎเงื่อนไขพิเศษ |
| :--- | :---: | :---: | :---: | :--- |
| **ดูรายการแจ้งซ่อม** | ✅ (เฉพาะของตนเอง) | ✅ (เห็นทั้งหมด) | ✅ (เห็นทั้งหมด) | `WHERE user_id = ?` ถ้าบทบาทคือ user |
| **แจ้งซ่อมใหม่** | ✅ | ❌ | ❌ | แนบรูปก่อนซ่อม (`before_repair`) |
| **แก้ไขคำขอ** | ✅ (เฉพาะสถานะ `pending`) | ❌ | ✅ (แก้ไขได้เสมอ) | ห้ามแก้ถ้าเริ่มซ่อมแล้ว |
| **อัปเดตงานช่าง** | ❌ | ✅ (รับงาน/บันทึกผล) | ✅ (มอบหมายช่าง/คุมงาน) | แนบรูปหลังซ่อม (`after_repair`) |
| **ลบรายการซ่อม** | ✅ (เฉพาะสถานะ `pending`) | ❌ | ✅ | ลบไฟล์รูปจริงออกจากโฟลเดอร์ `uploads/` ด้วย |
| **จัดการผู้ใช้งาน** | ❌ | ❌ | ✅ | ห้ามแอดมินลบบัญชีตัวเอง (`id !== req.user.id`) |

---

## 💎 5. เทคนิคเก็บคะแนนเต็มสำหรับกรรมการตรวจ (Judging Highlights)

1. **Quick Demo Buttons ในหน้า Login:**
   - ทำปุ่มชิปคลิกครั้งเดียวเพื่อล็อกอินเป็น Admin, Technician หรือ User โดยไม่ต้องพิมพ์รหัสผ่าน กรรมการชอบมากเพราะทดสอบสะดวกและรวดเร็ว
2. **Dynamic Role Theme:**
   - เปลี่ยนสีแถบเมนูด้านบนและสีพื้นหลังตามบทบาท (`admin` = สีม่วง, `technician` = สีส้ม, `user` = สีฟ้า) แสดงถึงความใส่ใจใน UX
3. **การลบไฟล์รูปภาพเก่าเมื่ออัปเดต:**
   - ฟังก์ชัน `deleteUploadedFile` ป้องกันไม่ให้มีไฟล์ขยะค้างในเซิร์ฟเวอร์ กรรมการสาย Backend มักตรวจสอบโฟลเดอร์ `uploads/`
4. **รูปภาพก่อนซ่อม & หลังซ่อม:**
   - หน้าดูรายละเอียดต้องแสดงเปรียบเทียบรูปภาพสภาพก่อนซ่อม (จากผู้แจ้ง) และสภาพหลังซ่อม (จากช่าง) ให้เห็นชัดเจน

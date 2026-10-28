// ==============================================================================
// ไฟล์หลักเริ่มต้นระบบ Backend Server (Express Application Entrypoint)
// หน้าที่: รวมศูนย์ Middleware, จัดการ Static Files, เชื่อมต่อ Routes และเริ่มต้น Database
// ==============================================================================

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { initDb } from './database/initDb.js'
import apiRouter from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'

// โหลดค่าตัวแปรสภาพแวดล้อมจากไฟล์ .env
dotenv.config()

// แปลง URL โมดูล ES ให้เป็น Path โฟลเดอร์บนเครื่องจริง
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// ------------------------------------------------------------------------------
// 1. ท่อประมวลผลคำขอระดับโกลบอล (Global Middlewares)
// ------------------------------------------------------------------------------

// เปิดให้ Frontend ข้ามโดเมนเรียกใช้งานได้ (Cross-Origin Resource Sharing) พร้อมแนบ Cookie/Auth Header
app.use(
  cors({
    origin: true,
    credentials: true
  })
)

// แปลงข้อมูล Request Body ในรูปแบบ JSON และ Form URL-Encoded ให้เป็น Object ใน req.body อัตโนมัติ
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ------------------------------------------------------------------------------
// 2. ให้บริการไฟล์รูปภาพที่อัปโหลด (Static File Serving)
// ------------------------------------------------------------------------------
// ผู้ใช้งานสามารถเปิดดูรูปภาพก่อน/หลังซ่อมได้โดยตรงผ่าน URL เช่น /uploads/xxx.jpg
const uploadsPath = path.join(__dirname, 'uploads')
app.use('/uploads', express.static(uploadsPath))
app.use('/api/uploads', express.static(uploadsPath))

// ------------------------------------------------------------------------------
// 3. รวมเส้นทาง API ทั้งหมด (Mount API Routes)
// ------------------------------------------------------------------------------
// รวม Endpoint ทั้งหมดไว้ใต้ Prefix "/api" เช่น /api/auth, /api/repairs, /api/users
app.use('/api', apiRouter)

// ------------------------------------------------------------------------------
// 4. ดักจับเส้นทางที่ไม่พบ (404 Not Found Handler)
// ------------------------------------------------------------------------------
// หากมีการเรียก URL หรือ Method ที่ไม่ได้กำหนดไว้ในระบบ จะส่ง JSON แจ้งเตือนกลับไป
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `ไม่พบ API Endpoint: [${req.method}] ${req.originalUrl}`
  })
})

// ------------------------------------------------------------------------------
// 5. ตัวจัดการข้อผิดพลาดส่วนกลาง (Centralized Error Handler)
// ------------------------------------------------------------------------------
// ดักจับ Error ที่หลุดออกมาจาก try-catch เพื่อป้องกันไม่ให้เซิร์ฟเวอร์หยุดทำงาน (Crash)
app.use(errorHandler)

// ------------------------------------------------------------------------------
// 6. เริ่มต้นเซิร์ฟเวอร์และตรวจเช็คฐานข้อมูล (Server Startup & DB Init)
// ------------------------------------------------------------------------------
app.listen(PORT, async () => {
  console.log(`🚀 เซิร์ฟเวอร์ Backend พร้อมทำงานที่ http://localhost:${PORT}`)
  // ตรวจสอบและสร้างฐานข้อมูลพร้อมข้อมูลผู้ใช้เริ่มต้น (Seed Data) อัตโนมัติเมื่อเริ่มระบบ
  await initDb()
})

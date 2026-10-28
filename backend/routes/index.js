// ==============================================================================
// ศูนย์รวมเส้นทาง API ทั้งหมดของระบบ (Master API Router)
// หน้าที่: รวม Router ย่อยของแต่ละโมดูล (/auth, /dashboard, /repairs, /users)
//         และกำหนด Endpoint สำหรับตรวจสอบสถานะการทำงานของเซิร์ฟเวอร์ (/health)
// ==============================================================================

import express from 'express'
import authRouter from './auth.js'
import dashboardRouter from './dashboard.js'
import repairsRouter from './repairs.js'
import usersRouter from './users.js'

const apiRouter = express.Router()

// ------------------------------------------------------------------------------
// 1. จุดตรวจสอบสถานะเซิร์ฟเวอร์ (Health Check Endpoint)
// ------------------------------------------------------------------------------
// เรียกผ่าน GET /api/health เพื่อให้ระบบ Monitor, Docker หรือ CI/CD ตรวจสอบว่า API ยังทำงานอยู่
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'เซิร์ฟเวอร์ Backend ทำงานเป็นปกติ (Running)',
    timestamp: new Date().toISOString()
  })
})

// ------------------------------------------------------------------------------
// 2. แยกและกระจายเส้นทางไปยังโมดูลย่อย (Sub-route Modules)
// ------------------------------------------------------------------------------
// ระบบยืนยันตัวตน เข้าสู่ระบบ / ลงทะเบียน -> /api/auth
apiRouter.use('/auth', authRouter)

// ระบบสรุปสถิติจำนวนงานซ่อมภาพรวม -> /api/dashboard
apiRouter.use('/dashboard', dashboardRouter)

// ระบบจัดการคำขอแจ้งซ่อมและอัปเดตสถานะ -> /api/repairs
apiRouter.use('/repairs', repairsRouter)

// ระบบจัดการข้อมูลผู้ใช้งานสำหรับแอดมิน -> /api/users
apiRouter.use('/users', usersRouter)

export default apiRouter

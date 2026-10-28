// ==============================================================================
// เส้นทาง API สำหรับระบบยืนยันตัวตน (Authentication Routes)
// หน้าที่: จัดการการเข้าสู่ระบบ (Login), ลงทะเบียนผู้ใช้ใหม่ (Register),
//         และการดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบันจาก Token (Get Me)
// ==============================================================================

import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'
import { validateLogin, validateRegister } from '../middleware/validate.js'

const router = express.Router()

// ดึงการตั้งค่า JWT Secret Key และเวลาหมดอายุของ Token จาก Environment
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key_repair_request_system_2026'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

// ------------------------------------------------------------------------------
// 1. เข้าสู่ระบบ (POST /api/auth/login)
// ------------------------------------------------------------------------------
// ขั้นตอนการทำงาน:
//   1. รับ username และ password จาก body
//   2. ค้นหาข้อมูลผู้ใช้ในตาราง users ตาม username
//   3. เปรียบเทียบรหัสผ่านที่ส่งมากับรหัสผ่านที่ถูกแฮชไว้ใน DB ด้วย bcrypt.compare()
//   4. หากถูกต้อง จะออก JWT Token บรรจุ id, username, role และตอบกลับไปยัง Client
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { username, password } = req.body

    // ค้นหาบัญชีผู้ใช้ในฐานข้อมูล
    const [users] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username])

    if (!users.length) {
      return res.status(401).json({ status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
    }

    const user = users[0]

    // ตรวจสอบความถูกต้องของรหัสผ่าน
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
    }

    // สร้างข้อมูลส่วนบุคคลที่จะฝากไว้ใน Token (Payload)
    const payload = {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      role: user.role,
      email: user.email
    }

    // ออก JSON Web Token (JWT) เพื่อให้ Client นำไปใช้ใน Header Authorization
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    res.json({
      status: 'success',
      message: 'เข้าสู่ระบบสำเร็จ',
      data: { token, user: payload }
    })
  } catch (err) {
    next(err)
  }
})

// ------------------------------------------------------------------------------
// 2. ลงทะเบียนผู้ใช้งานทั่วไป (POST /api/auth/register)
// ------------------------------------------------------------------------------
// ขั้นตอนการทำงาน:
//   1. ตรวจสอบว่า username ซ้ำในระบบหรือไม่
//   2. เข้ารหัสผ่านด้วย bcrypt (Salt Rounds = 10)
//   3. บันทึกข้อมูลลงตาราง users โดยกำหนดบทบาทเริ่มต้นเป็น 'user'
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { username, password, fullname, email, phone } = req.body

    // ตรวจสอบความซ้ำซ้อนของชื่อผู้ใช้
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username])
    if (existing.length) {
      return res.status(400).json({ status: 'error', message: 'ชื่อผู้ใช้นี้ถูกใช้งานไปแล้ว กรุณาใช้ชื่ออื่น' })
    }

    // แฮชรหัสผ่านเพื่อความปลอดภัย ไม่บันทึก Plaintext ลงฐานข้อมูลเด็ดขาด
    const hashedPassword = await bcrypt.hash(password, 10)

    // บันทึกบัญชีผู้ใช้ใหม่
    const [result] = await pool.query(
      'INSERT INTO users (username, password, fullname, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, fullname, email || null, phone || null, 'user']
    )

    res.status(201).json({
      status: 'success',
      message: 'ลงทะเบียนสำเร็จ สามารถเข้าสู่ระบบได้ทันที',
      data: {
        id: result.insertId,
        username,
        fullname,
        role: 'user'
      }
    })
  } catch (err) {
    next(err)
  }
})

// ------------------------------------------------------------------------------
// 3. ดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบัน (GET /api/auth/me)
// ------------------------------------------------------------------------------
// ใช้สำหรับดึงข้อมูลล่าสุดของผู้ใช้ที่ล็อกอินอยู่ (ต้องส่ง Bearer Token มาใน Header)
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, fullname, email, phone, role FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    )

    if (!users.length) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูลผู้ใช้ในระบบ' })
    }

    res.json({
      status: 'success',
      message: 'ดึงข้อมูลโปรไฟล์สำเร็จ',
      data: { user: users[0] }
    })
  } catch (err) {
    next(err)
  }
})

export default router

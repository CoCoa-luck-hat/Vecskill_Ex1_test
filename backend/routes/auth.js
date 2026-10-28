import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'
import { validateLogin, validateRegister } from '../middleware/validate.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key_repair_request_system_2026'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { username, password } = req.body
    const [users] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username])

    if (!users.length) {
      return res.status(401).json({ status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
    }

    const user = users[0]
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
    }

    const payload = {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      role: user.role,
      email: user.email
    }

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

// POST /api/auth/register
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { username, password, fullname, email, phone } = req.body

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username])
    if (existing.length) {
      return res.status(400).json({ status: 'error', message: 'ชื่อผู้ใช้นี้ถูกใช้งานไปแล้ว กรุณาใช้ชื่ออื่น' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
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

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, fullname, email, phone, role FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    )

    if (!users.length) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูลผู้ใช้' })
    }

    res.json({
      status: 'success',
      data: { user: users[0] }
    })
  } catch (err) {
    next(err)
  }
})

export default router

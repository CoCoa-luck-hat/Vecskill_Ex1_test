import express from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../config/db.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { validateCreateUser, validateUpdateUser } from '../middleware/validate.js'

const router = express.Router()

// All user management endpoints require login
router.use(authenticateToken)

// GET /api/users (Admin or Technician can list users)
router.get('/', requireRole(['admin', 'technician']), async (req, res, next) => {
  try {
    const { search, role } = req.query
    let sql = 'SELECT id, username, fullname, email, phone, role, created_at FROM users'
    const conditions = []
    const params = []

    if (search) {
      conditions.push('(fullname LIKE ? OR username LIKE ? OR phone LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (role && role !== 'all') {
      conditions.push('role = ?')
      params.push(role)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY id DESC'

    const [rows] = await pool.query(sql, params)
    res.json({
      status: 'success',
      data: rows
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/users (Admin only)
router.post('/', requireRole(['admin']), validateCreateUser, async (req, res, next) => {
  try {
    const { username, password, fullname, role = 'user', email = null, phone = null } = req.body

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username])
    if (existing.length) {
      return res.status(409).json({ status: 'error', message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (username, password, fullname, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, fullname, email || null, phone || null, role]
    )

    res.status(201).json({
      status: 'success',
      message: 'สร้างบัญชีผู้ใช้ใหม่สำเร็จ',
      data: {
        id: result.insertId,
        username,
        fullname,
        role
      }
    })
  } catch (err) {
    next(err)
  }
})

// PUT /api/users/:id (Admin only)
router.put('/:id', requireRole(['admin']), validateUpdateUser, async (req, res, next) => {
  try {
    const { id } = req.params
    const { fullname, email, phone, role, password } = req.body

    const [existing] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id])
    if (!existing.length) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบบัญชีผู้ใช้ที่ต้องการแก้ไข' })
    }

    const currentUser = existing[0]

    if (password && password.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10)
      await pool.query(
        'UPDATE users SET fullname = ?, email = ?, phone = ?, role = ?, password = ? WHERE id = ?',
        [fullname || currentUser.fullname, email !== undefined ? email : currentUser.email, phone !== undefined ? phone : currentUser.phone, role || currentUser.role, hashedPassword, id]
      )
    } else {
      await pool.query(
        'UPDATE users SET fullname = ?, email = ?, phone = ?, role = ? WHERE id = ?',
        [fullname || currentUser.fullname, email !== undefined ? email : currentUser.email, phone !== undefined ? phone : currentUser.phone, role || currentUser.role, id]
      )
    }

    res.json({
      status: 'success',
      message: 'แก้ไขข้อมูลผู้ใช้สำเร็จ'
    })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/users/:id (Admin only)
router.delete('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params
    if (Number(id) === req.user.id) {
      return res.status(400).json({ status: 'error', message: 'ไม่สามารถลบบัญชีผู้ใช้ที่กำลังเข้าสู่ระบบอยู่ได้' })
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE id = ? LIMIT 1', [id])
    if (!existing.length) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบบัญชีผู้ใช้ที่ต้องการลบ' })
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id])

    res.json({
      status: 'success',
      message: 'ลบบัญชีผู้ใช้เรียบร้อยแล้ว'
    })
  } catch (err) {
    next(err)
  }
})

export default router

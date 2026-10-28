// ==============================================================================
// เส้นทาง API สำหรับการจัดการผู้ใช้งานในระบบ (User Management Routes)
// หน้าที่: รองรับการจัดการผู้ใช้สำหรับผู้ดูแลระบบ (Admin CRUD):
//   - GET /: ดึงรายชื่อผู้ใช้ทั้งหมด (ค้นหาและกรองตามบทบาทได้ ช่างและแอดมินดูได้)
//   - POST /: แอดมินสร้างบัญชีผู้ใช้ใหม่และกำหนดบทบาท (admin, technician, user)
//   - PUT /:id: แอดมินแก้ไขข้อมูลผู้ใช้ หรือตั้งรหัสผ่านใหม่
//   - DELETE /:id: แอดมินลบบัญชีผู้ใช้ (มีระบบป้องกันไม่ให้ลบบัญชีตนเอง)
// ==============================================================================

import express from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../config/db.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { validateCreateUser, validateUpdateUser } from '../middleware/validate.js'

const router = express.Router()

// ทุก Endpoint ต้องล็อกอินก่อนเข้าถึง
router.use(authenticateToken)

// ------------------------------------------------------------------------------
// 1. ดึงรายชื่อผู้ใช้งานทั้งหมด (GET /api/users)
// ------------------------------------------------------------------------------
// สิทธิ์: เฉพาะผู้ดูแลระบบ (admin) และ ช่าง (technician)
// รองรับ Query Parameters:
//   - search: ค้นหาจากชื่อ-นามสกุล, ชื่อผู้ใช้ หรือเบอร์โทรศัพท์
//   - role: กรองตามบทบาท เช่น user, technician, admin หรือ all
router.get('/', requireRole(['admin', 'technician']), async (req, res, next) => {
  try {
    const { search, role } = req.query
    // ดึงเฉพาะฟิลด์ที่จำเป็น (ละเว้นฟิลด์ password เพื่อความปลอดภัย)
    let sql = 'SELECT id, username, fullname, email, phone, role, created_at FROM users'
    const conditions = []
    const params = []

    // เงื่อนไขค้นหาตามคำสำคัญ
    if (search) {
      conditions.push('(fullname LIKE ? OR username LIKE ? OR phone LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    // เงื่อนไขกรองตามบทบาท
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
      message: 'ดึงข้อมูลผู้ใช้งานสำเร็จ',
      data: rows
    })
  } catch (err) {
    next(err)
  }
})

// ------------------------------------------------------------------------------
// 2. สร้างบัญชีผู้ใช้งานใหม่ (POST /api/users)
// ------------------------------------------------------------------------------
// สิทธิ์: เฉพาะผู้ดูแลระบบ (admin)
// แอดมินสามารถสร้างบัญชีและกำหนดบทบาทเป็น admin, technician หรือ user ได้โดยตรง
router.post('/', requireRole(['admin']), validateCreateUser, async (req, res, next) => {
  try {
    const { username, password, fullname, role = 'user', email = null, phone = null } = req.body

    // ตรวจสอบความซ้ำซ้อนของชื่อผู้ใช้ (Username)
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username])
    if (existing.length) {
      return res.status(409).json({ status: 'error', message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' })
    }

    // แฮชรหัสผ่านด้วย bcrypt ก่อนบันทึกลงฐานข้อมูล
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

// ------------------------------------------------------------------------------
// 3. แก้ไขข้อมูลผู้ใช้งาน (PUT /api/users/:id)
// ------------------------------------------------------------------------------
// สิทธิ์: เฉพาะผู้ดูแลระบบ (admin)
// หากฟิลด์ password มีการส่งค่ามา ระบบจะแฮชรหัสผ่านใหม่และอัปเดตให้
// หากเว้นว่างไว้ จะคงรหัสผ่านเดิมไว้ ไม่ถูกเขียนทับ
router.put('/:id', requireRole(['admin']), validateUpdateUser, async (req, res, next) => {
  try {
    const { id } = req.params
    const { fullname, email, phone, role, password } = req.body

    // ตรวจสอบว่ามีผู้ใช้นี้ในระบบหรือไม่
    const [existing] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id])
    if (!existing.length) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบบัญชีผู้ใช้ที่ต้องการแก้ไข' })
    }

    const currentUser = existing[0]

    // กรณีแอดมินต้องการรีเซ็ตรหัสผ่านใหม่ให้ผู้ใช้
    if (password && password.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10)
      await pool.query(
        'UPDATE users SET fullname = ?, email = ?, phone = ?, role = ?, password = ? WHERE id = ?',
        [fullname || currentUser.fullname, email !== undefined ? email : currentUser.email, phone !== undefined ? phone : currentUser.phone, role || currentUser.role, hashedPassword, id]
      )
    } else {
      // กรณีไม่เปลี่ยนรหัสผ่าน ให้อัปเดตเฉพาะข้อมูลทั่วไป
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

// ------------------------------------------------------------------------------
// 4. ลบบัญชีผู้ใช้งาน (DELETE /api/users/:id)
// ------------------------------------------------------------------------------
// สิทธิ์: เฉพาะผู้ดูแลระบบ (admin)
// ระบบความปลอดภัย: ป้องกันไม่ให้แอดมินเผลอกดลบบัญชีของตนเองที่กำลังล็อกอินอยู่
router.delete('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params

    // ป้องกันการลบบัญชีตนเอง (Self-deletion prevention)
    if (Number(id) === req.user.id) {
      return res.status(400).json({ status: 'error', message: 'ไม่สามารถลบบัญชีผู้ใช้ที่กำลังเข้าสู่ระบบอยู่ได้' })
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE id = ? LIMIT 1', [id])
    if (!existing.length) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบบัญชีผู้ใช้ที่ต้องการลบ' })
    }

    // ลบบัญชีผู้ใช้ออกจากฐานข้อมูล
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

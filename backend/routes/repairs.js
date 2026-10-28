import express from 'express'
import { pool } from '../config/db.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { upload, deleteUploadedFile } from '../middleware/upload.js'
import { validateCreateRepair, validateUpdateRepair } from '../middleware/validate.js'

const router = express.Router()

// All repairs routes require authentication
router.use(authenticateToken)

// GET /api/repairs
router.get('/', async (req, res, next) => {
  try {
    const { search, status } = req.query
    const conditions = []
    const params = []

    // Regular users see only their own repairs
    if (req.user.role === 'user') {
      conditions.push('r.user_id = ?')
      params.push(req.user.id)
    }

    if (status && status !== 'all') {
      conditions.push('r.status = ?')
      params.push(status)
    }

    if (search) {
      conditions.push('(r.ticket_no LIKE ? OR r.title LIKE ? OR r.equipment_name LIKE ?)')
      const s = `%${search}%`
      params.push(s, s, s)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const sql = `
      SELECT 
        r.*,
        u.fullname as reporter_name,
        u.phone as reporter_phone,
        t.fullname as technician_name,
        (SELECT file_path FROM repair_attachments WHERE repair_id = r.id AND attachment_type = 'before_repair' ORDER BY id DESC LIMIT 1) as before_image,
        (SELECT file_path FROM repair_attachments WHERE repair_id = r.id AND attachment_type = 'after_repair' ORDER BY id DESC LIMIT 1) as after_image
      FROM repair_requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users t ON r.technician_id = t.id
      ${whereClause}
      ORDER BY r.created_at DESC
    `

    const [rows] = await pool.query(sql, params)
    res.json({
      status: 'success',
      message: 'ดึงรายการแจ้งซ่อมสำเร็จ',
      data: rows
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/repairs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const sql = `
      SELECT 
        r.*,
        u.fullname as reporter_name,
        u.phone as reporter_phone,
        u.email as reporter_email,
        t.fullname as technician_name,
        t.phone as technician_phone
      FROM repair_requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users t ON r.technician_id = t.id
      WHERE r.id = ?
      LIMIT 1
    `
    const [rows] = await pool.query(sql, [id])
    if (!rows.length) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูลการแจ้งซ่อมที่ระบุ' })
    }

    const repair = rows[0]

    // Regular users can only view their own repairs
    if (req.user.role === 'user' && repair.user_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'คุณไม่มีสิทธิ์เข้าถึงรายการนี้' })
    }

    // Attachments
    const [attachments] = await pool.query(
      'SELECT * FROM repair_attachments WHERE repair_id = ? ORDER BY id ASC',
      [id]
    )
    repair.attachments = attachments
    repair.before_image =
      attachments.find(a => a.attachment_type === 'before_repair')?.file_path || null
    repair.after_image =
      attachments.find(a => a.attachment_type === 'after_repair')?.file_path || null

    res.json({
      status: 'success',
      message: 'ดึงรายละเอียดการแจ้งซ่อมสำเร็จ',
      data: repair
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/repairs (Users only)
router.post('/', requireRole(['user']), upload.single('file'), validateCreateRepair, async (req, res, next) => {
  try {
    const {
      equipment_name,
      description = null
    } = req.body
    const title = req.body.title || equipment_name || 'แจ้งซ่อมอุปกรณ์'

    // Generate ticket_no e.g. REP-202610-8472
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const ticket_no = `REP-${dateStr}-${randomSuffix}`

    const [result] = await pool.query(
      `INSERT INTO repair_requests 
       (ticket_no, user_id, equipment_name, title, description, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [ticket_no, req.user.id, equipment_name, title, description || null]
    )

    const repairId = result.insertId

    // If file uploaded, record in repair_attachments
    if (req.file) {
      const filePath = `/uploads/${req.file.filename}`
      await pool.query(
        `INSERT INTO repair_attachments (repair_id, file_name, file_path, file_type, file_size, attachment_type)
         VALUES (?, ?, ?, ?, ?, 'before_repair')`,
        [repairId, req.file.originalname, filePath, req.file.mimetype, req.file.size]
      )
    }

    res.status(201).json({
      status: 'success',
      message: 'สร้างคำขอแจ้งซ่อมเรียบร้อยแล้ว',
      data: {
        id: repairId,
        ticket_no
      }
    })
  } catch (err) {
    next(err)
  }
})

// PUT /api/repairs/:id (Owner while pending or Admin)
router.put('/:id', upload.single('file'), validateUpdateRepair, async (req, res, next) => {
  try {
    const { id } = req.params

    const [rows] = await pool.query('SELECT * FROM repair_requests WHERE id = ? LIMIT 1', [id])
    if (!rows.length) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูลการแจ้งซ่อมที่ต้องการแก้ไข' })
    }

    const current = rows[0]

    if (req.user.role === 'user') {
      if (current.user_id !== req.user.id) {
        return res.status(403).json({ status: 'error', message: 'คุณไม่มีสิทธิ์แก้ไขรายการนี้' })
      }
      if (current.status !== 'pending') {
        return res.status(400).json({ status: 'error', message: 'ไม่สามารถแก้ไขได้เนื่องจากงานซ่อมอยู่ระหว่างดำเนินการแล้ว' })
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'เฉพาะผู้ดูแลระบบหรือเจ้าของคำขอที่รอดำเนินการเท่านั้นที่สามารถแก้ไขได้' })
    }

    const equipment_name = req.body.equipment_name || current.equipment_name
    const title = req.body.title || req.body.equipment_name || current.title
    const description = req.body.description !== undefined ? req.body.description : current.description

    await pool.query(
      `UPDATE repair_requests 
       SET equipment_name = ?, title = ?, description = ?
       WHERE id = ?`,
      [equipment_name, title, description, id]
    )

    // If new file attached, delete previous before_repair and insert new
    if (req.file) {
      const [oldAtts] = await pool.query(
        "SELECT * FROM repair_attachments WHERE repair_id = ? AND attachment_type = 'before_repair'",
        [id]
      )
      for (const att of oldAtts) {
        await deleteUploadedFile(att.file_path)
      }
      await pool.query(
        "DELETE FROM repair_attachments WHERE repair_id = ? AND attachment_type = 'before_repair'",
        [id]
      )

      const filePath = `/uploads/${req.file.filename}`
      await pool.query(
        `INSERT INTO repair_attachments (repair_id, file_name, file_path, file_type, file_size, attachment_type)
         VALUES (?, ?, ?, ?, ?, 'before_repair')`,
        [id, req.file.originalname, filePath, req.file.mimetype, req.file.size]
      )
    }

    res.json({
      status: 'success',
      message: 'อัปเดตข้อมูลการแจ้งซ่อมสำเร็จ',
      data: { id: Number(id) }
    })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/repairs/:id/status (Technician or Admin)
router.patch('/:id/status', requireRole(['technician', 'admin']), upload.single('file'), async (req, res, next) => {
  try {
    const { id } = req.params

    const [rows] = await pool.query('SELECT * FROM repair_requests WHERE id = ? LIMIT 1', [id])
    if (!rows.length) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรายการแจ้งซ่อมที่ระบุ' })
    }

    const current = rows[0]
    const newStatus = req.body.status || current.status
    const technicianNotes = req.body.technician_notes !== undefined ? req.body.technician_notes : current.technician_notes
    const repairCost = req.body.repair_cost !== undefined ? Number(req.body.repair_cost) : current.repair_cost

    let assignedTechId = req.body.technician_id || current.technician_id
    if (req.user.role === 'technician') {
      assignedTechId = current.technician_id || req.user.id
    }

    const completedAt = newStatus === 'completed' ? current.completed_at || new Date() : null

    await pool.query(
      `UPDATE repair_requests
       SET status = ?, technician_id = ?, technician_notes = ?, repair_cost = ?, completed_at = ?
       WHERE id = ?`,
      [newStatus, assignedTechId ? Number(assignedTechId) : null, technicianNotes || null, repairCost, completedAt, id]
    )

    // If after_repair image provided
    if (req.file) {
      const [oldAtts] = await pool.query(
        "SELECT * FROM repair_attachments WHERE repair_id = ? AND attachment_type = 'after_repair'",
        [id]
      )
      for (const att of oldAtts) {
        await deleteUploadedFile(att.file_path)
      }
      await pool.query(
        "DELETE FROM repair_attachments WHERE repair_id = ? AND attachment_type = 'after_repair'",
        [id]
      )

      const filePath = `/uploads/${req.file.filename}`
      await pool.query(
        `INSERT INTO repair_attachments (repair_id, file_name, file_path, file_type, file_size, attachment_type)
         VALUES (?, ?, ?, ?, ?, 'after_repair')`,
        [id, req.file.originalname, filePath, req.file.mimetype, req.file.size]
      )
    }

    res.json({
      status: 'success',
      message: 'อัปเดตสถานะงานซ่อมเรียบร้อยแล้ว',
      data: {
        id: Number(id),
        status: newStatus
      }
    })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/repairs/:id (Owner while pending or Admin)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const [rows] = await pool.query('SELECT * FROM repair_requests WHERE id = ? LIMIT 1', [id])
    if (!rows.length) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรายการแจ้งซ่อมที่ต้องการลบ' })
    }

    const current = rows[0]

    if (req.user.role === 'user') {
      if (current.user_id !== req.user.id) {
        return res.status(403).json({ status: 'error', message: 'คุณไม่มีสิทธิ์ลบรายการนี้' })
      }
      if (current.status !== 'pending') {
        return res.status(400).json({ status: 'error', message: 'ไม่สามารถลบได้เนื่องจากงานซ่อมได้รับการดำเนินการแล้ว' })
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'เฉพาะผู้ดูแลระบบหรือเจ้าของคำขอที่รอดำเนินการเท่านั้นที่สามารถลบได้' })
    }

    // Delete attachment files from disk
    const [attachments] = await pool.query('SELECT * FROM repair_attachments WHERE repair_id = ?', [id])
    for (const att of attachments) {
      await deleteUploadedFile(att.file_path)
    }

    await pool.query('DELETE FROM repair_requests WHERE id = ?', [id])

    res.json({
      status: 'success',
      message: 'ลบรายการแจ้งซ่อมเรียบร้อยแล้ว',
      data: { id: Number(id) }
    })
  } catch (err) {
    next(err)
  }
})

export default router

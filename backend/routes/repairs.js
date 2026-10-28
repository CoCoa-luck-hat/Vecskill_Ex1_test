// ==============================================================================
// เส้นทาง API สำหรับระบบจัดการงานแจ้งซ่อม (Repair Requests Routes)
// หน้าที่: จัดการวงจรงวดงานซ่อมทั้งหมด (CRUD Lifecycle):
//   - GET /: ค้นหาและดูรายการแจ้งซ่อมทั้งหมด (กรองตามสิทธิ์ ผู้ใช้/ช่าง/แอดมิน)
//   - GET /:id: ดูรายละเอียดงานซ่อมรายใบ พร้อมรูปภาพก่อนและหลังซ่อม
//   - POST /: ผู้ใช้ส่งคำขอแจ้งซ่อมใหม่ พร้อมอัปโหลดรูปภาพปัญหา (before_repair)
//   - PUT /:id: แก้ไขข้อมูลคำขอแจ้งซ่อม (เฉพาะสถานะ pending)
//   - PATCH /:id/status: ช่าง/แอดมิน อัปเดตสถานะงาน, บันทึกผล, ค่าใช้จ่าย, รูปหลังซ่อม
//   - DELETE /:id: ลบรายการแจ้งซ่อมและลบไฟล์รูปภาพออกจากเซิร์ฟเวอร์
// ==============================================================================

import express from 'express'
import { pool } from '../config/db.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { upload, deleteUploadedFile } from '../middleware/upload.js'
import { validateCreateRepair, validateUpdateRepair } from '../middleware/validate.js'

const router = express.Router()

// ทุก Route ในส่วนงานซ่อมต้องผ่านการยืนยันตัวตน (ต้องส่ง JWT Token มา)
router.use(authenticateToken)

// ------------------------------------------------------------------------------
// 1. ดึงรายการแจ้งซ่อมทั้งหมด (GET /api/repairs)
// ------------------------------------------------------------------------------
// รองรับ Query Parameters:
//   - search: ค้นหาจากรหัสใบแจ้งซ่อม (ticket_no) หรือชื่ออุปกรณ์ (equipment_name)
//   - status: กรองตามสถานะงาน เช่น pending, in_progress, completed
// สิทธิ์การมองเห็น:
//   - ผู้ใช้ทั่วไป (user): เห็นเฉพาะงานซ่อมของตัวเอง
//   - ช่าง (technician) และ แอดมิน (admin): เห็นงานซ่อมทั้งหมดในระบบ
router.get('/', async (req, res, next) => {
  try {
    const { search, status } = req.query
    const conditions = []
    const params = []

    // หากเป็นผู้ใช้ทั่วไป กรองให้เห็นเฉพาะ user_id ของตนเอง
    if (req.user.role === 'user') {
      conditions.push('r.user_id = ?')
      params.push(req.user.id)
    }

    // กรองตามสถานะงานซ่อม
    if (status && status !== 'all') {
      conditions.push('r.status = ?')
      params.push(status)
    }

    // ค้นหาตามคำสำคัญ (Keyword Search)
    if (search) {
      conditions.push('(r.ticket_no LIKE ? OR r.title LIKE ? OR r.equipment_name LIKE ?)')
      const s = `%${search}%`
      params.push(s, s, s)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // ดึงข้อมูลงานซ่อม พร้อมเชื่อมตาราง (JOIN) ชื่อผู้แจ้ง, ชื่อช่าง, และ Subquery รูปภาพล่าสุด
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

// ------------------------------------------------------------------------------
// 2. ดูรายละเอียดงานซ่อมรายใบ (GET /api/repairs/:id)
// ------------------------------------------------------------------------------
// ดึงข้อมูลคำขอแจ้งซ่อม พร้อมรายการรูปภาพแนบทั้งหมดที่เกี่ยวข้อง
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

    // ตรวจสอบความปลอดภัย: ผู้ใช้ทั่วไปห้ามเปิดดูงานซ่อมของคนอื่น
    if (req.user.role === 'user' && repair.user_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'คุณไม่มีสิทธิ์เข้าถึงรายการนี้' })
    }

    // ดึงรายการรูปภาพแนบทั้งหมดของงานซ่อมนี้ (ทั้งก่อนซ่อมและหลังซ่อม)
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

// ------------------------------------------------------------------------------
// 3. สร้างคำขอแจ้งซ่อมอุปกรณ์ใหม่ (POST /api/repairs)
// ------------------------------------------------------------------------------
// สิทธิ์: เฉพาะผู้ใช้งานทั่วไป (role: 'user')
// รองรับ Multipart Form Data (แนบรูปภาพก่อนซ่อม 1 รูป ฟิลด์ 'file')
router.post('/', requireRole(['user']), upload.single('file'), validateCreateRepair, async (req, res, next) => {
  try {
    const { equipment_name, description = null } = req.body
    const title = req.body.title || equipment_name || 'แจ้งซ่อมอุปกรณ์'

    // สุ่มสร้างรหัสใบแจ้งซ่อมที่ไม่ซ้ำกัน รูปแบบ: REP-ปีเดือน-ตัวเลข4หลัก เช่น REP-202610-8472
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const ticket_no = `REP-${dateStr}-${randomSuffix}`

    // บันทึกคำขอแจ้งซ่อมลงฐานข้อมูล โดยกำหนดสถานะเริ่มต้นเป็น 'pending' (รอดำเนินการ)
    const [result] = await pool.query(
      `INSERT INTO repair_requests 
       (ticket_no, user_id, equipment_name, title, description, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [ticket_no, req.user.id, equipment_name, title, description || null]
    )

    const repairId = result.insertId

    // หากมีการแนบรูปภาพอุปกรณ์ที่มีปัญหาเข้ามา ให้บันทึกลงตาราง repair_attachments
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

// ------------------------------------------------------------------------------
// 4. แก้ไขข้อมูลคำขอแจ้งซ่อม (PUT /api/repairs/:id)
// ------------------------------------------------------------------------------
// เงื่อนไข:
//   - ผู้ใช้ทั่วไปสามารถแก้ไขได้เฉพาะงานของตนเอง และต้องอยู่ในสถานะ 'pending' เท่านั้น
//   - แอดมินสามารถแก้ไขข้อมูลได้ทุกสถานะ
// หากมีการอัปโหลดรูปภาพใหม่ ระบบจะลบไฟล์รูปเก่าออกจากเซิร์ฟเวอร์อัตโนมัติ
router.put('/:id', upload.single('file'), validateUpdateRepair, async (req, res, next) => {
  try {
    const { id } = req.params

    const [rows] = await pool.query('SELECT * FROM repair_requests WHERE id = ? LIMIT 1', [id])
    if (!rows.length) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูลการแจ้งซ่อมที่ต้องการแก้ไข' })
    }

    const current = rows[0]

    // ตรวจสอบสิทธิ์การแก้ไข
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

    // อัปเดตข้อมูลงานซ่อม
    await pool.query(
      `UPDATE repair_requests 
       SET equipment_name = ?, title = ?, description = ?
       WHERE id = ?`,
      [equipment_name, title, description, id]
    )

    // หากมีการแนบรูปภาพใหม่มาแทนที่รูปเดิม ให้ลบไฟล์เก่าออกจากดิสก์และอัปเดตพาธใหม่
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

// ------------------------------------------------------------------------------
// 5. ช่าง/แอดมิน อัปเดตสถานะงานซ่อม (PATCH /api/repairs/:id/status)
// ------------------------------------------------------------------------------
// สิทธิ์: ช่างซ่อม (technician) หรือ ผู้ดูแลระบบ (admin)
// หน้าที่: เปลี่ยนสถานะ (in_progress, waiting_parts, completed, cancelled),
//         บันทึกค่าใช้จ่าย, สรุปผลการซ่อม และแนบรูปภาพหลังซ่อมเสร็จ (after_repair)
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

    // กรณีเป็นช่าง หากยังไม่มีช่างรับงาน ให้กำหนดตนเองเป็นผู้รับผิดชอบงานนี้ทันที
    let assignedTechId = req.body.technician_id || current.technician_id
    if (req.user.role === 'technician') {
      assignedTechId = current.technician_id || req.user.id
    }

    // หากสถานะเป็น 'completed' (เสร็จสิ้น) ให้บันทึกเวลาที่ซ่อมเสร็จ (completed_at)
    const completedAt = newStatus === 'completed' ? current.completed_at || new Date() : null

    await pool.query(
      `UPDATE repair_requests
       SET status = ?, technician_id = ?, technician_notes = ?, repair_cost = ?, completed_at = ?
       WHERE id = ?`,
      [newStatus, assignedTechId ? Number(assignedTechId) : null, technicianNotes || null, repairCost, completedAt, id]
    )

    // หากช่างแนบรูปภาพหลังการซ่อม (after_repair) เข้ามา
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

// ------------------------------------------------------------------------------
// 6. ลบรายการแจ้งซ่อม (DELETE /api/repairs/:id)
// ------------------------------------------------------------------------------
// สิทธิ์:
//   - ผู้ใช้ทั่วไปลบได้เฉพาะงานของตนเอง และต้องอยู่ในสถานะ 'pending' เท่านั้น
//   - แอดมินสามารถลบได้ทุกรายการ
// เมื่อลบ: ระบบจะลบไฟล์รูปภาพทั้งหมดที่เกี่ยวข้องออกจากโฟลเดอร์ uploads บนดิสก์ด้วย
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const [rows] = await pool.query('SELECT * FROM repair_requests WHERE id = ? LIMIT 1', [id])
    if (!rows.length) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรายการแจ้งซ่อมที่ต้องการลบ' })
    }

    const current = rows[0]

    // ตรวจสอบเงื่อนไขความปลอดภัยก่อนลบ
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

    // ลบไฟล์รูปภาพจริงทั้งหมดออกจากดิสก์
    const [attachments] = await pool.query('SELECT * FROM repair_attachments WHERE repair_id = ?', [id])
    for (const att of attachments) {
      await deleteUploadedFile(att.file_path)
    }

    // ลบเรคคอร์ดออกจากฐานข้อมูล (ตาราง attachments จะถูกลบตามด้วย Foreign Key ON DELETE CASCADE)
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

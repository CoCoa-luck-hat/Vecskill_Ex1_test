// ==============================================================================
// เส้นทาง API สำหรับสรุปสถิติภาพรวมแดชบอร์ด (Dashboard Statistics Routes)
// หน้าที่: คำนวณจำนวนงานซ่อมรวมและแยกตามสถานะต่างๆ (Pending, In Progress, ฯลฯ)
//         เพื่อนำไปแสดงผลบนการ์ดสถิติ (Stat Cards) ในหน้าบ้าน
// ==============================================================================

import express from 'express'
import { pool } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// ------------------------------------------------------------------------------
// ดึงข้อมูลสถิติงานซ่อมทั้งหมด (GET /api/dashboard/stats)
// ------------------------------------------------------------------------------
// การทำงานแบ่งตามบทบาท:
//   - ผู้ใช้ทั่วไป (user): เห็นเฉพาะสถิติคำขอแจ้งซ่อมของตนเองเท่านั้น (WHERE user_id = ?)
//   - ช่าง (technician) / ผู้ดูแลระบบ (admin): เห็นสถิติภาพรวมของทั้งองค์กร
//     พร้อมตัวเลขนับงานที่ยังไม่มีช่างรับผิดชอบ (unassigned)
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const isUser = req.user.role === 'user'
    // หากเป็นผู้ใช้ทั่วไป ให้จำกัดดูเฉพาะข้อมูลตนเอง
    const whereClause = isUser ? 'WHERE user_id = ?' : ''
    const params = isUser ? [req.user.id] : []

    // คำนวณสรุปผลสถิติใน Query เดียวด้วยคำสั่ง COUNT และ SUM(CASE WHEN ...)
    // ช่วยประหยัดทรัพยากรฐานข้อมูล ดีกว่าการแยกยิงหลายรอบ
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'waiting_parts' THEN 1 ELSE 0 END) as waiting_parts,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status IN ('cancelled', 'rejected') THEN 1 ELSE 0 END) as cancelled
      FROM repair_requests
      ${whereClause}
    `

    const [rows] = await pool.query(sql, params)
    const stats = rows[0] || {}

    // สำหรับช่างและแอดมิน: ดึงจำนวนงานที่ยังไม่มีช่างรับงาน (technician_id IS NULL)
    // เพื่อให้มองเห็นงานค้างที่ต้องรีบมอบหมายหรือเข้าไปกดรับงาน
    let unassigned = 0
    if (!isUser) {
      const [unassignedRows] = await pool.query(
        "SELECT COUNT(*) as total FROM repair_requests WHERE technician_id IS NULL AND status IN ('pending', 'in_progress')"
      )
      unassigned = Number(unassignedRows[0]?.total || 0)
    }

    res.json({
      status: 'success',
      message: 'ดึงข้อมูลสถิติภาพรวมสำเร็จ',
      data: {
        total: Number(stats.total || 0),
        pending: Number(stats.pending || 0),
        in_progress: Number(stats.in_progress || 0),
        waiting_parts: Number(stats.waiting_parts || 0),
        completed: Number(stats.completed || 0),
        cancelled: Number(stats.cancelled || 0),
        unassigned
      }
    })
  } catch (err) {
    next(err)
  }
})

export default router

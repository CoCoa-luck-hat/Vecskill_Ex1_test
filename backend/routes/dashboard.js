import express from 'express'
import { pool } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const isUser = req.user.role === 'user'
    const whereClause = isUser ? 'WHERE user_id = ?' : ''
    const params = isUser ? [req.user.id] : []

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

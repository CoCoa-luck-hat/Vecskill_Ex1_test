import jwt from 'jsonwebtoken'

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_jwt_key_repair_request_system_2026')
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว'
    })
  }
}

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน'
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้'
      })
    }

    next()
  }
}

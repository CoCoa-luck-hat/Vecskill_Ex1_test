// ==============================================================================
// มิดเดิลแวร์สำหรับตรวจสอบการยืนยันตัวตนและสิทธิ์การใช้งาน (Authentication & Authorization)
// หน้าที่:
//   1. authenticateToken: ถอดรหัสและตรวจสอบความถูกต้องของ JWT Token ที่แนบมากับ Header
//   2. requireRole: ตรวจสอบบทบาทผู้ใช้ (RBAC: Role-Based Access Control)
// ==============================================================================

import jwt from 'jsonwebtoken'

// ------------------------------------------------------------------------------
// มิดเดิลแวร์ตรวจสอบ JWT Token (Authenticate Token)
// ------------------------------------------------------------------------------
// ตรวจสอบว่าคำขอที่ส่งเข้ามามี Header: "Authorization: Bearer <TOKEN>" หรือไม่
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  // สกัดเอาเฉพาะข้อความ Token ด้านหลังคำว่า 'Bearer '
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  // หากไม่มี Token แนบมา แจ้ง 401 Unauthorized ให้ผู้ใช้ล็อกอินก่อน
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน'
    })
  }

  try {
    // ตรวจสอบความถูกต้องของ Token ด้วยกุญแจลับ JWT_SECRET
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'supersecret_jwt_key_repair_request_system_2026'
    )
    // ฝากข้อมูลผู้ใช้ (id, username, role) ไว้ที่ req.user เพื่อให้ Route ถัดไปนำไปใช้งานต่อได้
    req.user = decoded
    next()
  } catch (err) {
    // กรณี Token ถูกแก้ไข ปลอมแปลง หรือหมดอายุ (Expired)
    return res.status(401).json({
      status: 'error',
      message: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว'
    })
  }
}

// ------------------------------------------------------------------------------
// มิดเดิลแวร์จำกัดสิทธิ์ตามบทบาทผู้ใช้ (Role-Based Access Control)
// ------------------------------------------------------------------------------
// ตัวอย่างการใช้งาน: requireRole(['admin']) หรือ requireRole(['technician', 'admin'])
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    // ต้องผ่านการตรวจสอบ authenticateToken มาก่อน (มีข้อมูล req.user)
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน'
      })
    }

    // หากบทบาทของผู้ใช้ปัจจุบันไม่อยู่ในรายชื่อที่อนุญาต (เช่น user พยายามเข้าถึงเมนู admin)
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้'
      })
    }

    // มีสิทธิ์ถูกต้อง ให้ดำเนินการต่อในลำดับถัดไป
    next()
  }
}

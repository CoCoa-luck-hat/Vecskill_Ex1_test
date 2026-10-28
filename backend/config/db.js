// ==============================================================================
// ไฟล์ตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL (Database Connection Configuration)
// หน้าที่: สร้าง Connection Pool เพื่อนำ Connection กลับมาใช้ซ้ำ ช่วยเพิ่มความเร็ว
//         และรองรับการเข้าถึงพร้อมกันหลายคำขอ (Concurrent Requests)
// ==============================================================================

import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// โหลดค่า Environment (.env) สำหรับการตั้งค่าเชื่อมต่อฐานข้อมูล
dotenv.config()

// สร้าง Connection Pool ของ MySQL 8.0
export const pool = mysql.createPool({
  // ที่อยู่เซิร์ฟเวอร์ MySQL (ใช้ 127.0.0.1 หรือชื่อ service ใน docker เช่น db)
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'repair_system',

  // อนุญาตให้รันคำสั่ง SQL หลายคำสั่งในครั้งเดียว (คั่นด้วย ;) ใช้ตอนสั่ง init script
  multipleStatements: true,

  // หาก Connection เต็มระบบจะรอจนกว่าจะมี Connection ว่าง แทนที่จะตัดการทำงานทันที
  waitForConnections: true,

  // จำกัดจำนวนการเชื่อมต่อพร้อมกันสูงสุดใน Pool ไว้ที่ 10 Connections
  connectionLimit: 10,
  queueLimit: 0,

  // กำหนดรหัสภาษา utf8mb4 รองรับภาษาไทยและอิโมจิได้อย่างสมบูรณ์ ป้องกันปัญหาตัวอักษรเพี้ยน (?)
  charset: 'utf8mb4'
})

// ฟังก์ชันอำนวยความสะดวกสำหรับรัน SQL Query และส่งคืนผลลัพธ์ข้อมูล (Rows) ทันที
export const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params)
  return rows
}

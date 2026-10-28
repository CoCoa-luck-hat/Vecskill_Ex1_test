// ==============================================================================
// ไฟล์โมดูลตรวจสอบและเตรียมฐานข้อมูลอัตโนมัติ (Automated Database Initialization)
// หน้าที่: ตรวจสอบว่ามี Database หรือยัง หากยังไม่มีจะสร้างขึ้นมาใหม่ และสั่งรันไฟล์
//         init.sql เพื่อสร้างตารางพร้อม Seed ผู้ใช้เริ่มต้นโดยไม่ต้องพิมพ์คำสั่งเอง
// ==============================================================================

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function initDb() {
  try {
    // --------------------------------------------------------------------------
    // ขั้นตอนที่ 1: เชื่อมต่อไปยัง MySQL Host โดยตรง เพื่อสร้าง Database หากยังไม่มี
    // --------------------------------------------------------------------------
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'rootpassword',
      multipleStatements: true,
      charset: 'utf8mb4'
    })

    const dbName = process.env.DB_NAME || 'repair_system'
    // สั่งสร้าง Database พร้อมรองรับภาษาไทยแบบ utf8mb4_unicode_ci
    await tempConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    )
    await tempConnection.end()

    // --------------------------------------------------------------------------
    // ขั้นตอนที่ 2: อ่านไฟล์ init.sql และสั่ง Execute เพื่อสร้างตารางและใส่ Seed Data
    // --------------------------------------------------------------------------
    const sqlPath = path.resolve(__dirname, 'init.sql')
    if (fs.existsSync(sqlPath)) {
      // อ่านเนื้อหาไฟล์ SQL ในรูปแบบ UTF-8
      const sql = fs.readFileSync(sqlPath, 'utf-8')

      // สร้างการเชื่อมต่อเข้า Database ที่สร้างไว้โดยตรง
      const dbConnection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'rootpassword',
        database: dbName,
        multipleStatements: true,
        charset: 'utf8mb4'
      })

      // บังคับใช้ charset utf8mb4 ก่อนรันคำสั่ง SQL เพื่อป้องกันภาษาไทยกลายเป็นเครื่องหมาย ?
      await dbConnection.query('SET NAMES utf8mb4;')
      await dbConnection.query(sql)
      await dbConnection.end()

      console.log('✅ ตรวจสอบและสร้างฐานข้อมูลพร้อมตารางเริ่มต้นเรียบร้อยแล้ว!')
    }
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการเริ่มต้นฐานข้อมูล:', error.message)
  }
}

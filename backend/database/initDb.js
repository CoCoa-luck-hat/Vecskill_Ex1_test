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
    // 1. First ensure database exists by connecting to host directly
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'rootpassword',
      multipleStatements: true,
      charset: 'utf8mb4'
    })

    const dbName = process.env.DB_NAME || 'repair_system'
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
    await tempConnection.end()

    // 2. Read and run init.sql
    const sqlPath = path.resolve(__dirname, 'init.sql')
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf-8')
      const dbConnection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'rootpassword',
        database: dbName,
        multipleStatements: true,
        charset: 'utf8mb4'
      })
      await dbConnection.query('SET NAMES utf8mb4;')
      await dbConnection.query(sql)
      await dbConnection.end()
      console.log('✅ Database & Seed Data auto-initialized successfully!')
    }
  } catch (error) {
    console.error('❌ Database init error:', error.message)
  }
}

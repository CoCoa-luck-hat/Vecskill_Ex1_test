import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// Create MySQL Connection Pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'repair_system',
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
})

// Helper for executing queries
export const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params)
  return rows
}

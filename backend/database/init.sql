-- ==============================================================================
-- สคริปต์สร้างฐานข้อมูลและตารางสำหรับระบบแจ้งซ่อมอุปกรณ์ (Database Initialization)
-- ประกอบด้วย 3 ตารางหลัก:
--   1. users: เก็บข้อมูลบัญชีผู้ใช้ บทบาท (Admin, Technician, User) และรหัสผ่านแฮช
--   2. repair_requests: เก็บข้อมูลรายการแจ้งซ่อม สถานะ ค่าซ่อม และช่างผู้รับผิดชอบ
--   3. repair_attachments: เก็บประวัติไฟล์รูปภาพประกอบงานซ่อม (ก่อนซ่อม / หลังซ่อม)
-- ==============================================================================

-- สร้างฐานข้อมูลและกำหนดชุดอักขระเป็น utf8mb4 เพื่อรองรับภาษาไทย
CREATE DATABASE IF NOT EXISTS repair_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE repair_system;
SET NAMES utf8mb4;

-- ------------------------------------------------------------------------------
-- 1. ตารางผู้ใช้งานระบบ (Users Table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,                      -- รหัสประจำตัวผู้ใช้ (Primary Key)
    username VARCHAR(50) NOT NULL UNIQUE,                   -- ชื่อบัญชีผู้ใช้ (ห้ามซ้ำ)
    password VARCHAR(255) NOT NULL,                         -- รหัสผ่านที่เข้ารหัสด้วย bcrypt
    fullname VARCHAR(100) NOT NULL,                         -- ชื่อ - นามสกุลจริง
    email VARCHAR(100) NULL,                                -- อีเมลติดต่อ
    phone VARCHAR(20) NULL,                                 -- เบอร์โทรศัพท์
    role ENUM('user', 'technician', 'admin') NOT NULL DEFAULT 'user', -- บทบาทสิทธิ์การใช้งาน
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,         -- วันที่เวลาที่สร้างบัญชี
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- อัปเดตล่าสุด
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. ตารางคำขอแจ้งซ่อม (Repair Requests Table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS repair_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,                      -- รหัสงานซ่อม (Primary Key)
    ticket_no VARCHAR(30) NOT NULL UNIQUE,                  -- รหัสใบแจ้งซ่อม เช่น REP-202610-8472 (ห้ามซ้ำ)
    user_id INT NOT NULL,                                   -- รหัสผู้แจ้งซ่อม (เชื่อมโยงกับตาราง users)
    equipment_name VARCHAR(150) NOT NULL,                   -- ชื่ออุปกรณ์ หรือ หมายเลขครุภัณฑ์
    title VARCHAR(200) NOT NULL,                            -- หัวข้อการแจ้งซ่อม
    description TEXT NULL,                                  -- รายละเอียดปัญหาหรืออาการเสียที่พบ
    status ENUM('pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled', 'rejected') NOT NULL DEFAULT 'pending', -- สถานะงานซ่อม
    technician_id INT NULL,                                 -- รหัสช่างผู้รับผิดชอบงานซ่อม
    technician_notes TEXT NULL,                             -- บันทึกสรุปผลการซ่อมของช่าง
    repair_cost DECIMAL(10,2) DEFAULT 0.00,                 -- ค่าใช้จ่ายในการซ่อม (บาท)
    completed_at TIMESTAMP NULL,                            -- วันที่เวลาที่ซ่อมเสร็จสิ้น
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,         -- วันที่เวลาที่สร้างใบแจ้งซ่อม
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- อัปเดตสถานะล่าสุด
    INDEX idx_user_id (user_id),
    INDEX idx_technician_id (technician_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    -- หากลบผู้ใช้ จะลบประวัติงานซ่อมของผู้ใช้นั้นออกทั้งหมด (CASCADE)
    CONSTRAINT fk_repair_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- หากลบช่างออก งานซ่อมจะไม่ถูกลบ แต่จะปลดช่างออกเป็น NULL เพื่อให้มอบหมายช่างคนอื่นได้ (SET NULL)
    CONSTRAINT fk_repair_tech FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. ตารางไฟล์รูปภาพแนบงานซ่อม (Repair Attachments Table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS repair_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,                      -- รหัสไฟล์แนบ (Primary Key)
    repair_id INT NOT NULL,                                 -- เชื่อมโยงกับรหัสงานซ่อมใน repair_requests
    file_name VARCHAR(255) NOT NULL,                        -- ชื่อไฟล์ต้นฉบับ
    file_path VARCHAR(255) NOT NULL,                        -- ที่อยู่ไฟล์บนเซิร์ฟเวอร์ เช่น /uploads/xxx.jpg
    file_type VARCHAR(50) NULL,                             -- ชนิดไฟล์ MIME type เช่น image/jpeg
    file_size INT NULL,                                     -- ขนาดไฟล์ (Bytes)
    attachment_type ENUM('before_repair', 'after_repair') NOT NULL DEFAULT 'before_repair', -- ประเภทรูป (ก่อนซ่อม / หลังซ่อม)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,         -- วันที่เวลาที่อัปโหลด
    INDEX idx_repair_id (repair_id),
    -- เมื่อลบใบแจ้งซ่อม ไฟล์แนบที่เกี่ยวข้องจะถูกลบออกจากฐานข้อมูลอัตโนมัติ (CASCADE)
    CONSTRAINT fk_attachment_repair FOREIGN KEY (repair_id) REFERENCES repair_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- ข้อมูลผู้ใช้งานเริ่มต้นสำหรับทดสอบระบบ (Default Seed Users)
-- รหัสผ่านเริ่มต้น:
--   - admin / admin123 (บทบาท ผู้ดูแลระบบ)
--   - tech1 / tech123 (บทบาท ช่างซ่อมบำรุง)
--   - user1 / user123 (บทบาท ผู้ใช้งานทั่วไป)
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO users (id, username, password, fullname, email, phone, role) 
VALUES 
(
    1, 
    'admin', 
    '$2b$10$o1beSPFMutEQ9Loqnod39u6Uiq6XCTR40KsfUPRiPLPNEoURbGGe2', 
    'ผู้ดูแลระบบ (Admin)', 
    'admin@repair.local', 
    '081-234-5678', 
    'admin'
),
(
    2, 
    'tech1', 
    '$2b$10$1pCsbM4Jc7l1yVpYROAYlOnt0xRktePBNAY0lf96HVw5Aurn27kDu', 
    'สมศักดิ์ ช่างซ่อม (Tech)', 
    'tech1@repair.local', 
    '082-345-6789', 
    'technician'
),
(
    3, 
    'user1', 
    '$2b$10$lo5Sir1E7TvfawYShrgagO4xi2ciRLoxvPB5iu.4wZ1Yv2SFDzZQu', 
    'สมชาย ผู้ใช้งาน (User)', 
    'user1@repair.local', 
    '083-456-7890', 
    'user'
);

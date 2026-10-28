-- Database initialization script for Repair Request System (Ex2)
CREATE DATABASE IF NOT EXISTS repair_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE repair_system;
SET NAMES utf8mb4;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    role ENUM('user', 'technician', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Repair Requests table
CREATE TABLE IF NOT EXISTS repair_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_no VARCHAR(30) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    equipment_name VARCHAR(150) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    status ENUM('pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled', 'rejected') NOT NULL DEFAULT 'pending',
    technician_id INT NULL,
    technician_notes TEXT NULL,
    repair_cost DECIMAL(10,2) DEFAULT 0.00,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_technician_id (technician_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    CONSTRAINT fk_repair_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_repair_tech FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Attachments table
CREATE TABLE IF NOT EXISTS repair_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repair_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NULL,
    file_size INT NULL,
    attachment_type ENUM('before_repair', 'after_repair') NOT NULL DEFAULT 'before_repair',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_repair_id (repair_id),
    CONSTRAINT fk_attachment_repair FOREIGN KEY (repair_id) REFERENCES repair_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default seed users (admin / tech1 / user1)
-- admin: admin123
-- tech1: tech123
-- user1: user123
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

# ใช้ Base Image เป็น Node.js 20 บน Alpine Linux ที่มีขนาดเล็กและปลอดภัย
FROM node:20-alpine

# กำหนดไดเรกทอรีทำงานภายใน Container
WORKDIR /app

# คัดลอกเฉพาะ package.json เพื่อติดตั้ง Dependencies ก่อน (ใช้ประโยชน์จาก Docker Layer Cache)
COPY package*.json ./
# ติดตั้งเฉพาะ Production Dependencies (ข้าม devDependencies เพื่อลดขนาด Image)
RUN npm install --omit=dev

# คัดลอกโค้ดโปรเจกต์ทั้งหมดเข้า Container
COPY . .

# สร้างโฟลเดอร์ uploads สำหรับเก็บไฟล์รูปภาพที่ผู้ใช้และช่างแนบมา
RUN mkdir -p uploads

# เปิดพอร์ต 5000 ของ Express Server
EXPOSE 5000

# คำสั่งเริ่มต้นการทำงานของเซิร์ฟเวอร์
CMD ["node", "server.js"]

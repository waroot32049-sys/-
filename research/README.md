# Classroom Research Assistant

เว็บแอปช่วยจัดทำวิจัยในชั้นเรียนตามคู่มือที่ผู้ใช้แนบ โดยจัด workflow เป็น A-P-A-O-R และรายงานฉบับเต็ม 5 บท

## URL
เมื่อ GitHub Pages ของ repository นี้เปิดจาก branch main / root:
https://waroot32049-sys.github.io/-/research/

## ความสามารถ
- วิเคราะห์ปัญหา Input / Process / Product และเลือกปัญหาที่ครูแก้ได้
- วางแผนวิธีแก้ปัญหา/นวัตกรรมและกำหนดชื่อเรื่อง
- บทที่ 1–5 พร้อมส่วนอ้างอิง/ภาคผนวก
- ค้น metadata งานวิจัยจาก ThaiJO OAI-PMH และเพิ่มเป็นรายการอ้างอิง
- ตัวช่วย IOC, reliability, item difficulty/discrimination และสถิติพื้นฐาน
- บันทึกใน localStorage, export/import JSON
- พิมพ์รายงาน A4 หรือ Save as PDF
- สำรอง/กู้คืน Google Drive ด้วย OAuth 2.0

## Google Drive
สร้าง OAuth 2.0 Client ID แบบ Web application ใน Google Cloud Console แล้วเพิ่ม Authorized JavaScript origin:
https://waroot32049-sys.github.io

นำ Client ID มากรอกในหน้า “สำรองข้อมูล” ของแอป ระบบใช้ scope `drive.file` และสร้างโฟลเดอร์ “Classroom Research Backups” เมื่อสำรองครั้งแรก

## ThaiJO
ใช้ OAI-PMH public metadata endpoints ของกลุ่ม ThaiJO. การค้นในเว็บเป็นการดึง metadata ของแต่ละ repository แล้วกรองคำค้นใน browser จึงไม่เท่ากับ full-text search และอาจถูกจำกัดด้วย CORS/rate limit ของต้นทาง

## หมายเหตุด้านวิธีวิจัย
เกณฑ์ IOC/alpha/p/r ในหน้าตัวช่วยเป็นค่าเริ่มต้นทั่วไปเพื่อเตือนผู้ใช้เท่านั้น ไม่ใช่มาตรฐานบังคับ ผู้วิจัยต้องเลือกเกณฑ์ให้เหมาะกับเครื่องมือและใส่แหล่งอ้างอิงที่ตรวจสอบได้ในรายงาน

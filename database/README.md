# ตารางผู้ใช้สำหรับ Laravel / MySQL

ไฟล์ `migrations/2026_10_19_000000_create_users_table.php` เตรียมตาราง `users` สำหรับใช้กับ Laravel โดยมี ID, ชื่อ, อีเมลที่ไม่ซ้ำ, วันยืนยันอีเมล, รหัสผ่าน, remember token และวันสร้าง/แก้ไข

โปรเจกต์นี้เป็นเว็บ HTML ยังไม่มีแอป Laravel, ไฟล์ `artisan` หรือเซิร์ฟเวอร์ MySQL ไฟล์ migration นี้จึงยังไม่ได้สร้างฐานข้อมูลหรือตารางจริง และยังไม่ได้เชื่อมหน้าเว็บกับฐานข้อมูล

## วิธีใช้ในแอป Laravel

1. เตรียมแอป Laravel บนโฮสต์ที่รัน PHP และจัดเตรียมเซิร์ฟเวอร์ MySQL พร้อมฐานข้อมูลและบัญชีสำหรับแอป Netlify ไม่ได้รัน Laravel/PHP backend โดยตรง ส่วน Netlify Database ใช้ PostgreSQL
2. คัดลอก migration นี้ไปที่ `database/migrations` ของแอป Laravel ถ้ามี migration สร้างตาราง `users` อยู่แล้ว ให้ใช้ migration เดิมหรือปรับรวมให้เหลือไฟล์สร้างตารางนี้เพียงไฟล์เดียว ไม่ควรรันไฟล์นี้ซ้ำกับตารางที่มีอยู่แล้ว
3. ตั้งค่า `DB_CONNECTION` เป็น `mysql` และกำหนด `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` ใน environment ของโฮสต์ Laravel ตามข้อมูลฐานข้อมูลจริง เก็บค่าลับไว้ฝั่งเซิร์ฟเวอร์ ไม่ใส่ใน HTML หรือ commit ลง repository
4. รันคำสั่งจากโฟลเดอร์แอป Laravel:

   ```sh
   php artisan config:clear
   php artisan migrate
   php artisan migrate:status
   ```

บันทึกรหัสผ่านผ่าน `Hash::make()` หรือ hashed cast ของ Laravel เท่านั้น ตารางนี้ไม่ได้เพิ่มระบบสมัครสมาชิกหรือเข้าสู่ระบบ และไม่มีบัญชีหรือรหัสผ่านเริ่มต้น

เมธอด `down()` รองรับ rollback โดยลบตาราง `users` และข้อมูลในตาราง จึงควรใช้ด้วยความระมัดระวัง

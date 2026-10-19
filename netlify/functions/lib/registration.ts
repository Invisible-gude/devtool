import { randomBytes, scrypt } from "node:crypto";
const headers = { "Cache-Control": "no-store" };
const maxBodyBytes = 8192;

export type Registration = { name: string; email: string; passwordHash: string };
type SaveUser = (user: Registration) => Promise<boolean>;

function reply(message: string, status: number) {
  return Response.json({ message }, { status, headers });
}

export async function register(request: Request, saveUser: SaveUser): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...headers, Allow: "POST" },
    });
  }
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    return reply("ไม่อนุญาตให้ส่งข้อมูลจากเว็บไซต์อื่น", 403);
  }
  if (request.headers.get("Content-Type")?.split(";")[0].trim() !== "application/json") {
    return reply("กรุณาส่งข้อมูลในรูปแบบ JSON", 415);
  }

  let data: unknown;
  const reader = request.body?.getReader();
  if (!reader) return reply("กรุณากรอกข้อมูลสมัครสมาชิก", 400);
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBodyBytes) {
        await reader.cancel();
        return reply("ข้อมูลที่ส่งมีขนาดใหญ่เกินไป", 413);
      }
      chunks.push(value);
    }
    data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return reply("ข้อมูลสมัครสมาชิกไม่ถูกต้อง", 400);
  } finally {
    reader.releaseLock();
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return reply("ข้อมูลสมัครสมาชิกไม่ถูกต้อง", 400);
  }
  const { name, email, password, passwordConfirmation } = data as Record<string, unknown>;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
    return reply("กรุณากรอกชื่อไม่เกิน 100 ตัวอักษร", 400);
  }
  if (typeof email !== "string" || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return reply("กรุณากรอกอีเมลให้ถูกต้อง", 400);
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128 || !password.trim()) {
    return reply("กรุณากรอกรหัสผ่าน 8–128 ตัวอักษร", 400);
  }
  if (password !== passwordConfirmation) {
    return reply("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน", 400);
  }

  try {
    const salt = randomBytes(16).toString("hex");
    const key = await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 64, {
        N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024,
      }, (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      });
    });
    const saved = await saveUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: `scrypt$131072$8$1$${salt}$${key.toString("hex")}`,
    });
    return saved
      ? reply("สมัครสมาชิกสำเร็จ บันทึกข้อมูลเรียบร้อยแล้ว", 201)
      : reply("อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว", 409);
  } catch {
    return reply("ไม่สามารถบันทึกข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง", 503);
  }
}

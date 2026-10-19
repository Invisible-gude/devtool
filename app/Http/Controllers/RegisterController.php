<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->only('name', 'email', 'password', 'passwordConfirmation');
        if (is_string($data['email'] ?? null)) {
            $data['email'] = mb_strtolower(trim($data['email']));
        }

        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:254'],
            'password' => ['required', 'string', 'min:8', 'max:128', 'regex:/\S/u'],
            'passwordConfirmation' => ['required', 'string', 'same:password'],
        ], [
            'name.*' => 'กรุณากรอกชื่อไม่เกิน 100 ตัวอักษร',
            'email.*' => 'กรุณากรอกอีเมลให้ถูกต้อง',
            'password.*' => 'กรุณากรอกรหัสผ่าน 8–128 ตัวอักษร',
            'passwordConfirmation.*' => 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน',
        ]);

        if ($validator->fails()) {
            return $this->reply($validator->errors()->first(), 400);
        }

        try {
            // The User model's hashed cast hashes the password before insertion.
            User::create($validator->safe()->only(['name', 'email', 'password']));
        } catch (UniqueConstraintViolationException) {
            return $this->reply('อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว', 409);
        } catch (QueryException) {
            return $this->reply('ไม่สามารถบันทึกข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง', 503);
        }

        return $this->reply('สมัครสมาชิกสำเร็จ บันทึกข้อมูลเรียบร้อยแล้ว', 201);
    }

    private function reply(string $message, int $status): JsonResponse
    {
        return response()->json(['message' => $message], $status, ['Cache-Control' => 'no-store']);
    }
}

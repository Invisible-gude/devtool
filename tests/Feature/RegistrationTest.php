<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function registration(): array
    {
        return [
            'name' => 'สมชาย ใจดี',
            'email' => 'Member@Example.com',
            'password' => 'secure password ',
            'passwordConfirmation' => 'secure password ',
        ];
    }

    public function test_existing_pages_and_script_are_served(): void
    {
        $this->get('/')->assertOk();
        $this->get('/index.html')->assertOk();
        $this->get('/register')->assertOk();
        $this->get('/register.html')->assertOk();
        $this->get('/register.js')->assertOk()->assertHeader('Content-Type', 'text/javascript; charset=utf-8');
    }

    public function test_registration_persists_a_hashed_password_and_rejects_duplicate_email(): void
    {
        $this->postJson('/api/register', $this->registration())
            ->assertCreated()->assertHeader('Cache-Control', 'no-store, private');

        $user = User::sole();
        $this->assertSame('member@example.com', $user->email);
        $this->assertSame('สมชาย ใจดี', $user->name);
        $this->assertTrue(Hash::check('secure password ', $user->password));
        $this->assertArrayNotHasKey('password', $user->toArray());

        $this->postJson('/api/register', $this->registration())->assertConflict();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_invalid_registration_returns_json_even_without_an_accept_header(): void
    {
        $data = [...$this->registration(), 'passwordConfirmation' => 'different password'];
        $this->call('POST', '/api/register', [], [], [], ['CONTENT_TYPE' => 'application/json'], json_encode($data))
            ->assertStatus(400)->assertJsonStructure(['message']);
        $this->postJson('/api/register', [...$this->registration(), 'email' => 'invalid'])->assertStatus(400);
        $this->assertDatabaseCount('users', 0);
    }
}

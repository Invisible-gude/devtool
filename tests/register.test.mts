import assert from "node:assert/strict";
import { scryptSync } from "node:crypto";
import { test } from "node:test";
import { register, type Registration } from "../netlify/functions/lib/registration.js";

const valid = {
  name: "  สมชาย ใจดี  ",
  email: "  Member@Example.com  ",
  password: "my secure password",
  passwordConfirmation: "my secure password",
};

function request(data: unknown = valid, headers: Record<string, string> = {}) {
  return new Request("https://station.example/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
}

test("registration saves normalized data with a verifiable salted password hash", async () => {
  const saved: Registration[] = [];
  const response = await register(request(), async user => { saved.push(user); return true; });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(saved.length, 1);
  const user = saved[0];
  assert.equal(user.name, "สมชาย ใจดี");
  assert.equal(user.email, "member@example.com");
  assert.deepEqual(Object.keys(user).sort(), ["email", "name", "passwordHash"]);
  const [algorithm, n, r, p, salt, hash] = user.passwordHash.split("$");
  assert.equal(algorithm, "scrypt");
  assert.match(salt, /^[a-f0-9]{32}$/);
  assert.match(hash, /^[a-f0-9]{128}$/);
  const key = scryptSync(valid.password, salt, 64, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: 256 * 1024 * 1024,
  });
  assert.equal(key.toString("hex"), hash);
  const body = await response.text();
  assert.ok(!body.includes(valid.password));
  assert.ok(!body.includes(hash));
});

test("invalid fields are rejected before saving", async (t) => {
  const invalid = [
    null, [], "text", {},
    { ...valid, name: "   " },
    { ...valid, name: "ก".repeat(101) },
    { ...valid, email: "not-an-email" },
    { ...valid, email: "a".repeat(250) + "@example.com" },
    { ...valid, password: "short", passwordConfirmation: "short" },
    { ...valid, password: "a".repeat(129), passwordConfirmation: "a".repeat(129) },
    { ...valid, password: "        ", passwordConfirmation: "        " },
    { ...valid, password: 12345678 },
    { ...valid, passwordConfirmation: "different" },
  ];
  for (const [i, data] of invalid.entries()) {
    await t.test(`invalid payload ${i + 1}`, async () => {
      const response = await register(request(data), async () => {
        assert.fail("Invalid data must not be saved");
      });
      assert.equal(response.status, 400);
    });
  }
});

test("duplicate email returns 409 instead of success", async () => {
  const response = await register(request(), async () => false);
  assert.equal(response.status, 409);
});

test("database errors return a generic failure without leaking details", async () => {
  const response = await register(request(), async () => { throw new Error("secret database details"); });
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes("secret"));
});

test("method, origin, content type, malformed JSON, and oversized bodies are rejected", async () => {
  const neverSave = async () => { assert.fail("Rejected requests must not be saved"); };
  const get = await register(new Request("https://station.example/api/register"), neverSave);
  assert.equal(get.status, 405);
  assert.equal(get.headers.get("Allow"), "POST");
  assert.equal((await register(request(valid, { Origin: "https://other.example" }), neverSave)).status, 403);
  assert.equal((await register(request(valid, { "Content-Type": "text/plain" }), neverSave)).status, 415);
  const malformed = new Request("https://station.example/api/register", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{invalid",
  });
  assert.equal((await register(malformed, neverSave)).status, 400);
  const oversized = request({ ...valid, extra: "a".repeat(8192) });
  assert.equal((await register(oversized, neverSave)).status, 413);
});

test("simultaneous duplicate registrations yield one success and different salts", async () => {
  const emails = new Set<string>();
  const hashes = new Set<string>();
  const save = async (user: Registration) => {
    hashes.add(user.passwordHash);
    if (emails.has(user.email)) return false;
    emails.add(user.email);
    return true;
  };
  const results = await Promise.all([register(request(), save), register(request(), save)]);
  assert.deepEqual(results.map(response => response.status).sort(), [201, 409]);
  assert.equal(hashes.size, 2);
  assert.equal(emails.size, 1);
});

const form = document.getElementById('register-form');
const fields = document.getElementById('register-fields');
const button = document.getElementById('register-button');
const error = document.getElementById('register-error');
const success = document.getElementById('register-success');
const confirmation = document.getElementById('passwordConfirmation');

function validateConfirmation() {
  confirmation.setCustomValidity(
    confirmation.value && confirmation.value !== form.elements.password.value
      ? 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน' : '',
  );
}
confirmation.addEventListener('input', validateConfirmation);
form.elements.password.addEventListener('input', validateConfirmation);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (fields.disabled) return;
  validateConfirmation();
  if (!form.reportValidity()) return;
  error.hidden = true;
  success.hidden = true;
  const data = {
    name: form.elements.namedItem('name').value.trim(),
    email: form.elements.email.value.trim(),
    password: form.elements.password.value,
    passwordConfirmation: confirmation.value,
  };
  fields.disabled = true;
  form.setAttribute('aria-busy', 'true');
  button.textContent = 'กำลังสมัครสมาชิก…';

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.message || (response.status === 429
        ? 'ส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่'
        : 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง'));
    }
    if (response.status !== 201) throw new Error('ไม่สามารถยืนยันผลการสมัครได้ กรุณาลองใหม่อีกครั้ง');
    form.reset();
    form.hidden = true;
    success.textContent = result?.message || 'สมัครสมาชิกสำเร็จ บันทึกข้อมูลเรียบร้อยแล้ว';
    success.hidden = false;
    success.focus();
  } catch (cause) {
    error.textContent = cause instanceof TypeError
      ? 'เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'
      : cause.message || 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง';
    error.hidden = false;
    error.focus();
  } finally {
    fields.disabled = false;
    form.removeAttribute('aria-busy');
    button.textContent = 'สมัครสมาชิก';
  }
});

export const CCCD_REGEX = /^[0-9]{12}$/;
export const PHONE_REGEX = /^(0|\+84)[0-9]{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateCccd(cccd: string): string | null {
  if (!cccd || !cccd.trim()) {
    return 'Vui lòng nhập số CCCD';
  }
  const clean = cccd.trim();
  if (!CCCD_REGEX.test(clean)) {
    return 'Số CCCD phải bao gồm đúng 12 chữ số';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Vui lòng nhập mật khẩu';
  }
  if (password.length < 6) {
    return 'Mật khẩu phải có tối thiểu 6 ký tự';
  }
  return null;
}

export function validateFullName(name: string): string | null {
  if (!name || !name.trim()) {
    return 'Vui lòng nhập họ và tên';
  }
  if (name.trim().length > 100) {
    return 'Họ và tên không được vượt quá 100 ký tự';
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone || !phone.trim()) {
    return 'Vui lòng nhập số điện thoại';
  }
  const clean = phone.trim();
  if (!PHONE_REGEX.test(clean)) {
    return 'Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return 'Vui lòng nhập email';
  }
  const clean = email.trim();
  if (!EMAIL_REGEX.test(clean)) {
    return 'Định dạng email không hợp lệ (VD: example@domain.com)';
  }
  return null;
}

export function validateDateOfBirth(dob?: string): string | null {
  if (!dob || !dob.trim()) {
    return null; // Tùy chọn (nullable = true trong backend)
  }
  const clean = dob.trim();
  if (!DATE_REGEX.test(clean)) {
    return 'Định dạng ngày sinh phải là YYYY-MM-DD (VD: 1995-05-20)';
  }
  const [year, month, day] = clean.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return 'Ngày sinh không hợp lệ trên lịch';
  }
  const now = new Date();
  if (date > now) {
    return 'Ngày sinh không được ở tương lai';
  }
  return null;
}

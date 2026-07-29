const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REQUIRED_MESSAGE = 'Email address is required.';
const FORMAT_MESSAGE = 'Please enter a valid email address.';

export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return REQUIRED_MESSAGE;
  }

  if (!EMAIL_PATTERN.test(email)) {
    return FORMAT_MESSAGE;
  }

  return null;
}

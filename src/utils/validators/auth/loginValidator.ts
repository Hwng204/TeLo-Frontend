import type { ValidationResult } from '../types.ts';

export interface LoginFormFields {
  username?: string;
  password?: string;
}

export const validateLogin = (fields: LoginFormFields): ValidationResult<LoginFormFields> => {
  const errors: Partial<Record<keyof LoginFormFields, string>> = {};
  const rawUsername = fields?.username ?? '';
  const rawPassword = fields?.password ?? '';
  const username = rawUsername.trim();
  const password = rawPassword.trim();

  if (!username && !password) {
    errors.username = 'Vui lòng nhập tài khoản.';
    errors.password = 'Vui lòng nhập mật khẩu.';
    return {
      isValid: false,
      errors,
      firstError: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.',
    };
  }

  if (!username) {
    errors.username = 'Vui lòng nhập tài khoản.';
  } else if (username.length > 100) {
    errors.username = 'Tài khoản không được vượt quá 100 ký tự.';
  }

  if (!password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (password.length > 128) {
    errors.password = 'Mật khẩu không được vượt quá 128 ký tự.';
  }

  const isValid = Object.keys(errors).length === 0;
  const firstError = errors.username || errors.password;

  return {
    isValid,
    errors,
    firstError,
  };
};

export const isLoginValid = (fields: LoginFormFields): boolean => {
  return validateLogin(fields).isValid;
};

export const loginValidator = {
  validate: validateLogin,
  isValid: isLoginValid,
};

import type { ValidationResult } from '../types.ts';

export interface ChangePasswordFields {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export const validateChangePassword = (
  fields: ChangePasswordFields
): ValidationResult<ChangePasswordFields> => {
  const errors: Partial<Record<keyof ChangePasswordFields, string>> = {};
  const currentPassword = fields?.currentPassword ?? '';
  const newPassword = fields?.newPassword ?? '';
  const confirmPassword = fields?.confirmPassword ?? '';

  if (!currentPassword.trim()) {
    errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
  }

  if (!newPassword) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
  } else if (newPassword.length < 6) {
    errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
  } else if (newPassword.length > 128) {
    errors.newPassword = 'Mật khẩu không được vượt quá 128 ký tự.';
  } else if (currentPassword && newPassword === currentPassword) {
    errors.newPassword = 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
  } else if (newPassword && newPassword !== confirmPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
  }

  const isValid = Object.keys(errors).length === 0;
  // Prioritize mismatch or length error order matching UI expectations
  const firstError =
    errors.confirmPassword && confirmPassword && newPassword !== confirmPassword
      ? errors.confirmPassword
      : errors.newPassword || errors.currentPassword || errors.confirmPassword;

  return {
    isValid,
    errors,
    firstError,
  };
};

export const isChangePasswordValid = (fields: ChangePasswordFields): boolean => {
  return validateChangePassword(fields).isValid;
};

export const changePasswordValidator = {
  validate: validateChangePassword,
  isValid: isChangePasswordValid,
};

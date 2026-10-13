import type { ValidationResult } from '../types.ts';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface ForgotPasswordEmailFields {
  email?: string;
}

export interface OtpFields {
  otp?: string;
}

export interface ResetPasswordFields {
  email?: string;
  otp?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export const validateForgotPasswordEmail = (
  fields: ForgotPasswordEmailFields
): ValidationResult<ForgotPasswordEmailFields> => {
  const errors: Partial<Record<keyof ForgotPasswordEmailFields, string>> = {};
  const email = (fields?.email ?? '').trim();

  if (!email) {
    errors.email = 'Vui lòng nhập địa chỉ email.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Địa chỉ email không đúng định dạng.';
  } else if (email.length > 150) {
    errors.email = 'Email không được vượt quá 150 ký tự.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError: errors.email,
  };
};

export const validateOtp = (fields: OtpFields): ValidationResult<OtpFields> => {
  const errors: Partial<Record<keyof OtpFields, string>> = {};
  const otp = (fields?.otp ?? '').trim();

  if (!otp) {
    errors.otp = 'Vui lòng nhập mã OTP.';
  } else if (!/^\d{6}$/.test(otp)) {
    errors.otp = 'Mã OTP phải gồm đúng 6 chữ số.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError: errors.otp,
  };
};

export const validateResetPassword = (
  fields: ResetPasswordFields
): ValidationResult<ResetPasswordFields> => {
  const errors: Partial<Record<keyof ResetPasswordFields, string>> = {};
  const email = (fields?.email ?? '').trim();
  const otp = (fields?.otp ?? '').trim();
  const newPassword = fields?.newPassword ?? '';
  const confirmPassword = fields?.confirmPassword ?? '';

  if (fields.email !== undefined) {
    if (!email) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Địa chỉ email không đúng định dạng.';
    }
  }

  if (fields.otp !== undefined) {
    if (!otp) {
      errors.otp = 'Vui lòng nhập mã OTP.';
    } else if (!/^\d{6}$/.test(otp)) {
      errors.otp = 'Mã OTP phải gồm đúng 6 chữ số.';
    }
  }

  if (!newPassword && !confirmPassword) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
    return {
      isValid: false,
      errors,
      firstError: 'Vui lòng nhập đầy đủ mật khẩu mới.',
    };
  }

  if (!newPassword) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
  } else if (newPassword.length < 6) {
    errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
  } else if (newPassword.length > 128) {
    errors.newPassword = 'Mật khẩu không được vượt quá 128 ký tự.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
  } else if (newPassword && newPassword !== confirmPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
  }

  const firstError = errors.email || errors.otp || errors.newPassword || errors.confirmPassword;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError,
  };
};

export const forgotPasswordValidator = {
  validateEmail: validateForgotPasswordEmail,
  validateOtp,
  validateResetPassword,
};

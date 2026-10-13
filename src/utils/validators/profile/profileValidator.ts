import type { ValidationResult } from '../types.ts';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp',
];

export interface AvatarFileFields {
  file?: File | null;
}

export interface ProfileUpdateFields {
  avatarUrl?: string;
}

export const validateAvatarFile = (file?: File | null): ValidationResult<AvatarFileFields> => {
  const errors: Partial<Record<keyof AvatarFileFields, string>> = {};

  if (!file) {
    errors.file = 'Vui lòng chọn ảnh đại diện.';
    return {
      isValid: false,
      errors,
      firstError: errors.file,
    };
  }

  if (file.size > MAX_AVATAR_SIZE) {
    errors.file = 'Kích thước ảnh tối đa là 2MB.';
  } else if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    errors.file = 'Định dạng file không hợp lệ. Chỉ chấp nhận PNG, JPG, SVG, WEBP.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError: errors.file,
  };
};

export const validateProfileUpdate = (
  fields: ProfileUpdateFields
): ValidationResult<ProfileUpdateFields> => {
  const errors: Partial<Record<keyof ProfileUpdateFields, string>> = {};
  const avatarUrl = fields?.avatarUrl?.trim();

  if (avatarUrl) {
    const isValidUrl =
      avatarUrl.startsWith('http://') ||
      avatarUrl.startsWith('https://') ||
      avatarUrl.startsWith('/') ||
      avatarUrl.startsWith('data:image/');
    if (!isValidUrl) {
      errors.avatarUrl = 'Đường dẫn ảnh đại diện không hợp lệ.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError: errors.avatarUrl,
  };
};

export const profileValidator = {
  validateAvatarFile,
  validateProfileUpdate,
};

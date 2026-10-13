import type { ValidationResult } from '../types.ts';
import type { CreateSchoolRequest, UpdateSchoolRequest } from '../../../types';

const SCHOOL_CODE_REGEX = /^[A-Za-z0-9\-_]+$/;

export const validateCreateSchool = (
  fields: Partial<CreateSchoolRequest>
): ValidationResult<CreateSchoolRequest> => {
  const errors: Partial<Record<keyof CreateSchoolRequest, string>> = {};
  const name = (fields?.name ?? '').trim();
  const code = (fields?.code ?? '').trim();

  if (!name) {
    errors.name = 'Vui lòng nhập tên trường.';
  } else if (name.length > 200) {
    errors.name = 'Tên trường không được vượt quá 200 ký tự.';
  }

  if (!code) {
    errors.code = 'Vui lòng nhập mã trường.';
  } else if (!SCHOOL_CODE_REGEX.test(code)) {
    errors.code = 'Mã chỉ gồm chữ cái, số và dấu gạch ngang (-).';
  } else if (code.length > 50) {
    errors.code = 'Mã trường không được vượt quá 50 ký tự.';
  }

  if (fields.provinceCode && fields.provinceCode.trim().length > 20) {
    errors.provinceCode = 'Mã tỉnh/thành phố không được vượt quá 20 ký tự.';
  }

  if (fields.status && !['ACTIVE', 'INACTIVE'].includes(fields.status)) {
    errors.status = 'Trạng thái trường học không hợp lệ.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError: errors.name || errors.code || errors.provinceCode || errors.status,
  };
};

export const validateUpdateSchool = (
  fields: UpdateSchoolRequest
): ValidationResult<UpdateSchoolRequest> => {
  const errors: Partial<Record<keyof UpdateSchoolRequest, string>> = {};

  if (fields.name !== undefined) {
    const name = fields.name.trim();
    if (!name) {
      errors.name = 'Vui lòng nhập tên trường.';
    } else if (name.length > 200) {
      errors.name = 'Tên trường không được vượt quá 200 ký tự.';
    }
  }

  if (fields.code !== undefined && fields.code.trim()) {
    const code = fields.code.trim();
    if (!SCHOOL_CODE_REGEX.test(code)) {
      errors.code = 'Mã chỉ gồm chữ cái, số và dấu gạch ngang (-).';
    } else if (code.length > 50) {
      errors.code = 'Mã trường không được vượt quá 50 ký tự.';
    }
  }

  if (fields.status && !['ACTIVE', 'INACTIVE'].includes(fields.status)) {
    errors.status = 'Trạng thái trường học không hợp lệ.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError: errors.name || errors.code || errors.status,
  };
};

export const isSchoolValid = (fields: Partial<CreateSchoolRequest>): boolean => {
  return validateCreateSchool(fields).isValid;
};

export const schoolValidator = {
  validateCreate: validateCreateSchool,
  validateUpdate: validateUpdateSchool,
  isValid: isSchoolValid,
};

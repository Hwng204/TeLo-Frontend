import type { ValidationResult } from '../types.ts';
import type { CreateSchoolBranchRequest, UpdateSchoolBranchRequest } from '../../../types';

const BRANCH_CODE_REGEX = /^[A-Za-z0-9\-_]+$/;

export const validateCreateBranch = (
  fields: Partial<CreateSchoolBranchRequest>
): ValidationResult<CreateSchoolBranchRequest> => {
  const errors: Partial<Record<keyof CreateSchoolBranchRequest, string>> = {};
  const name = (fields?.name ?? '').trim();
  const code = (fields?.code ?? '').trim();
  const address = (fields?.address ?? '').trim();

  if (!name) {
    errors.name = 'Vui lòng nhập tên cơ sở.';
  } else if (name.length > 200) {
    errors.name = 'Tên cơ sở không được vượt quá 200 ký tự.';
  }

  if (code && !BRANCH_CODE_REGEX.test(code)) {
    errors.code = 'Mã cơ sở chỉ gồm chữ cái, số và dấu gạch ngang (-).';
  } else if (code.length > 50) {
    errors.code = 'Mã cơ sở không được vượt quá 50 ký tự.';
  }

  if (address.length > 500) {
    errors.address = 'Địa chỉ không được vượt quá 500 ký tự.';
  }

  if (fields.logo && fields.logo.trim().length > 1000) {
    errors.logo = 'Đường dẫn logo không được vượt quá 1000 ký tự.';
  }

  if (fields.status && !['ACTIVE', 'INACTIVE'].includes(fields.status)) {
    errors.status = 'Trạng thái cơ sở không hợp lệ.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError: errors.name || errors.code || errors.address || errors.status,
  };
};

export const validateUpdateBranch = (
  fields: UpdateSchoolBranchRequest
): ValidationResult<UpdateSchoolBranchRequest> => {
  const errors: Partial<Record<keyof UpdateSchoolBranchRequest, string>> = {};

  if (fields.name !== undefined) {
    const name = fields.name.trim();
    if (!name) {
      errors.name = 'Vui lòng nhập tên cơ sở.';
    } else if (name.length > 200) {
      errors.name = 'Tên cơ sở không được vượt quá 200 ký tự.';
    }
  }

  if (fields.code !== undefined && fields.code.trim()) {
    const code = fields.code.trim();
    if (!BRANCH_CODE_REGEX.test(code)) {
      errors.code = 'Mã cơ sở chỉ gồm chữ cái, số và dấu gạch ngang (-).';
    } else if (code.length > 50) {
      errors.code = 'Mã cơ sở không được vượt quá 50 ký tự.';
    }
  }

  if (fields.address !== undefined && fields.address.trim().length > 500) {
    errors.address = 'Địa chỉ không được vượt quá 500 ký tự.';
  }

  if (fields.logo !== undefined && fields.logo.trim().length > 1000) {
    errors.logo = 'Đường dẫn logo không được vượt quá 1000 ký tự.';
  }

  if (fields.status && !['ACTIVE', 'INACTIVE'].includes(fields.status)) {
    errors.status = 'Trạng thái cơ sở không hợp lệ.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError: errors.name || errors.code || errors.address || errors.status,
  };
};

export const isBranchValid = (fields: Partial<CreateSchoolBranchRequest>): boolean => {
  return validateCreateBranch(fields).isValid;
};

export const schoolBranchValidator = {
  validateCreate: validateCreateBranch,
  validateUpdate: validateUpdateBranch,
  isValid: isBranchValid,
};

import type { EmailEventItem, EmailTargetItem, SaveEmailTemplateRequest, SaveEmailEventRequest } from '../types/email.ts';

export function restoreEmailLocation(search: string, remembered: string | null): URLSearchParams {
  const current = new URLSearchParams(search);
  if (current.size || !remembered) return current;
  const saved = new URLSearchParams(remembered);
  const school = Number(saved.get('schoolId'));
  return Number.isSafeInteger(school) && school > 0 ? saved : current;
}

export function readEmailLocation(userId: string | null, schoolId?: number): string | null {
  try { return userId ? sessionStorage.getItem(`email-context:${userId}${schoolId ? `:school:${schoolId}` : ''}`) : null; }
  catch { return null; }
}

export function rememberEmailLocation(userId: string | null, params: URLSearchParams): void {
  try {
    const schoolId = Number(params.get('schoolId'));
    if (userId && Number.isSafeInteger(schoolId) && schoolId > 0) {
      sessionStorage.setItem(`email-context:${userId}`, params.toString());
      sessionStorage.setItem(`email-context:${userId}:school:${schoolId}`, params.toString());
    }
  }
  catch { /* URL navigation remains available when storage is blocked. */ }
}

export const validateEmailEvent = (value: SaveEmailEventRequest) => {
  const errors: Record<string, string> = {};
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,93}$/.test(value.code.trim())) errors.code = 'Mã gồm 2–94 ký tự chữ không dấu, số, gạch ngang hoặc gạch dưới.';
  if (!value.name.trim() || value.name.trim().length > 150) errors.name = 'Tên bắt buộc, tối đa 150 ký tự.';
  if (value.description.length > 1000) errors.description = 'Mô tả tối đa 1.000 ký tự.';
  const names = value.variableDefinitions.map(v => v.name.toLowerCase());
  if (names.length > 20 || new Set(names).size !== names.length || value.variableDefinitions.some(v =>
    !/^[A-Za-z][A-Za-z0-9_]{0,31}$/.test(v.name) || !v.label.trim() || v.label.length > 150 ||
    !['TEXT', 'DATE', 'NUMBER', 'URL'].includes(v.type) || ['schoolname', 'actorname', 'actionurl'].includes(v.name.toLowerCase())))
    errors.variableDefinitions = 'Tối đa 20 biến riêng, có tên/nhãn/kiểu hợp lệ và không trùng biến hệ thống.';
  return errors;
};

// The scheduling form explicitly uses Vietnam time, independent of the browser timezone.
export const emailScheduledUtc = (value: string): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+07:00`);
  if (!Number.isFinite(date.getTime())) return null;
  const local = new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 16);
  return local === value ? date.toISOString() : null;
};

export const validateEmailTemplate = (value: SaveEmailTemplateRequest, events: EmailEventItem[]) => {
  const errors: Record<string, string> = {};
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,99}$/.test(value.code.trim())) errors.code = 'Mã gồm 2–100 ký tự chữ không dấu, số, gạch ngang hoặc gạch dưới.';
  if (!value.name.trim() || value.name.trim().length > 150) errors.name = 'Tên bắt buộc, tối đa 150 ký tự.';
  const event = events.find(item => item.code === value.eventCode);
  if (!event) errors.eventCode = 'Chọn sự kiện hợp lệ.';
  if (!value.subject.trim() || value.subject.trim().length > 200 || /[\r\n]/.test(value.subject)) errors.subject = 'Tiêu đề bắt buộc, tối đa 200 ký tự và không xuống dòng.';
  if (!value.body.trim() || value.body.length > 10000) errors.body = 'Nội dung bắt buộc, tối đa 10.000 ký tự.';
  for (const field of ['subject', 'body'] as const) {
    const remaining = value[field].replace(/{{\s*([A-Za-z][A-Za-z0-9_]*)\s*}}/g, (_, name: string) => {
      if (event && !event.variables.includes(name)) errors[field] = `Biến {{${name}}} không được dùng cho sự kiện này.`;
      return '';
    });
    if (remaining.includes('{{') || remaining.includes('}}')) errors[field] = 'Biến phải có dạng {{TenBien}} và thuộc danh sách cho phép.';
  }
  return errors;
};

export const emailTargetKey = (target: EmailTargetItem) => target.roleId != null ? `role:${target.roleId}` : `user:${target.userId}`;
export const mergeEmailTargets = (current: EmailTargetItem[], incoming: EmailTargetItem[]) =>
  [...new Map([...current, ...incoming].map(item => [emailTargetKey(item), item])).values()];
export const previewEmailText = (text: string) => text.replace(/{{\s*([A-Za-z][A-Za-z0-9_]*)\s*}}/g, (_, name: string) => `[${name}: giá trị minh họa]`);
// MySQL datetime is returned without an offset; notification timestamps are stored in UTC.
export const emailDateTime = (value: string | null) => {
  if (!value) return '—';
  const utc = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  return Number.isNaN(Date.parse(utc)) ? '—' : new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(utc));
};
export const safeEmailActionUrl = (value: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value, 'https://local.invalid');
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? value : null;
  } catch { return null; }
};

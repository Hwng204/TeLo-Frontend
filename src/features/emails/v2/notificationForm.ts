import type { NotificationEvent, NotificationPolicy, NotificationTemplateInput } from '../../../types/notificationV2';

export const emptyPolicy = (): NotificationPolicy => ({ formatVersion: 1, branchIds: [], includeSourceRecipients: false, includeRoleIds: [], includeUserIds: [], excludeRoleIds: [], excludeUserIds: [] });
export const emptyTemplate = (): NotificationTemplateInput => ({ revision: 0, code: '', name: '', eventCode: 'MANUAL', subjectTemplate: '', titleTemplate: '', contentTemplate: '', summaryTemplate: '', status: 'ACTIVE', channels: ['IN_APP'], isAutomaticDefault: false, recipientPolicy: emptyPolicy() });

export function policySelection(policy: NotificationPolicy, key: 'branchIds' | 'includeRoleIds' | 'includeUserIds' | 'excludeRoleIds' | 'excludeUserIds', ids: number[]): NotificationPolicy {
  // A target can be added and excluded; exclusions win at recipient resolution, without silently removing either rule.
  return { ...policy, [key]: [...new Set(ids)] };
}

export function validateNotificationTemplate(input: NotificationTemplateInput, event?: NotificationEvent): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!/^[A-Z][A-Z0-9_]{1,49}$/.test(input.code.trim())) errors.code = 'Mã gồm 2–50 chữ in hoa, số hoặc dấu gạch dưới; bắt đầu bằng chữ.';
  if (!input.name.trim() || input.name.trim().length > 200) errors.name = 'Nhập tên mẫu, tối đa 200 ký tự.';
  if (!event) errors.eventCode = 'Chọn sự kiện hợp lệ.';
  if (!input.subjectTemplate.trim() || input.subjectTemplate.length > 255 || /[\r\n]/.test(input.subjectTemplate)) errors.subjectTemplate = 'Tiêu đề bắt buộc, tối đa 255 ký tự và không xuống dòng.';
  if (input.titleTemplate.length > 255 || /[\r\n]/.test(input.titleTemplate)) errors.titleTemplate = 'Tiêu đề tối đa 255 ký tự và không xuống dòng.';
  if (input.summaryTemplate.length > 500) errors.summaryTemplate = 'Tóm tắt tối đa 500 ký tự.';
  if (!input.contentTemplate.trim() || input.contentTemplate.length > 10000) errors.contentTemplate = 'Nhập nội dung, tối đa 10.000 ký tự.';
  if (!input.channels.length) errors.channels = 'Chọn ít nhất một kênh thông báo.';
  const allowed = new Set(['schoolName', 'actorName', 'actionUrl', ...(event?.variables.map(item => item.name) ?? [])]);
  for (const field of ['subjectTemplate', 'titleTemplate', 'contentTemplate', 'summaryTemplate'] as const) {
    const rest = input[field].replace(/{{\s*([A-Za-z][A-Za-z0-9_]*)\s*}}/g, (_, name: string) => { if (!allowed.has(name)) errors[field] = `Biến {{${name}}} không thuộc sự kiện này.`; return ''; });
    if (rest.includes('{{') || rest.includes('}}')) errors[field] = 'Biến nội dung phải có dạng {{tenBien}}.';
  }
  return errors;
}

export function manualNotificationVariables(event: NotificationEvent | undefined, template: NotificationTemplateInput | null) {
  const used = new Set([template?.subjectTemplate, template?.titleTemplate, template?.contentTemplate, template?.summaryTemplate].flatMap(text => [...(text ?? '').matchAll(/{{\s*([A-Za-z][A-Za-z0-9]*)\s*}}/g)].map(match => match[1])));
  return event?.variables.filter(variable => used.has(variable.name) && !['schoolName', 'branchName', 'actorName', 'actionUrl'].includes(variable.name)).map(variable => ({ ...variable, required: true })) ?? [];
}

export function missingNotificationValues(event: NotificationEvent | undefined, values: Record<string, string>): string[] {
  return event?.variables.filter(variable => variable.required && !['schoolName', 'branchName', 'actorName', 'actionUrl'].includes(variable.name) && !values[variable.name]?.trim()).map(variable => variable.label) ?? [];
}

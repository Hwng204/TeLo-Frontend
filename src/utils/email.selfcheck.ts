import { readEmailLocation, rememberEmailLocation, restoreEmailLocation, validateEmailEvent, emailScheduledUtc, emailDateTime, emailTargetKey, mergeEmailTargets, safeEmailActionUrl, validateEmailTemplate } from './email.ts';
import type { EmailTargetItem } from '../types/email.ts';
let checks = 0;
const check = (ok: boolean, message: string) => { if (!ok) throw new Error(message); checks++; };
const events = [{ code: 'EXAM', name: 'Bài thi', variables: ['Name'] }];
const form = { code: 'EXAM_MAIL', name: 'Thông báo', eventCode: 'EXAM', subject: 'Chào {{Name}}', body: 'Nội dung', version: 0 };
check(!Object.keys(validateEmailTemplate(form, events)).length, 'Valid template');
check(!!validateEmailTemplate({ ...form, subject: 'Injected\r\nHeader' }, events).subject, 'Reject subject header injection');
check(!!validateEmailTemplate({ ...form, body: '{{Unknown}}' }, events).body, 'Reject unknown variable');
check(!!validateEmailTemplate({ ...form, body: '{{Name' }, events).body, 'Reject malformed variable');
check(!!validateEmailTemplate({ ...form, body: 'a'.repeat(10001) }, events).body, 'Reject oversize body');
check(!!validateEmailTemplate({ ...form, name: ' ' }, events).name, 'Reject empty name');
check(!!validateEmailTemplate({ ...form, eventCode: 'OTHER' }, events).eventCode, 'Reject unknown event');
const included: EmailTargetItem = { userId: 1, roleId: null, action: 'INCLUDE' };
const merged = mergeEmailTargets([included], [{ ...included, action: 'EXCLUDE' }, { roleId: 1, userId: null, action: 'INCLUDE' }]);
check(merged.length === 2 && merged[0].action === 'EXCLUDE', 'Deduplicate target and replace action across pages');
check(emailTargetKey(included) !== emailTargetKey(merged[1]), 'Role and user identifiers are distinct');
check(safeEmailActionUrl('javascript:alert(1)') === null, 'Reject script URL');
check(safeEmailActionUrl('/exams/1') === '/exams/1', 'Allow local action');
check(emailDateTime('2026-10-05T00:00:00') === emailDateTime('2026-10-05T00:00:00Z'), 'Interpret MySQL timestamps as UTC');
check(emailDateTime('invalid') === '—', 'Handle invalid timestamps');
const eventForm = { code: 'STAFF_MEETING', name: 'Meeting', description: '', version: 0, variableDefinitions: [] };
check(!Object.keys(validateEmailEvent(eventForm)).length, 'Accept manual event without custom variables');
check(!!validateEmailEvent({ ...eventForm, code: 'A'.repeat(95) }).code, 'Event code leaves room for config prefix');
check(!!validateEmailEvent({ ...eventForm, variableDefinitions: [{ name: 'schoolName', label: 'Name', type: 'TEXT', required: true }] }).variableDefinitions, 'Reject reserved variable');
check(!!validateEmailEvent({ ...eventForm, variableDefinitions: [{ name: 'topic', label: 'Topic', type: 'TEXT', required: true }, { name: 'TOPIC', label: 'Topic', type: 'TEXT', required: true }] }).variableDefinitions, 'Reject duplicate variables ignoring case');
check(emailScheduledUtc('2026-10-06T15:00') === '2026-10-06T08:00:00.000Z', 'Schedule uses Vietnam timezone');
check(emailScheduledUtc('2027-02-30T12:00') === null, 'Reject impossible schedule date');
check(emailScheduledUtc('invalid') === null, 'Reject malformed schedule');


const remembered = '?schoolId=2&tab=configuration&eventCode=STAFF_MEETING';
check(restoreEmailLocation('', remembered).get('eventCode') === 'STAFF_MEETING', 'Restore saved event when opening sidebar');
check(restoreEmailLocation('?schoolId=3', remembered).get('eventCode') === null, 'Explicit school must not inherit another school event');
check(restoreEmailLocation('?schoolId=2&tab=history', remembered).get('tab') === 'history', 'Explicit URL takes priority');
check(restoreEmailLocation('', 'invalid').get('schoolId') === null, 'Malformed stored location is ignored');

const savedLocations = new Map<string, string>();
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
  getItem: (key: string) => savedLocations.get(key) ?? null,
  setItem: (key: string, value: string) => savedLocations.set(key, value),
} });
rememberEmailLocation('admin-1', new URLSearchParams('schoolId=2&eventCode=STAFF_MEETING'));
rememberEmailLocation('admin-1', new URLSearchParams('schoolId=3&eventCode=OTHER'));
check(new URLSearchParams(readEmailLocation('admin-1', 2) ?? '').get('eventCode') === 'STAFF_MEETING', 'Switching schools preserves each school event');
check(readEmailLocation('admin-2', 2) === null, 'Remembered selection is isolated by account');
check(new URLSearchParams(readEmailLocation('admin-1') ?? '').get('schoolId') === '3', 'Sidebar restores last selected school');

console.log(`[email] ${checks} self-checks passed`);

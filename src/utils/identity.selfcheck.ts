import { validateIdentity, validateRole, toggleSelection, identityConflict, canAssignRole, identityError, identityPageWithinRange } from './identity.ts';
import type { IdentityUser, RoleItem } from '../types/identity.ts';
const assert = {
  ok(value: unknown) {
    if (!value) throw new Error('Expected truthy value');
  },
  deepEqual(actual: unknown, expected: unknown) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  },
};

const valid = {
  code: 'SCHOOL_ADMIN',
  name: 'Quản trị trường',
  description: null
};
assert.deepEqual(validateIdentity(valid), {});
assert.ok(validateIdentity({ ...valid, code: 'a' }).code);
assert.ok(validateIdentity({ ...valid, code: ' Tiếng Việt ' }).code);
assert.ok(validateIdentity({ ...valid, name: ' '.repeat(10) }).name);
assert.ok(validateIdentity({ ...valid, description: 'a'.repeat(501) }).description);
assert.ok(validateRole({
  ...valid,
  schoolId: null,
  schoolBranchId: 2
}).scope);
assert.deepEqual(toggleSelection([1, 50], 2), [1, 50, 2]);
assert.deepEqual(toggleSelection([1, 50, 2], 50), [1, 2]);
assert.ok(identityConflict({ isAxiosError: true, response: { status: 409, data: { error: { code: 'STALE_VERSION' } } } }));
assert.ok(!identityConflict({ isAxiosError: true, response: { status: 409, data: { error: { code: 'CONFLICT' } } } }));
const role: RoleItem = {
  ...valid,
  id: 1,
  status: 'ACTIVE',
  version: 1,
  canDelete: true,
  schoolId: 10,
  schoolName: 'A',
  schoolBranchId: 20,
  schoolBranchName: 'B',
  isSystem: false,
  userCount: 0
};
const user: IdentityUser = {
  id: 1,
  username: 'test',
  fullName: 'Test',
  email: 'test@example.test',
  status: 'ACTIVE',
  schoolId: 10,
  schoolName: 'A',
  schoolBranchId: 20,
  schoolBranchName: 'B',
  version: 1
};
assert.ok(canAssignRole(role, user));
assert.ok(!canAssignRole({ ...role, schoolId: 11 }, user));
assert.ok(!canAssignRole({ ...role, schoolBranchId: 21 }, user));
assert.ok(!canAssignRole({ ...role, status: 'INACTIVE' }, user));
assert.ok(canAssignRole({
  ...role,
  schoolId: null,
  schoolBranchId: null
}, user));
assert.deepEqual(identityPageWithinRange(3, 20, 41), 3);
assert.deepEqual(identityPageWithinRange(3, 20, 40), 2);
assert.deepEqual(identityPageWithinRange(2, 10, 0), 1);
assert.deepEqual(identityError({
  isAxiosError: true, response: {
    status: 422, data: {
      error: {
        code: 'VALIDATION',
        message: 'Invalid',
        details: { name: ['Tên bắt buộc.'] }
      }
    }
  }
}), 'Tên bắt buộc.');
assert.deepEqual(identityError({ isAxiosError: true, response: { status: 400, data: { title: 'Bad Request', errors: { Name: ['Tên không hợp lệ.'] } } } }), 'Tên không hợp lệ.');
assert.deepEqual(identityError({ isAxiosError: true, response: { status: 403, data: { detail: 'Không đủ quyền.' } } }), 'Không đủ quyền.');
assert.deepEqual(identityError(new Error('Network failure')), 'Không kết nối được máy chủ.');
console.log('[identity] 22 self-checks passed');

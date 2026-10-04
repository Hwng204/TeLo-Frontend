import { useState, type FormEvent } from 'react';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { useAsync } from '../../../hooks/useAsync';
import { useBusy } from '../../../hooks/useBusy';
import { api } from '../../../services/api';
import type { CreateUserRequest, IdentityUser, RoleItem, UpdateUserRequest, UserDetail, UserStatus } from '../../../types';
import { emptyScope, identityConflict, identityError, validateCreateUser, validateUpdateUser } from '../../../utils/identity';
import { toProblem } from '../../../utils/problem';
import { IdentityDialog, IdentityState } from './IdentityUi';
import { ScopeFields, type ScopeValue } from './ScopeFields';

type UserEditorProps = {
  item?: IdentityUser;
  admin?: boolean;
  onClose: () => void;
  onSaved: () => void;
  onConflict: () => void;
  onDelete?: (user: IdentityUser) => void;
};

type UserFormProps = UserEditorProps & {
  detail?: UserDetail;
  adminRole?: RoleItem;
  adminRoleLoading: boolean;
  adminRoleError: unknown;
};

function UserForm({ detail, admin = false, adminRole, adminRoleLoading, adminRoleError, onClose, onSaved, onConflict, onDelete }: UserFormProps) {
  const [username, setUsername] = useState(detail?.username ?? '');
  const [email, setEmail] = useState(detail?.email ?? '');
  const [fullName, setFullName] = useState(detail?.fullName ?? '');
  const [moetIdentifier, setMoetIdentifier] = useState(detail?.moetIdentifier ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<UserStatus>(detail?.status ?? 'ACTIVE');
  const [scope, setScope] = useState<ScopeValue>(detail ?? emptyScope);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState('');
  const [stale, setStale] = useState(false);
  const [busy, run] = useBusy();
  const editing = Boolean(detail);

  const save = (event: FormEvent) => {
    event.preventDefault();
    const fields = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      moetIdentifier: moetIdentifier.trim() || null,
      schoolBranchId: scope.schoolBranchId,
    };
    const update: UpdateUserRequest = { ...fields, version: detail?.version ?? 0 };
    const create: CreateUserRequest = {
      ...fields,
      password,
      status: admin ? 'ACTIVE' : status,
      roleIds: adminRole ? [adminRole.id] : [],
    };
    const nextErrors = editing ? validateUpdateUser(update) : validateCreateUser(create, confirmPassword);
    if (!admin && scope.schoolId && !scope.schoolBranchId) {
      nextErrors.schoolBranchId = 'Hãy chọn phân hiệu của tài khoản hoặc bỏ chọn trường.';
    }
    if (admin && !adminRole) nextErrors.roleIds = 'Không tìm thấy vai trò Admin đang hoạt động.';
    setErrors(nextErrors);
    setFailure('');
    if (Object.keys(nextErrors).length) return;

    void run(async () => {
      try {
        if (detail) await api.identity.updateUser(detail.id, update);
        else await api.identity.createUser(create);
        onSaved();
      } catch (error) {
        const problem = toProblem(error);
        setErrors(current => ({ ...current, ...problem.fieldErrors }));
        setFailure(identityError(error));
        if (identityConflict(error)) {
          setStale(true);
          onConflict();
        }
      }
    });
  };

  return <form onSubmit={save} noValidate autoComplete="off" className="identity-form identity-user-form">
    {failure && <div className="sep-alert" role="alert">{failure}</div>}
    {stale && <p className="sep-alert sep-alert--info">Dữ liệu đã thay đổi. Đóng biểu mẫu và mở lại để lấy phiên bản mới nhất.</p>}
    {admin && <div className="sep-alert sep-alert--info">
      Tài khoản sẽ được gán vai trò <strong>{adminRole?.name ?? 'Admin'}</strong> trên toàn hệ thống và phải đăng nhập bằng mật khẩu mới bên dưới.
    </div>}
    {Boolean(adminRoleError) && <div className="sep-alert" role="alert">{identityError(adminRoleError)}</div>}
    <fieldset disabled={busy || stale || adminRoleLoading}>
      <div className="identity-form-grid">
        <Field
          label="Tài khoản *"
          required
          autoComplete="off"
          name="managed_username"
          value={username}
          maxLength={100}
          onChange={event => setUsername(event.target.value)}
          error={errors.username}
        />
        <Field
          label="Họ và tên *"
          required
          autoComplete="off"
          name="managed_full_name"
          value={fullName}
          maxLength={255}
          onChange={event => setFullName(event.target.value)}
          error={errors.fullName}
        />
        <Field
          label="Email *"
          required
          type="email"
          autoComplete="off"
          name="managed_email"
          value={email}
          maxLength={254}
          onChange={event => setEmail(event.target.value)}
          error={errors.email}
        />
        <Field
          label="Mã định danh Bộ GD"
          autoComplete="off"
          name="managed_moet_identifier"
          value={moetIdentifier}
          maxLength={100}
          onChange={event => setMoetIdentifier(event.target.value)}
          error={errors.moetIdentifier}
        />
        {!editing && <>
          <Field
            label="Mật khẩu *"
            required
            type="password"
            autoComplete="new-password"
            value={password}
            maxLength={128}
            onChange={event => setPassword(event.target.value)}
            error={errors.password}
            hint="12–128 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt."
          />
          <Field
            label="Nhập lại mật khẩu *"
            required
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            maxLength={128}
            onChange={event => setConfirmPassword(event.target.value)}
            error={errors.confirmPassword}
          />
        </>}
        {!editing && !admin && <SelectField label="Trạng thái" value={status} onChange={event => setStatus(event.target.value as UserStatus)}>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Ngừng hoạt động</option>
        </SelectField>}
      </div>
      {!admin && <>
        <ScopeFields value={scope} onChange={setScope} />
        {errors.schoolBranchId && <p className="pcb-error" role="alert">{errors.schoolBranchId}</p>}
        <p className="sep-muted">Tài khoản thuộc trường phải chọn một phân hiệu cụ thể.</p>
      </>}
      {admin && <p className="sep-muted">Phạm vi: Toàn hệ thống. Không gắn tài khoản Admin với một trường hoặc phân hiệu cụ thể.</p>}
      {editing && <p className="sep-muted">Đổi tài khoản, email hoặc phân hiệu sẽ yêu cầu người dùng đăng nhập lại.</p>}
      {errors.roleIds && <p className="pcb-error" role="alert">{errors.roleIds}</p>}
    </fieldset>
    <div className="sep-actions">
      {detail && onDelete && <div className="sep-actions__lead">
        <PcbButton variant="danger" onClick={() => onDelete(detail)} disabled={busy}>Xóa tài khoản</PcbButton>
      </div>}
      <PcbButton variant="secondary" onClick={onClose} disabled={busy}>Hủy</PcbButton>
      <PcbButton type="submit" disabled={busy || stale || adminRoleLoading}>
        {busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : admin ? 'Tạo tài khoản Admin' : 'Tạo tài khoản'}
      </PcbButton>
    </div>
  </form>;
}

export function UserEditor(props: UserEditorProps) {
  const detail = useAsync(
    () => props.item ? api.identity.user(props.item.id) : Promise.resolve(undefined),
    [props.item?.id],
  );
  const adminRoles = useAsync(
    () => props.admin ? api.roles.list({ search: 'ADMIN', status: 'ACTIVE', page: 1, pageSize: 100 }) : Promise.resolve(undefined),
    [props.admin],
  );
  const adminRole = adminRoles.data?.items.find(role => role.code.toUpperCase() === 'ADMIN')
    ?? adminRoles.data?.items.find(role => role.code.toUpperCase() === 'OPERATIONALADMIN');
  const loading = Boolean(props.item && detail.loading);

  return <IdentityDialog
    title={props.item ? `Chỉnh sửa · ${props.item.username}` : props.admin ? 'Thêm tài khoản Admin' : 'Thêm tài khoản'}
    onClose={props.onClose}
    className="identity-dialog--user"
  >
    {props.item && <IdentityState {...detail} count={detail.data ? 1 : 0} />}
    {!loading && (!props.item || detail.data) && <UserForm
      key={detail.data?.version ?? (props.admin ? 'admin' : 'new')}
      {...props}
      detail={detail.data}
      adminRole={adminRole}
      adminRoleLoading={Boolean(props.admin && adminRoles.loading)}
      adminRoleError={props.admin ? adminRoles.error : null}
    />}
  </IdentityDialog>;
}

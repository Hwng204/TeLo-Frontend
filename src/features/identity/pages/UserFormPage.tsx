import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { useAsync } from '../../../hooks/useAsync';
import { useBusy } from '../../../hooks/useBusy';
import { api } from '../../../services/api';
import type { CreateUserRequest, RoleItem, UpdateUserRequest, UserDetail, UserStatus } from '../../../types';
import { displayToast } from '../../../utils/toast';
import { emptyScope, identityConflict, identityError, validateCreateUser, validateUpdateUser } from '../../../utils/identity';
import { toProblem } from '../../../utils/problem';
import { ScopeFields, type ScopeValue } from '../components/ScopeFields';
import './identity.css';

type Props = { mode: 'create' | 'edit'; admin?: boolean };

type FormProps = Props & {
  detail?: UserDetail;
  adminRole?: RoleItem;
  adminRoleLoading: boolean;
  adminRoleError: unknown;
  reload: () => void;
};

const PasswordToggle = ({ visible, onClick, label }: { visible: boolean; onClick: () => void; label: string }) => (
  <button type="button" className="identity-password-toggle" aria-label={label} title={label} onClick={onClick}>
    <Icon name={visible ? 'visibility_off' : 'visibility'} size={20} />
  </button>
);

function UserForm({ mode, admin = false, detail, adminRole, adminRoleLoading, adminRoleError, reload }: FormProps) {
  const navigate = useNavigate();
  const editing = mode === 'edit';
  const [username, setUsername] = useState(detail?.username ?? '');
  const [email, setEmail] = useState(detail?.email ?? '');
  const [fullName, setFullName] = useState(detail?.fullName ?? '');
  const [moetIdentifier, setMoetIdentifier] = useState(detail?.moetIdentifier ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<UserStatus>(detail?.status ?? 'ACTIVE');
  const [scope, setScope] = useState<ScopeValue>(detail ?? emptyScope);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState('');
  const [stale, setStale] = useState(false);
  const [busy, run] = useBusy();

  const save = (event: FormEvent) => {
    event.preventDefault();
    const fields = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      moetIdentifier: moetIdentifier.trim() || null,
      schoolBranchId: scope.schoolBranchId,
    };
    const update: UpdateUserRequest = {
      ...fields,
      newPassword: password || null,
      version: detail?.version ?? 0,
    };
    const create: CreateUserRequest = {
      ...fields,
      password,
      status: admin ? 'ACTIVE' : status,
      roleIds: adminRole ? [adminRole.id] : [],
    };
    const nextErrors = editing
      ? validateUpdateUser(update, confirmPassword)
      : validateCreateUser(create, confirmPassword);
    if (!admin && scope.schoolId && !scope.schoolBranchId) {
      nextErrors.schoolBranchId = 'Hãy chọn phân hiệu của tài khoản hoặc bỏ chọn trường.';
    }
    if (admin && !adminRole) nextErrors.roleIds = 'Không tìm thấy vai trò Admin đang hoạt động.';
    setErrors(nextErrors);
    setFailure('');
    if (Object.keys(nextErrors).length > 0) return;

    void run(async () => {
      try {
        if (editing && detail) await api.identity.updateUser(detail.id, update);
        else await api.identity.createUser(create);
        displayToast('success', 'Thành công', editing ? 'Đã cập nhật tài khoản.' : 'Đã tạo tài khoản.');
        navigate('/users');
      } catch (error) {
        const problem = toProblem(error);
        setErrors(current => ({ ...current, ...problem.fieldErrors }));
        setFailure(identityError(error));
        if (identityConflict(error)) {
          setStale(true);
          reload();
        }
      }
    });
  };

  return <form onSubmit={save} noValidate autoComplete="off" className="identity-form identity-user-form identity-user-form--page">
    {failure && <div className="sep-alert" role="alert">{failure}</div>}
    {stale && <div className="sep-alert sep-alert--info" role="alert">
      Dữ liệu đã thay đổi ở nơi khác. Hãy quay lại danh sách và mở lại tài khoản để lấy phiên bản mới nhất.
    </div>}
    {admin && <div className="sep-alert sep-alert--info">
      Tài khoản sẽ được gán vai trò <strong>{adminRole?.name ?? 'Admin'}</strong> trên toàn hệ thống.
    </div>}
    {Boolean(adminRoleError) && <div className="sep-alert" role="alert">{identityError(adminRoleError)}</div>}

    <fieldset disabled={busy || stale || adminRoleLoading}>
      <section className="identity-panel identity-form-section">
        <h2>Thông tin tài khoản</h2>
        <div className="identity-form-grid">
          <Field label="Tài khoản *" required name="managed_username" value={username} maxLength={100}
            onChange={event => setUsername(event.target.value)} error={errors.username} />
          <Field label="Họ và tên *" required name="managed_full_name" value={fullName} maxLength={255}
            onChange={event => setFullName(event.target.value)} error={errors.fullName} />
          <Field label="Email *" required type="email" name="managed_email" value={email} maxLength={254}
            onChange={event => setEmail(event.target.value)} error={errors.email} />
          <Field label="Mã định danh Bộ GD" name="managed_moet_identifier" value={moetIdentifier} maxLength={100}
            onChange={event => setMoetIdentifier(event.target.value)} error={errors.moetIdentifier} />
          {!editing && !admin && <SelectField label="Trạng thái" value={status}
            onChange={event => setStatus(event.target.value as UserStatus)}>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
          </SelectField>}
        </div>
      </section>

      <section className="identity-panel identity-form-section">
        <h2>{editing ? 'Cập nhật mật khẩu' : 'Mật khẩu'}</h2>
        {editing && <p className="sep-muted">
          Hệ thống không lưu mật khẩu dạng đọc được. Để trống hai ô dưới nếu không muốn đổi mật khẩu.
        </p>}
        <div className="identity-form-grid">
          <Field
            label={editing ? 'Mật khẩu mới' : 'Mật khẩu *'}
            required={!editing}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            maxLength={128}
            onChange={event => setPassword(event.target.value)}
            error={editing ? errors.newPassword : errors.password}
            hint="12–128 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt."
            trailing={<PasswordToggle visible={showPassword} onClick={() => setShowPassword(value => !value)}
              label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} />}
          />
          <Field
            label={editing ? 'Nhập lại mật khẩu mới' : 'Nhập lại mật khẩu *'}
            required={!editing}
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            maxLength={128}
            onChange={event => setConfirmPassword(event.target.value)}
            error={errors.confirmPassword}
            trailing={<PasswordToggle visible={showConfirmPassword} onClick={() => setShowConfirmPassword(value => !value)}
              label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'} />}
          />
        </div>
      </section>

      {!admin && <section className="identity-panel identity-form-section">
        <h2>Phạm vi tài khoản</h2>
        <ScopeFields value={scope} onChange={setScope} />
        {errors.schoolBranchId && <p className="pcb-error" role="alert">{errors.schoolBranchId}</p>}
        <p className="sep-muted">Tài khoản thuộc trường phải chọn một phân hiệu cụ thể.</p>
      </section>}
      {admin && <section className="identity-panel identity-form-section">
        <h2>Phạm vi tài khoản</h2>
        <p className="sep-muted">Toàn hệ thống. Tài khoản Admin không gắn với một trường hoặc phân hiệu cụ thể.</p>
        {errors.roleIds && <p className="pcb-error" role="alert">{errors.roleIds}</p>}
      </section>}
    </fieldset>

    <div className="sep-actions identity-form-actions">
      <PcbButton variant="secondary" onClick={() => navigate('/users')} disabled={busy}>Hủy</PcbButton>
      <PcbButton type="submit" disabled={busy || stale || adminRoleLoading || (editing && !detail)}>
        {busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : admin ? 'Tạo tài khoản Admin' : 'Tạo tài khoản'}
      </PcbButton>
    </div>
  </form>;
}

export function UserFormPage({ mode, admin = false }: Props) {
  const navigate = useNavigate();
  const params = useParams();
  const userId = mode === 'edit' ? Number(params.id) : null;
  const detail = useAsync(
    () => userId && Number.isSafeInteger(userId) ? api.identity.user(userId) : Promise.resolve(undefined),
    [userId],
  );
  const adminRoles = useAsync(
    () => admin ? api.roles.list({ search: 'ADMIN', status: 'ACTIVE', page: 1, pageSize: 100 }) : Promise.resolve(undefined),
    [admin],
  );
  const adminRole = adminRoles.data?.items.find(role => role.code.toUpperCase() === 'ADMIN')
    ?? adminRoles.data?.items.find(role => role.code.toUpperCase() === 'OPERATIONALADMIN');
  const loading = mode === 'edit' && detail.loading;
  const invalidId = mode === 'edit' && (!userId || !Number.isSafeInteger(userId));

  return <div className="sep-page identity-page identity-user-form-page">
    <PageHeader
      title={mode === 'edit' ? `Chỉnh sửa tài khoản${detail.data ? ` · ${detail.data.username}` : ''}` : admin ? 'Thêm tài khoản Admin' : 'Thêm tài khoản'}
      onBack={() => navigate('/users')}
      inline
    />
    {invalidId && <div className="sep-alert" role="alert">Mã tài khoản không hợp lệ.</div>}
    {detail.error != null && <div className="sep-alert" role="alert">{identityError(detail.error)}</div>}
    {loading && <div className="identity-page-loading" role="status">Đang tải thông tin tài khoản…</div>}
    {!invalidId && !loading && (mode === 'create' || detail.data) && <UserForm
      key={detail.data?.version ?? (admin ? 'admin' : 'new')}
      mode={mode}
      admin={admin}
      detail={detail.data}
      adminRole={adminRole}
      adminRoleLoading={Boolean(admin && adminRoles.loading)}
      adminRoleError={admin ? adminRoles.error : null}
      reload={detail.reload}
    />}
  </div>;
}

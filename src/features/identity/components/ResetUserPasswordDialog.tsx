import { useState, type FormEvent } from 'react';
import { Field, PcbButton } from '../../../components/pcb';
import { useBusy } from '../../../hooks/useBusy';
import { api } from '../../../services/api';
import type { IdentityUser } from '../../../types';
import { identityConflict, identityError, validatePassword } from '../../../utils/identity';
import { toProblem } from '../../../utils/problem';
import { IdentityDialog } from './IdentityUi';

export function ResetUserPasswordDialog({ user, onClose, onSaved, onConflict }: {
  user: IdentityUser;
  onClose: () => void;
  onSaved: () => void;
  onConflict: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState('');
  const [stale, setStale] = useState(false);
  const [busy, run] = useBusy();

  const save = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const passwordError = validatePassword(password);
    if (passwordError) nextErrors.newPassword = passwordError;
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Mật khẩu nhập lại không khớp.';
    setErrors(nextErrors);
    setFailure('');
    if (Object.keys(nextErrors).length) return;
    void run(async () => {
      try {
        await api.identity.resetUserPassword(user.id, password, user.version);
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

  return <IdentityDialog title={`Đặt lại mật khẩu · ${user.username}`} onClose={onClose} busy={busy}>
    <form onSubmit={save} noValidate className="identity-form">
      <p className="sep-muted">Mật khẩu hiện tại không thể xem lại vì được lưu dưới dạng mã hóa một chiều. Sau khi đặt lại, mọi phiên đăng nhập cũ sẽ hết hiệu lực.</p>
      {failure && <div className="sep-alert" role="alert">{failure}</div>}
      {stale && <p className="sep-alert sep-alert--info">Dữ liệu đã thay đổi. Đóng hộp thoại và thử lại.</p>}
      <fieldset disabled={busy || stale}>
        <Field
          label="Mật khẩu mới *"
          required
          type="password"
          autoComplete="new-password"
          value={password}
          maxLength={128}
          onChange={event => setPassword(event.target.value)}
          error={errors.newPassword}
          hint="12–128 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt."
        />
        <Field
          label="Nhập lại mật khẩu mới *"
          required
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          maxLength={128}
          onChange={event => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
        />
      </fieldset>
      <div className="sep-actions">
        <PcbButton variant="secondary" onClick={onClose} disabled={busy}>Hủy</PcbButton>
        <PcbButton type="submit" disabled={busy || stale}>{busy ? 'Đang lưu…' : 'Đặt lại mật khẩu'}</PcbButton>
      </div>
    </form>
  </IdentityDialog>;
}

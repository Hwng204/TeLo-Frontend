import { useState, type FormEvent } from 'react';
import { Field, PcbButton } from '../../../components/pcb';
import { useBusy } from '../../../hooks/useBusy';
import { api } from '../../../services/api';
import type { ModuleItem, RoleItem } from '../../../types';
import { emptyScope, identityConflict, identityError, validateIdentity, validateRole } from '../../../utils/identity';
import { IdentityDialog } from './IdentityUi';
import { ScopeFields, type ScopeValue } from './ScopeFields';

export function IdentityEditor({ kind, item, onClose, onSaved, onConflict }: {
  kind: 'role' | 'module';
  item?: RoleItem | ModuleItem;
  onClose: () => void;
  onSaved: () => void;
  onConflict: () => void
}) {
  const role = item && 'isSystem' in item ? item : undefined;
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [scope, setScope] = useState<ScopeValue>(role ?? emptyScope);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState('');
  const [stale, setStale] = useState(false);
  const [busy, run] = useBusy();
  const label = kind === 'role' ? 'vai trò' : 'module';
  const save = (event: FormEvent) => {
    event.preventDefault();
    const body = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim() || null,
      schoolId: scope.schoolId,
      schoolBranchId: scope.schoolBranchId
    };
    const nextErrors = kind === 'role' ? validateRole(body) : validateIdentity(body);
    setErrors(nextErrors);
    setFailure('');
    if (Object.keys(nextErrors).length) return;
    void run(async () => {
      try {
        if (kind === 'role') {
          if (item) {
            await api.roles.update(item.id, { ...body, version: item.version });
          } else {
            await api.roles.create(body);
          }
        } else {
          if (item) {
            await api.modules.update(item.id, { ...body, version: item.version });
          } else {
            await api.modules.create(body);
          }
        }
        onSaved();
      } catch (error) {
        setFailure(identityError(error));
        if (identityConflict(error)) {
          setStale(true);
          onConflict();
        }
      }
    });
  };
  return <IdentityDialog
    title={`${item ? 'Chỉnh sửa' : 'Thêm'} ${label}`}
    busy={busy}
    onClose={onClose}
  >
    <form
      onSubmit={save}
      noValidate
      className="identity-form"
    >
      {failure && <div className="sep-alert" role="alert">
        {failure}
      </div>}
      {stale && <p className="sep-alert sep-alert--info">Đóng biểu mẫu và mở lại để lấy dữ liệu mới nhất trước khi tiếp tục.</p>}
      <fieldset disabled={busy || stale}>
        <Field
          label={`Mã ${label} *`}
          required
          value={code}
          maxLength={100}
          disabled={!!item}
          onChange={event => setCode(event.target.value)}
          error={errors.code}
          aria-invalid={!!errors.code}
          hint={item ? 'Mã được giữ nguyên để bảo toàn liên kết dữ liệu.' : '2–100 ký tự chữ không dấu, số, gạch ngang, gạch dưới.'}
        />
        <Field
          label={`Tên ${label} *`}
          required
          value={name}
          maxLength={150}
          onChange={event => setName(event.target.value)}
          error={errors.name}
          aria-invalid={!!errors.name}
        />
        <label className="identity-description">Mô tả<textarea
          value={description}
          maxLength={500}
          rows={3}
          onChange={event => setDescription(event.target.value)}
          aria-invalid={!!errors.description}
        /><small>{description.length}/500 ký tự</small></label>
        {errors.description && <p role="alert" className="pcb-error">
          {errors.description}
        </p>}
        {kind === 'role' && <>
          <ScopeFields
            value={scope}
            onChange={setScope}
            disabled={role?.isSystem}
          />
          <p className="sep-muted">
            {role?.isSystem ? 'Phạm vi của vai trò hệ thống được bảo vệ.' : 'Không chọn trường: áp dụng toàn hệ thống. Chọn trường hoặc phân hiệu để giới hạn nơi có thể gán vai trò.'}
          </p>
        </>}
        {errors.scope && <p role="alert" className="pcb-error">
          {errors.scope}
        </p>}
      </fieldset>
      <div className="sep-actions">
        <PcbButton
          variant="secondary"
          onClick={onClose}
          disabled={busy}
        >Hủy</PcbButton>
        <PcbButton type="submit" disabled={busy || stale}>
          {busy ? 'Đang lưu…' : 'Lưu'}
        </PcbButton>
      </div>
    </form>
  </IdentityDialog>;
}

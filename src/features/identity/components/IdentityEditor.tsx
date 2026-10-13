import { useState, type FormEvent } from 'react';
import { Field, Icon, PcbButton } from '../../../components/pcb';
import { useBusy } from '../../../hooks/useBusy';
import { api } from '../../../services/api';
import type { ModuleItem, RoleItem } from '../../../types';
import { emptyScope, identityConflict, identityError, validateIdentity, validateRole } from '../../../utils/identity';
import { IdentityDialog } from './IdentityUi';
import { ScopeFields, type ScopeValue } from './ScopeFields';
import { displayToast } from '../../../utils/toast';

export function IdentityEditor({ kind, item, initialScope, onClose, onSaved, onConflict }: {
  kind: 'role' | 'module';
  item?: RoleItem | ModuleItem;
  initialScope?: ScopeValue;
  onClose: () => void;
  onSaved: () => void;
  onConflict: () => void
}) {
  const role = item && 'isSystem' in item ? item : undefined;
  const protectedScope = role?.isSystem || ['ADMIN', 'OPERATIONALADMIN'].includes(role?.code.toUpperCase() ?? '');
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [scope, setScope] = useState<ScopeValue>(role ?? initialScope ?? emptyScope);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    const nextErrors = kind === 'role' ? validateRole(body, !!item) : validateIdentity(body);
    setErrors(nextErrors);
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
        displayToast('error', 'Lỗi', identityError(error), 5);
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
    icon={kind === 'role' ? 'shield' : 'widgets'}
    className={`identity-dialog--${kind}`}
  >
    <form
      onSubmit={save}
      noValidate
      className="identity-form"
    >
      {stale && <p className="sep-alert sep-alert--info">Đóng biểu mẫu và mở lại để lấy dữ liệu mới nhất trước khi tiếp tục.</p>}
      <fieldset disabled={busy || stale}>
        <div className="identity-form-grid">
        <Field
          label={<>Mã {label} <span className="identity-required" aria-hidden="true">*</span></>}
          required
          value={code}
          maxLength={100}
          disabled={!!item}
          onChange={event => setCode(event.target.value)}
          error={errors.code}
          aria-invalid={!!errors.code}
        />
        <Field
          label={<>Tên {label} <span className="identity-required" aria-hidden="true">*</span></>}
          required
          value={name}
          maxLength={150}
          onChange={event => setName(event.target.value)}
          error={errors.name}
          aria-invalid={!!errors.name}
        />
        </div>
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
            disabled={protectedScope}
            schoolOnly={!role?.schoolBranchId}
            required={!item}
            allowAllSchools
          />
          {errors.schoolId && <p role="alert" className="pcb-error">{errors.schoolId}</p>}
          {errors.schoolBranchId && <p role="alert" className="pcb-error">{errors.schoolBranchId}</p>}
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
        ><Icon name="close" />Hủy</PcbButton>
        <PcbButton type="submit" disabled={busy || stale}>
          <Icon name="save" />{busy ? 'Đang lưu…' : `Lưu ${label}`}
        </PcbButton>
      </div>
    </form>
  </IdentityDialog>;
}

import { useState } from 'react';
import { Icon, PcbButton, PcbIconButton } from '../../../components/pcb';
import { useAsync } from '../../../hooks/useAsync';
import { useDebounce } from '../../../hooks/useDebounce';
import { api } from '../../../services/api';
import type { IdentityScope, RoleItem } from '../../../types';
import { emptyScope } from '../../../utils/identity';
import { IdentityDialog, IdentityPager, IdentitySearch, IdentityState } from './IdentityUi';

export type ScopeValue = Pick<RoleItem, 'schoolId' | 'schoolName' | 'schoolBranchId' | 'schoolBranchName'>;

function ScopePicker({ kind, schoolId, allowAllSchools = false, onChoose, onClose }: {
  kind: 'school' | 'branch';
  schoolId?: number;
  allowAllSchools?: boolean;
  onChoose: (scope: IdentityScope | null) => void;
  onClose: () => void
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debounced = useDebounce(search, 300);
  const result = useAsync(() => api.identity.scopes({
    kind,
    schoolId,
    search: debounced,
    page,
    pageSize
  }), [kind, schoolId, debounced, page, pageSize]);
  return <IdentityDialog title={kind === 'school' ? 'Chọn trường' : 'Chọn phân hiệu'} icon={kind === 'school' ? 'school' : 'apartment'} onClose={onClose}>
    <IdentitySearch value={search} onChange={value => {
      setSearch(value);
      setPage(1);
    }} />
    <IdentityState {...result} count={(result.data?.items.length ?? 0) + (allowAllSchools ? 1 : 0)} />
    <ul className="identity-options">
      {allowAllSchools && <li>
        <span><strong>Tất cả các trường</strong></span>
        <PcbIconButton icon="check" label="Chọn tất cả các trường" onClick={() => onChoose(null)} />
      </li>}
      {result.data?.items.map(item => <li key={item.id}>
        <span>
          <strong>
            {item.name}
          </strong>
          <small>
            {item.code}
          </small>
        </span>
        <PcbIconButton
          icon="check"
          label={`Chọn ${item.name}`}
          onClick={() => onChoose(item)}
        />
      </li>)}
    </ul>
    <IdentityPager
      data={result.data}
      page={page}
      pageSize={pageSize}
      setPage={setPage}
      setPageSize={setPageSize}
      label={kind === 'school' ? 'trường' : 'phân hiệu'}
    />
  </IdentityDialog>;
}
export function ScopeFields({ value, onChange, disabled = false, filter = false, schoolOnly = false, required = false, allowAllSchools = false }: {
  value: ScopeValue;
  onChange: (value: ScopeValue) => void;
  disabled?: boolean;
  filter?: boolean;
  schoolOnly?: boolean;
  required?: boolean;
  allowAllSchools?: boolean;
}) {
  const [picker, setPicker] = useState<'school' | 'branch' | null>(null);
  return <div className="identity-scope">
    <div>
      <span className="pcb-label">Trường{required && <> <span className="identity-required" aria-hidden="true">*</span></>}</span>
      <div className="identity-actions">
        <PcbButton
          variant="secondary"
          disabled={disabled}
          onClick={() => setPicker('school')}
        >
          <Icon name="school" size={18} />
          {value.schoolName || (filter ? 'Tất cả trường' : allowAllSchools ? 'Tất cả các trường' : required ? 'Chọn trường áp dụng' : 'Toàn hệ thống')}
          <Icon name="expand_more" size={18} />
        </PcbButton>
        {value.schoolId && <PcbIconButton
          icon="close"
          label="Bỏ chọn trường"
          disabled={disabled}
          onClick={() => onChange(emptyScope)}
        />}
      </div>
    </div>
    {!schoolOnly && <div>
      <span className="pcb-label">Phân hiệu</span>
      <div className="identity-actions">
        <PcbButton
          variant="secondary"
          disabled={disabled || !value.schoolId}
          onClick={() => setPicker('branch')}
        >
          {value.schoolBranchName || 'Tất cả phân hiệu'}
        </PcbButton>
        {value.schoolBranchId && <PcbIconButton
          icon="close"
          label="Bỏ chọn phân hiệu"
          disabled={disabled}
          onClick={() => onChange({
            ...value,
            schoolBranchId: null,
            schoolBranchName: null
          })}
        />}
      </div>
    </div>}
    {picker && <ScopePicker
      kind={picker}
      schoolId={value.schoolId ?? undefined}
      allowAllSchools={allowAllSchools && picker === 'school'}
      onClose={() => setPicker(null)}
      onChoose={scope => {
        if (!scope) {
          onChange(emptyScope);
          setPicker(null);
          return;
        }
        onChange(picker === 'school' ? {
          ...emptyScope,
          schoolId: scope.id,
          schoolName: scope.name
        } : {
          ...value,
          schoolBranchId: scope.id,
          schoolBranchName: scope.name
        });
        setPicker(null);
      }}
    />}
  </div>;
}

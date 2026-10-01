import { useState } from 'react';
import { PcbButton } from '../../../components/pcb';
import { useAsync } from '../../../hooks/useAsync';
import { useDebounce } from '../../../hooks/useDebounce';
import { api } from '../../../services/api';
import type { IdentityScope, RoleItem } from '../../../types';
import { emptyScope } from '../../../utils/identity';
import { IdentityDialog, IdentityPager, IdentitySearch, IdentityState } from './IdentityUi';

export type ScopeValue = Pick<RoleItem, 'schoolId' | 'schoolName' | 'schoolBranchId' | 'schoolBranchName'>;

function ScopePicker({ kind, schoolId, onChoose, onClose }: {
  kind: 'school' | 'branch';
  schoolId?: number;
  onChoose: (scope: IdentityScope) => void;
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
  return <IdentityDialog title={kind === 'school' ? 'Chọn trường' : 'Chọn phân hiệu'} onClose={onClose}>
    <IdentitySearch value={search} onChange={value => {
      setSearch(value);
      setPage(1);
    }} />
    <IdentityState {...result} count={result.data?.items.length ?? 0} />
    <ul className="identity-options">
      {result.data?.items.map(item => <li key={item.id}>
        <span>
          <strong>
            {item.name}
          </strong>
          <small>
            {item.code}
          </small>
        </span>
        <PcbButton
          variant="secondary"
          size="sm"
          onClick={() => onChoose(item)}
          aria-label={`Chọn ${item.name}`}
        >Chọn</PcbButton>
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
export function ScopeFields({ value, onChange, disabled = false, filter = false }: {
  value: ScopeValue;
  onChange: (value: ScopeValue) => void;
  disabled?: boolean;
  filter?: boolean
}) {
  const [picker, setPicker] = useState<'school' | 'branch' | null>(null);
  return <div className="identity-scope">
    <div>
      <span className="pcb-label">Trường</span>
      <div className="identity-actions">
        <PcbButton
          variant="secondary"
          disabled={disabled}
          onClick={() => setPicker('school')}
        >
          {value.schoolName || (filter ? 'Tất cả trường' : 'Toàn hệ thống')}
        </PcbButton>
        {value.schoolId && <PcbButton
          variant="ghost"
          disabled={disabled}
          onClick={() => onChange(emptyScope)}
          aria-label="Bỏ chọn trường"
        >Bỏ chọn</PcbButton>}
      </div>
    </div>
    <div>
      <span className="pcb-label">Phân hiệu</span>
      <div className="identity-actions">
        <PcbButton
          variant="secondary"
          disabled={disabled || !value.schoolId}
          onClick={() => setPicker('branch')}
        >
          {value.schoolBranchName || 'Tất cả phân hiệu'}
        </PcbButton>
        {value.schoolBranchId && <PcbButton
          variant="ghost"
          disabled={disabled}
          onClick={() => onChange({
            ...value,
            schoolBranchId: null,
            schoolBranchName: null
          })}
          aria-label="Bỏ chọn phân hiệu"
        >Bỏ chọn</PcbButton>}
      </div>
    </div>
    {picker && <ScopePicker
      kind={picker}
      schoolId={value.schoolId ?? undefined}
      onClose={() => setPicker(null)}
      onChoose={scope => {
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

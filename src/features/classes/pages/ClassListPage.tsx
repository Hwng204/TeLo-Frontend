import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { Pager } from '../../../components/common/Pager';
import { RowAction, RowActionButton } from '../../../components/common/RowAction';
import { StatusPill } from '../../../components/common/StatusPill';
import { StatusTabs } from '../../../components/common/StatusTabs';
import { TableState } from '../../../components/common/TableState';
import { useAsync, useBusy, useDebounce, useDirectoryScope, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import type { ClassListItem, ClassStatus } from '../../../types';
import { branchLabel, CLASS_STATUS, statusOf } from '../../../utils/directory';
import { isTeacher } from '../../../utils/jwt';
import { toProblem } from '../../../utils/problem';

const STATUS_TABS: { value: ClassStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
];

/** SC-CL01. Nhà trường chỉ xem (giáo viên: chỉ lớp mình chủ nhiệm); admin xem + thêm/sửa/xoá theo trường đã chọn. */
export const ClassListPage = () => {
  const navigate = useNavigate();
  const scope = useDirectoryScope();
  const teacher = !scope.admin && isTeacher();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ClassStatus | ''>('');
  const [academicYearId, setAcademicYearId] = useState<number>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const popup = useNotice();
  const [busy, runExclusive] = useBusy();
  const debouncedKeyword = useDebounce(keyword, 300);

  const reference = useAsync(
    async () => (scope.ready ? api.directory.referenceData(undefined, scope.schoolId) : null),
    [scope.ready, scope.schoolId],
  );
  const years = reference.data?.academicYears ?? [];
  const grades = reference.data?.gradeLevels ?? [];
  const branches = reference.data?.schoolBranches ?? [];

  const query = {
    page,
    pageSize,
    search: debouncedKeyword.trim() || undefined,
    status: status || undefined,
    academicYearId,
  };
  const list = useAsync(
    async () => (scope.ready ? api.directory.classes(query, scope.schoolId) : null),
    [scope.ready, scope.schoolId, ...Object.values(query)],
  );
  const items = list.data?.items ?? [];
  const totalCount = list.data?.totalCount ?? 0;
  const filtered = Boolean(keyword || status || academicYearId);

  // Mọi thay đổi bộ lọc đều quay về trang 1, nếu không sẽ thấy trang trống.
  const onFilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };
  const reset = () => {
    setKeyword('');
    setStatus('');
    setAcademicYearId(undefined);
    setPage(1);
  };
  const numberOrUndefined = (raw: string) => (raw ? Number(raw) : undefined);

  const remove = (row: ClassListItem) => {
    if (!scope.schoolId) return;
    popup.confirm(`Xoá lớp ${row.name}? Lớp sẽ chuyển sang "Ngừng hoạt động" và vẫn giữ trong lịch sử học của học sinh.`, () => {
      void runExclusive(async () => {
        try {
          await api.directory.deleteClass(scope.schoolId!, row.id);
          popup.success(`Đã xoá lớp ${row.name}.`);
          list.reload();
        } catch (error) {
          popup.error(toProblem(error).message);
        }
      });
    }, 'Xoá lớp');
  };

  const error = list.error ?? reference.error ?? scope.schoolsError;
  const columns = 8;
  const title = scope.admin ? 'Quản lý lớp học' : teacher ? 'Lớp chủ nhiệm' : 'Lớp học';

  return (
    <>
      <PageHeader title={title} inline={scope.admin} />

      <div className={scope.admin ? 'sep-page sep-page--flush' : 'sep-page'}>

        <div className="sep-toolbar">
          <div className="sep-toolbar__filters">
            {scope.admin && (
              <SelectField
                label="Trường"
                hideLabel
                placeholder="Trường"
                value={scope.schoolId ?? ''}
                onChange={(event) => {
                  scope.setSchool(Number(event.target.value));
                  reset();
                }}
              >
                {scope.schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </SelectField>
            )}
            <Field
              label="Tìm kiếm"
              hideLabel
              leading="search"
              placeholder="Tìm lớp"
              value={keyword}
              fieldClassName="sep-toolbar__search"
              onChange={(event) => onFilter(setKeyword)(event.target.value)}
            />
            <SelectField
              label="Năm học"
              hideLabel
              placeholder="Năm học hiện tại"
              value={academicYearId ?? ''}
              onChange={(event) => onFilter(setAcademicYearId)(numberOrUndefined(event.target.value))}
            >
              <option value="">Năm học hiện tại</option>
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Trạng thái"
              hideLabel
              placeholder="Tất cả trạng thái"
              value={status}
              onChange={(event) => onFilter(setStatus)(event.target.value as ClassStatus | '')}
            >
              {STATUS_TABS.map((tab) => (
                <option key={tab.value} value={tab.value}>
                  {tab.label}
                </option>
              ))}
            </SelectField>
            {filtered && (
              <PcbButton variant="ghost" size="sm" onClick={reset}>
                Xoá lọc
              </PcbButton>
            )}
          </div>
          {scope.admin && (
            <div className="sep-toolbar__actions">
              <PcbButton disabled={!scope.schoolId} onClick={() => navigate(scope.withSchool('/classes/new'))}>
                Thêm lớp
                <Icon name="add" size={20} />
              </PcbButton>
            </div>
          )}
        </div>

        {error != null && <div className="sep-alert" role="alert">{toProblem(error).message}</div>}

        <div className="pcb-table-wrap">
          <table className="pcb-table">
            <thead>
              <tr>
                <th className="sep-col-index">STT</th>
                <th>Tên lớp</th>
                <th>Khối</th>
                <th>Năm học</th>
                <th>Cơ sở</th>
                <th>Giáo viên chủ nhiệm</th>
                <th>Sĩ số</th>
                <th>Trạng thái</th>
                <th className="sep-col-actions">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, index) => {
                const state = statusOf(CLASS_STATUS, row.status);
                return (
                  <tr key={row.id}>
                    <td className="sep-col-index">{(page - 1) * pageSize + index + 1}</td>
                    <td className="sep-nowrap">
                      <Link className="sep-row-link" to={scope.withSchool(`/classes/${row.id}`)}>
                        {row.name}
                      </Link>
                    </td>
                    <td className="sep-nowrap">{row.gradeLevelName}</td>
                    <td className="sep-nowrap">{row.academicYearName}</td>
                    <td className="sep-nowrap">{row.schoolBranchName}</td>
                    <td className="sep-nowrap">{row.homeroomTeacherName ?? <span className="sep-muted">Chưa phân công</span>}</td>
                    <td className="sep-nowrap">{row.studentCount}</td>
                    <td>
                      <StatusPill {...state} />
                    </td>
                    <td className="sep-col-actions">
                      <div className="sep-row-actions">
                        <RowAction to={scope.withSchool(`/classes/${row.id}`)} icon="visibility" label={`Xem lớp ${row.name}`} />
                        {scope.admin && (
                          <>
                            <RowAction to={scope.withSchool(`/classes/${row.id}/edit`)} icon="edit" label={`Sửa lớp ${row.name}`} />
                            {row.status === 'ACTIVE' && (
                              <RowActionButton icon="delete" label={`Xoá lớp ${row.name}`} disabled={busy} onClick={() => remove(row)} />
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <TableState
            loading={list.loading || !scope.ready}
            failed={error != null}
            empty={items.length === 0}
            columns={columns}
            title={
              filtered
                ? 'Không có lớp nào khớp bộ lọc.'
                : teacher
                  ? 'Bạn chưa được phân công chủ nhiệm lớp nào trong năm học này.'
                  : 'Chưa có lớp nào trong năm học này.'
            }
            action={
              filtered && (
                <PcbButton variant="secondary" size="sm" onClick={reset}>
                  Xoá bộ lọc
                </PcbButton>
              )
            }
          />
        </div>

        {totalCount > 0 && (
          <Pager
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            itemLabel="lớp"
            onChange={setPage}
            onPageSizeChange={onFilter(setPageSize)}
          />
        )}
      </div>
      {popup.dialog}
    </>
  );
};

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon, PcbButton, SelectField } from '../../../components/pcb';
import { InfoGrid, type InfoItem } from '../../../components/common/InfoGrid';
import { PageHeader } from '../../../components/common/PageHeader';
import { Pager } from '../../../components/common/Pager';
import { StatusPill } from '../../../components/common/StatusPill';
import { TableState } from '../../../components/common/TableState';
import { useAsync, useBusy, useDirectoryScope, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import { ENROLLMENT_STATUS, formatDay, liveClass, statusOf, STUDENT_STATUS } from '../../../utils/directory';
import { toProblem } from '../../../utils/problem';
import { TransferClassDialog } from '../components/TransferClassDialog';

/** SC-HS02. Hồ sơ + quá trình học theo năm + điểm thi đã công bố theo từng lớp. Admin có thêm Sửa / Chuyển lớp / Xoá. */
export const StudentDetailPage = () => {
  const navigate = useNavigate();
  const studentId = Number(useParams().id);
  const scope = useDirectoryScope();
  const back = () => scope.back('/students');

  const [scoreClassId, setScoreClassId] = useState<number>();
  const [scorePage, setScorePage] = useState(1);
  const [scorePageSize, setScorePageSize] = useState(10);
  const [transferOpen, setTransferOpen] = useState(false);
  const popup = useNotice();
  const [busy, runExclusive] = useBusy();

  const detail = useAsync(
    async () => (scope.ready ? api.directory.studentDetail(studentId, scope.schoolId) : null),
    [scope.ready, scope.schoolId, studentId],
  );
  const student = detail.data;
  const history = student?.academicHistory ?? [];
  // Mặc định xem điểm của lớp gần nhất (lịch sử đã xếp năm mới nhất trước).
  const selectedClassId = scoreClassId ?? history[0]?.classId;
  // Điểm gắn với lớp, nên mỗi lớp chỉ một lựa chọn dù lịch sử có 2 dòng cùng lớp.
  const scoreClasses = history.filter((row, index) => history.findIndex((other) => other.classId === row.classId) === index);

  const scores = useAsync(
    async () =>
      selectedClassId && scope.ready
        ? api.directory.studentScores(studentId, selectedClassId, { page: scorePage, pageSize: scorePageSize }, scope.schoolId)
        : null,
    [scope.ready, scope.schoolId, studentId, selectedClassId, scorePage, scorePageSize],
  );

  const layoutClass = scope.admin ? 'sep-page sep-page--flush' : 'sep-page';

  if (!student) {
    return (
      <>
        <PageHeader title="Chi tiết học sinh" onBack={back} inline={scope.admin} />
        <div className={layoutClass}>
          {detail.error ? (
            <>
              <div className="sep-alert" role="alert">
                {toProblem(detail.error).status === 404
                  ? 'Không tìm thấy học sinh, hoặc bạn không có quyền xem học sinh này.'
                  : toProblem(detail.error).message}
              </div>
              <div className="sep-actions">
                <PcbButton variant="secondary" onClick={back}>
                  Về danh sách học sinh
                </PcbButton>
              </div>
            </>
          ) : (
            <p className="sep-empty" role="status">Đang tải…</p>
          )}
        </div>
      </>
    );
  }

  const remove = () => {
    if (!scope.schoolId) return;
    popup.confirm(`Xoá học sinh ${student.fullName}? Hồ sơ chuyển sang "Đã xoá", lịch sử lớp và điểm thi vẫn được giữ.`, () => {
      void runExclusive(async () => {
        try {
          await api.directory.deleteStudent(scope.schoolId!, student.id);
          navigate(scope.withSchool('/students'), { replace: true });
        } catch (error) {
          popup.error(toProblem(error).message);
        }
      });
    }, 'Xoá học sinh');
  };

  const state = statusOf(STUDENT_STATUS, student.status);
  const current = liveClass(student);
  const profile: InfoItem[] = [
    { label: 'Mã học sinh', value: student.code },
    { label: 'Họ và tên', value: student.fullName },
    { label: 'Ngày sinh', value: formatDay(student.dateOfBirth) },
    { label: 'Giới tính', value: student.gender ?? '—' },
    { label: 'Khối hiện tại', value: current?.gradeLevelName ?? '—' },
    {
      label: 'Lớp hiện tại',
      value: current ? (
        <Link className="sep-row-link" to={scope.withSchool(`/classes/${current.classId}`)}>
          {current.className}
        </Link>
      ) : student.status === 'ACTIVE' ? (
        'Chưa xếp lớp năm nay'
      ) : (
        // Đã chuyển đi / đã xoá: trạng thái học tập đã nói rõ, lớp cũ nằm trong quá trình học.
        '—'
      ),
    },
    { label: 'Trạng thái học tập', value: state.label },
    { label: 'Cơ sở', value: current?.schoolBranchName ?? '—' },
    { label: 'Giáo viên chủ nhiệm', value: current?.homeroomTeacherName ?? '—', span: 'wide' },
  ];
  const scoreRows = scores.data?.items ?? [];

  return (
    <>
      <PageHeader title={student.fullName} onBack={back} badge={<StatusPill {...state} />} inline={scope.admin} />

      <div className={layoutClass}>
        <section className="sep-section">
          <h2 className="sep-section-title">Hồ sơ học sinh</h2>
          <InfoGrid items={profile} />
        </section>

        <section className="sep-section">
          <h2 className="sep-section-title">Quá trình học theo năm</h2>
          <div className="pcb-table-wrap">
            <table className="pcb-table">
              <thead>
                <tr>
                  <th>Năm học</th>
                  <th>Khối</th>
                  <th>Lớp</th>
                  <th>Giáo viên chủ nhiệm</th>
                  <th>Trạng thái trong năm</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, index) => (
                  // Cùng một lớp có thể có 2 dòng (xoá rồi khôi phục về lại lớp cũ), nên thêm index vào key.
                  <tr key={`${row.academicYearId}-${row.classId}-${index}`}>
                    <td className="sep-nowrap">{row.academicYearName}</td>
                    <td className="sep-nowrap">{row.gradeLevelName}</td>
                    <td className="sep-nowrap">{row.className}</td>
                    <td className="sep-nowrap">{row.homeroomTeacherName ?? <span className="sep-muted">—</span>}</td>
                    <td>
                      <StatusPill {...statusOf(ENROLLMENT_STATUS, row.enrollmentStatus)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TableState loading={false} failed={false} empty={history.length === 0} columns={5} title="Học sinh chưa có lớp nào." />
          </div>
        </section>

        <section className="sep-section">
          <div className="sep-section-head">
            <h2 className="sep-section-title">Kết quả thi</h2>
            {history.length > 0 && (
              <SelectField
                label="Xem điểm của lớp"
                hideLabel
                placeholder="Lớp"
                value={selectedClassId ?? ''}
                onChange={(event) => {
                  setScoreClassId(Number(event.target.value));
                  setScorePage(1);
                }}
              >
                {scoreClasses.map((row) => (
                  <option key={row.classId} value={row.classId}>
                    Lớp {row.className} · {row.academicYearName}
                  </option>
                ))}
              </SelectField>
            )}
          </div>
          <div className="pcb-table-wrap">
            <table className="pcb-table">
              <thead>
                <tr>
                  <th className="sep-col-index">STT</th>
                  <th>Kỳ thi</th>
                  <th>Môn</th>
                  <th>Học kỳ</th>
                  <th>Ngày thi</th>
                  <th>Điểm</th>
                </tr>
              </thead>
              <tbody>
                {scoreRows.map((row, index) => (
                  <tr key={row.attemptId}>
                    <td className="sep-col-index">{(scorePage - 1) * scorePageSize + index + 1}</td>
                    <td>{row.examName}</td>
                    <td className="sep-nowrap">{row.subjectName}</td>
                    <td className="sep-nowrap">{row.semesterName}</td>
                    <td className="sep-nowrap">{formatDay(row.examDate)}</td>
                    <td className="sep-nowrap">{row.totalScore.toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {scores.error != null ? (
              <div className="sep-alert" role="alert">{toProblem(scores.error).message}</div>
            ) : (
              <TableState
                loading={scores.loading && Boolean(selectedClassId)}
                failed={false}
                empty={scoreRows.length === 0}
                columns={6}
                title={history.length === 0 ? 'Chưa có lớp để xem điểm.' : 'Chưa có điểm được công bố cho lớp này.'}
              />
            )}
          </div>
          {(scores.data?.totalCount ?? 0) > 0 && (
            <Pager
              page={scorePage}
              pageSize={scorePageSize}
              totalCount={scores.data!.totalCount}
              itemLabel="bài thi"
              onChange={setScorePage}
              onPageSizeChange={(size) => {
                setScorePageSize(size);
                setScorePage(1);
              }}
            />
          )}
        </section>

        {scope.admin && (
          <div className="sep-actions">
            <div className="sep-actions__lead">
              <PcbButton variant="ghost" disabled={busy} onClick={() => navigate(scope.withSchool(`/students/${student.id}/edit`))}>
                <Icon name="edit" size={20} />
                Sửa hồ sơ
              </PcbButton>
            </div>
            {student.status !== 'INACTIVE' && (
              <PcbButton variant="danger" disabled={busy} onClick={remove}>
                Xoá học sinh
              </PcbButton>
            )}
            {current && (
              <PcbButton disabled={busy} onClick={() => setTransferOpen(true)}>
                <Icon name="swap_horiz" size={20} />
                Chuyển lớp
              </PcbButton>
            )}
          </div>
        )}
      </div>

      {transferOpen && current && scope.schoolId && (
        <TransferClassDialog
          open
          schoolId={scope.schoolId}
          studentId={student.id}
          studentName={student.fullName}
          current={current}
          onClose={() => setTransferOpen(false)}
          onDone={(className) => {
            setTransferOpen(false);
            popup.success(`Đã chuyển ${student.fullName} sang lớp ${className}.`);
            setScoreClassId(undefined);
            detail.reload();
          }}
        />
      )}
      {popup.dialog}
    </>
  );
};

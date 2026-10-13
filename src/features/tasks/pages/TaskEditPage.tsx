import { useNavigate, useParams } from 'react-router-dom';
import { PcbButton } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { useAsync } from '../../../hooks';
import { api } from '../../../services/api';
import { toProblem } from '../../../utils/problem';
import { ExamTaskForm } from './ExamTaskFormPage';
import { MatrixTaskForm } from './MatrixTaskFormPage';
import { QuestionTaskForm } from './QuestionTaskFormPage';

/** NV04-M, NV04-E, NV04-Q: tải nhiệm vụ rồi mở đúng form của loại đó, điền sẵn giá trị đang có. */
export const TaskEditPage = () => {
  const navigate = useNavigate();
  const taskId = Number(useParams().id);
  const detail = useAsync(() => api.task.get(taskId), [taskId]);
  const task = detail.data;
  const back = () => navigate(`/matrix-tasks/${taskId}`);

  if (detail.loading) {
    return (
      <>
        <PageHeader title="Chỉnh sửa nhiệm vụ" onBack={back} />
        <p className="sep-empty" role="status">Đang tải…</p>
      </>
    );
  }

  // GB-56: chỉ người giao sửa được, và chỉ khi nhiệm vụ chưa hoàn thành; backend kiểm tra lại lúc lưu.
  if (!task?.canEdit) {
    return (
      <>
        <PageHeader title="Chỉnh sửa nhiệm vụ" onBack={back} />
        <div className="sep-page">
          {detail.error ? (
            <div className="sep-alert" role="alert">
              {toProblem(detail.error).message}
              <PcbButton variant="secondary" onClick={detail.reload}>Thử lại</PcbButton>
            </div>
          ) : (
            // Không phải lỗi: chỉ là nhiệm vụ không sửa được nữa, dùng khung trung tính như banner khoá.
            <div className="sep-alert sep-alert--info" role="status">
              {task?.status === 'COMPLETED'
                ? 'Nhiệm vụ đã hoàn thành, không thể chỉnh sửa.'
                : 'Chỉ người giao nhiệm vụ mới được chỉnh sửa.'}
            </div>
          )}
        </div>
      </>
    );
  }

  if (task.taskType === 'MATRIX') return <MatrixTaskForm task={task} />;
  if (task.taskType === 'EXAM') return <ExamTaskForm task={task} />;
  return <QuestionTaskForm task={task} />;
};

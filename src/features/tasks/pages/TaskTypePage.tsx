import { useNavigate } from 'react-router-dom';
import { PcbButton } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import '../tasks.css';

/** NV03-P. PHT chọn giao việc lập ma trận hay tạo đề thi trước khi điền form. */
export const TaskTypePage = () => {
  const navigate = useNavigate();
  const back = () => navigate('/matrix-tasks');

  return (
    <>
      <PageHeader title="Chọn loại nhiệm vụ" onBack={back} />

      <div className="sep-page">
        <section className="sep-section">
          <div className="sep-task-types">
            <PcbButton variant="secondary" onClick={() => navigate('/matrix-tasks/new/matrix')}>
              Nhiệm vụ ma trận
            </PcbButton>
            <PcbButton variant="secondary" onClick={() => navigate('/matrix-tasks/new/exam')}>
              Nhiệm vụ đề thi
            </PcbButton>
          </div>
        </section>
      </div>
    </>
  );
};

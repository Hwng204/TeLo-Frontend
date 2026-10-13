import type { CurriculumField } from '../../../types';
import { curriculumFieldLabel } from './fieldLabel';

export const curriculumFieldLabelSelfCheck = () => {
  const fields: CurriculumField[] = [
    { id: 1, name: 'Chưa phân loại', subjectId: 1, subjectName: 'Tiếng Việt' },
    { id: 2, name: 'CHƯA  PHÂN LOẠI'.normalize('NFD'), subjectId: 2, subjectName: 'Tiếng Anh' },
    { id: 3, name: 'Số và phép tính', subjectId: 3, subjectName: 'Toán' },
  ];
  const expected = ['Tiếng Việt — Chưa phân loại', 'Tiếng Anh — CHƯA PHÂN LOẠI', 'Số và phép tính'];
  fields.forEach((field, index) => {
    if (curriculumFieldLabel(field, fields) !== expected[index]) {
      throw new Error(`Curriculum field ${field.id} lost its subject or changed its unique name`);
    }
  });
};

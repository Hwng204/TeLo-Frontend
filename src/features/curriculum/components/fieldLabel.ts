import type { CurriculumField } from '../../../types';

const clean = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ');
const fold = (value: string) => clean(value).toUpperCase();

export const curriculumFieldLabel = (field: CurriculumField, fields: CurriculumField[]) =>
  fields.some((other) => other.id !== field.id && fold(other.name) === fold(field.name))
    ? `${clean(field.subjectName)} — ${clean(field.name)}`
    : clean(field.name);

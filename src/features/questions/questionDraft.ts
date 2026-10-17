import type { QuestionItem, QuestionPackage, QuestionTarget, SaveQuestion } from './types.ts';

export type QuestionSelection = { kind: 'existing'; id: number } | { kind: 'new'; detailId: number } | null;
export const fourChoices = (options?: readonly string[]) => Array.from({ length: 4 }, (_, i) => options?.[i] ?? '');
export const normalizeChoice = (value: string) => value.normalize('NFC').trim().replace(/\s+/gu, ' ');
export const duplicateChoiceIndexes = (options: readonly string[]) => {
  const seen = new Map<string, number>(); const duplicates = new Set<number>();
  options.forEach((value, index) => {
    const text = normalizeChoice(value); if (!text) return;
    const previous = seen.get(text);
    if (previous !== undefined) { duplicates.add(previous); duplicates.add(index); }
    else seen.set(text, index);
  });
  return duplicates;
};
export const draftErrors = (draft: SaveQuestion) => {
  const errors: Record<string, string> = {};
  if (!draft.detailId) errors.detailId = 'Chọn bài học và mức nhận thức.';
  if (draft.content.length > 10000) errors.content = 'Nội dung tối đa 10.000 ký tự.';
  if (draft.options.length !== 4 || draft.options.some(x => x.length > 2000)) errors.options = 'Mỗi lựa chọn tối đa 2.000 ký tự.';
  if (duplicateChoiceIndexes(draft.options).size) errors.options = 'Các lựa chọn đã điền phải khác nhau.';
  if (draft.explanation && draft.explanation.length > 6000) errors.explanation = 'Giải thích tối đa 6.000 ký tự.';
  return errors;
};
export const missingDraftParts = (draft: SaveQuestion) => {
  const missing: string[] = [];
  if (!draft.content.trim()) missing.push('nội dung câu hỏi');
  if (draft.options.filter(x => x.trim()).length < 2) missing.push('ít nhất 2 lựa chọn');
  if (!draft.correctOption || !draft.options['ABCD'.indexOf(draft.correctOption)]?.trim()) missing.push('đáp án đúng');
  if (duplicateChoiceIndexes(draft.options).size) missing.push('các lựa chọn khác nhau');
  return missing;
};
export const availableTarget = (targets: QuestionTarget[], preferred = 0) =>
  targets.find(t => t.detailId === preferred && t.written < t.requiredCount) ?? targets.find(t => t.written < t.requiredCount);
export const resolveQuestion = (questions: QuestionItem[], selection: QuestionSelection, filter = 0) => {
  if (selection?.kind === 'new') return null;
  if (selection?.kind === 'existing') return questions.find(q => q.id === selection.id) ?? null;
  const filtered = questions.filter(q => !filter || q.detailId === filter);
  return filtered.find(q => !q.isComplete) ?? filtered[0] ?? null;
};
export const selectionAfterSave = (before: QuestionPackage, after: QuestionPackage, editingId: number | null, detailId: number, next: boolean): QuestionSelection => {
  const saved = editingId ? after.questions.find(q => q.id === editingId)
    : after.questions.find(q => !before.questions.some(old => old.id === q.id));
  const remaining = availableTarget(after.targets, detailId);
  if (next && remaining) return { kind: 'new', detailId: remaining.detailId };
  return saved ? { kind: 'existing', id: saved.id } : null;
};

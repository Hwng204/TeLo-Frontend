import { validateAcademicYearName } from './academicYear.ts';

const cases: [string, boolean][] = [
  ['2029-2030', true], [' 2029-2030 ', true], ['2000-2001', true], ['2100-2101', true],
  ['', false], ['2029', false], ['2029-2031', false], ['1999-2000', false], ['2101-2102', false],
];
for (const [name, valid] of cases) {
  if ((Object.keys(validateAcademicYearName({ name })).length === 0) !== valid)
    throw new Error(`Year-only validation failed: ${name}`);
}
console.log(`Academic year v2: ${cases.length} checks passed`);

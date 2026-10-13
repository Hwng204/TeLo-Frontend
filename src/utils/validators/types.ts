export interface ValidationResult<T = Record<string, string>> {
  isValid: boolean;
  errors: Partial<Record<keyof T, string>> & Record<string, string>;
  firstError?: string;
}

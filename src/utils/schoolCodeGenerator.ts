/**
 * Chuyển chuỗi tiếng Việt có dấu thành không dấu
 */
export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Trích xuất các chữ cái viết tắt của tên trường, loại bỏ các tiền tố giáo dục chung
 * Ví dụ:
 *  - "Tiểu học Tề Lỗ" -> "TL"
 *  - "Trường Tiểu học Tề Lỗ" -> "TL"
 *  - "Tiểu học Phạm Công Bình" -> "PCB"
 *  - "THCS Nguyễn Du" -> "ND"
 *  - "Ánh Dương" -> "AD"
 */
export function extractSchoolAcronym(name: string): string {
  if (!name || !name.trim()) return '';

  let cleanName = name.trim();

  // Danh sách các tiền tố giáo dục thông dụng cần lược bỏ (xếp theo độ dài giảm dần)
  const prefixes = [
    /^Trường\s+Tiểu\s+Học\s+/i,
    /^trường\s+tiểu\s+học\s+/i,
    /^tiểu\s+học\s+/i,
    /^Tiểu\s+Học\s+/i,
    /^trường\s+thcs\s+/i,
    /^thcs\s+/i,
    /^trường\s+thpt\s+/i,
    /^thpt\s+/i,
    /^trường\s+mầm\s+non\s+/i,
    /^mầm\s+non\s+/i,
    /^trường\s+liên\s+cấp\s+/i,
    /^liên\s+cấp\s+/i,
    /^trường\s+phổ\s+thông\s+/i,
    /^phổ\s+thông\s+/i,
    /^trường\s+đại\s+học\s+/i,
    /^đại\s+học\s+/i,
    /^trường\s+cao\s+đẳng\s+/i,
    /^cao\s+đẳng\s+/i,
    /^trường\s+th\s+/i,
    /^th\s+/i,
    /^trường\s+/i,
  ];

  for (const prefix of prefixes) {
    if (prefix.test(cleanName)) {
      const remaining = cleanName.replace(prefix, '').trim();
      if (remaining.length > 0) {
        cleanName = remaining;
        break;
      }
    }
  }

  const noTone = removeVietnameseTones(cleanName);
  const words = noTone.split(/[\s\-_,.]+/).filter(w => w.length > 0);

  if (words.length === 0) return '';

  // Lấy chữ cái đầu tiên của từng từ
  let acronym = words
    .map(w => w[0].toUpperCase())
    .join('')
    .replace(/[^A-Z0-9]/g, '');

  // Nếu chỉ có 1 từ và từ đó có nhiều hơn 1 ký tự (ví dụ: "Lô" -> "L", hoặc "ABC"), nếu quá ngắn có thể lấy thêm
  if (acronym.length < 2 && words[0].length >= 2) {
    acronym = words[0].slice(0, 2).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  return acronym;
}

/**
 * Tự động sinh mã trường học:
 * [Mã_Tỉnh]-[Viết_Tắt_Tên_Trường] (hoặc thêm hậu tố số 1, 2, 3... nếu bị trùng)
 * 
 * Ví dụ:
 *  - Tỉnh Hà Nội (mã "01") -> 1-TL
 *  - Nếu 1-TL đã tồn tại -> 1-TL1, 1-TL2...
 *  - Nếu không chọn tỉnh -> TL, TL1...
 */
export function generateSchoolCode(
  name: string,
  provinceCode: string | undefined,
  existingCodes: string[] = []
): string {
  const acronym = extractSchoolAcronym(name);
  if (!acronym) return '';

  let provincePrefix = '';
  if (provinceCode && provinceCode.trim()) {
    const raw = provinceCode.trim();
    const parsed = parseInt(raw, 10);
    provincePrefix = isNaN(parsed) ? `${raw}-` : `${parsed}-`;
  }

  const baseCode = `${provincePrefix}${acronym}`;
  const upperExisting = existingCodes.map(c => (c || '').toUpperCase().trim());

  if (!upperExisting.includes(baseCode.toUpperCase())) {
    return baseCode;
  }

  let counter = 1;
  while (upperExisting.includes(`${baseCode}${counter}`.toUpperCase())) {
    counter++;
  }

  return `${baseCode}${counter}`;
}

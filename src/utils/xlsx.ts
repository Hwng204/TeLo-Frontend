/**
 * Đọc/ghi .xlsx tối thiểu, không cần thư viện: .xlsx là file zip chứa XML.
 * Đọc: giải nén bằng DecompressionStream('deflate-raw') của trình duyệt, lấy sheet đầu tiên thành mảng chuỗi.
 * Ghi: zip kiểu "store" (không nén) một workbook một sheet, chữ ghi dạng inline string.
 *
 * ponytail: không hỗ trợ zip64 (file > 4 GB), công thức (chỉ đọc giá trị đã tính sẵn), ô gộp.
 * Đổi sang một thư viện đọc Excel nếu cần các thứ đó.
 */
import type { XlsxCell } from '../types';

const SHEET_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MAIN_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PKG_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';

const UNREADABLE = 'Không đọc được file. Hãy mở bằng Excel, lưu lại dạng "Excel Workbook (.xlsx)" rồi thử lại.';

// --- Đọc ---

type ZipEntry = { method: number; raw: Uint8Array<ArrayBuffer> };

const unzip = (buffer: ArrayBuffer): Map<string, ZipEntry> => {
  const view = new DataView(buffer);
  let end = -1;
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error(UNREADABLE);

  const entries = new Map<string, ZipEntry>();
  const decoder = new TextDecoder();
  let offset = view.getUint32(end + 16, true);
  for (let i = view.getUint16(end + 10, true); i > 0; i--) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error(UNREADABLE);
    const nameLength = view.getUint16(offset + 28, true);
    const local = view.getUint32(offset + 42, true);
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    entries.set(decoder.decode(new Uint8Array(buffer, offset + 46, nameLength)), {
      method: view.getUint16(offset + 10, true),
      raw: new Uint8Array(buffer, start, view.getUint32(offset + 20, true)),
    });
    offset += 46 + nameLength + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
  }
  return entries;
};

const readEntry = async (entries: Map<string, ZipEntry>, name: string): Promise<Document | null> => {
  const entry = entries.get(name);
  if (!entry) return null;
  let bytes: BlobPart = entry.raw;
  if (entry.method === 8) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    bytes = await new Response(stream).arrayBuffer();
  } else if (entry.method !== 0) {
    throw new Error(UNREADABLE);
  }
  const text = await new Blob([bytes]).text();
  return new DOMParser().parseFromString(text, 'application/xml');
};

// Tên thẻ có thể mang tiền tố (x:c) tuỳ phần mềm ghi file, nên tìm theo localName.
const all = (node: Document | Element, tag: string) => [...node.getElementsByTagNameNS('*', tag)];
const textOf = (node: Element) => all(node, 't').map((t) => t.textContent ?? '').join('');

/** "AB12" → 27 (cột, đếm từ 0). */
const columnIndex = (ref: string) =>
  [...ref.replace(/\d+$/, '')].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;

/** Sheet đầu tiên của workbook thành mảng dòng × cột (chuỗi, ô trống là ''). */
export const readFirstSheet = async (buffer: ArrayBuffer): Promise<string[][]> => {
  const entries = unzip(buffer);

  let sheetPath = 'xl/worksheets/sheet1.xml';
  const workbook = await readEntry(entries, 'xl/workbook.xml');
  const rels = await readEntry(entries, 'xl/_rels/workbook.xml.rels');
  const firstSheetId = workbook && all(workbook, 'sheet')[0]?.getAttributeNS(REL_NS, 'id');
  const target = rels && all(rels, 'Relationship').find((rel) => rel.getAttribute('Id') === firstSheetId)?.getAttribute('Target');
  if (target) sheetPath = target.startsWith('/') ? target.slice(1) : `xl/${target}`;

  const sheet = await readEntry(entries, sheetPath);
  if (!sheet || sheet.getElementsByTagName('parsererror').length > 0) throw new Error(UNREADABLE);
  const shared = await readEntry(entries, 'xl/sharedStrings.xml');
  const strings = shared ? all(shared, 'si').map(textOf) : [];

  const rows: string[][] = [];
  all(sheet, 'row').forEach((row, position) => {
    const index = Number(row.getAttribute('r') ?? position + 1) - 1;
    const cells: string[] = [];
    all(row, 'c').forEach((cell, cellPosition) => {
      const ref = cell.getAttribute('r');
      const column = ref ? columnIndex(ref) : cellPosition;
      const type = cell.getAttribute('t');
      const value = all(cell, 'v')[0]?.textContent ?? '';
      cells[column] =
        type === 's' ? (strings[Number(value)] ?? '')
        : type === 'inlineStr' ? textOf(cell)
        : type === 'b' ? (value === '1' ? 'TRUE' : 'FALSE')
        : value;
    });
    rows[index] = Array.from(cells, (cell) => cell ?? '');
  });
  return Array.from(rows, (row) => row ?? []);
};

// --- Ghi ---

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (bytes: Uint8Array) => {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/** Zip không nén; ngày ghi cố định 1980-01-01 (định dạng DOS). */
const zip = (files: [string, string][]): Blob => {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [name, content] of files) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(12, 0x21, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(14, 0x21, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);

    locals.push(local, data);
    centrals.push(central);
    offset += local.length + data.length;
  }

  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centrals.reduce((total, part) => total + part.length, 0), true);
  ev.setUint32(16, offset, true);
  return new Blob([...locals, ...centrals, end] as BlobPart[], { type: SHEET_MIME });
};

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

// Bỏ ký tự điều khiển (XML không cho phép) rồi thoát ký tự đặc biệt.
const escapeXml = (text: string) =>
  text
    // eslint-disable-next-line no-control-regex -- đúng là cần bắt ký tự điều khiển để loại bỏ.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/[<>&"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[char] ?? char);

const columnName = (index: number) => {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
};

const cellXml = (cell: XlsxCell, ref: string) => {
  if (cell === null || cell === '') return '';
  const { value, bold } = typeof cell === 'object' ? cell : { value: cell, bold: false };
  const style = bold ? ' s="1"' : '';
  // Chữ luôn ghi dạng inline string, nên nội dung bắt đầu bằng "=" không bao giờ thành công thức.
  return typeof value === 'number'
    ? `<c r="${ref}"${style}><v>${value}</v></c>`
    : `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
};

/** Workbook một sheet. `widths` là bề rộng cột theo số ký tự. */
export const writeSheet = (sheetName: string, rows: XlsxCell[][], widths: number[] = []): Blob => {
  const cols = widths.length
    ? `<cols>${widths.map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`).join('')}</cols>`
    : '';
  const data = rows
    .map((row, r) => `<row r="${r + 1}">${row.map((cell, c) => cellXml(cell, `${columnName(c)}${r + 1}`)).join('')}</row>`)
    .join('');

  return zip([
    [
      '[Content_Types].xml',
      `${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    ],
    [
      '_rels/.rels',
      `${XML_HEAD}<Relationships xmlns="${PKG_REL_NS}"><Relationship Id="rId1" Type="${REL_NS}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ],
    [
      'xl/workbook.xml',
      `${XML_HEAD}<workbook xmlns="${MAIN_NS}" xmlns:r="${REL_NS}"><sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ],
    [
      'xl/_rels/workbook.xml.rels',
      `${XML_HEAD}<Relationships xmlns="${PKG_REL_NS}"><Relationship Id="rId1" Type="${REL_NS}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${REL_NS}/styles" Target="styles.xml"/></Relationships>`,
    ],
    [
      'xl/styles.xml',
      `${XML_HEAD}<styleSheet xmlns="${MAIN_NS}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`,
    ],
    ['xl/worksheets/sheet1.xml', `${XML_HEAD}<worksheet xmlns="${MAIN_NS}">${cols}<sheetData>${data}</sheetData></worksheet>`],
  ]);
};

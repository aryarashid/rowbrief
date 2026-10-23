export const VERSION = '1.0.0';
export const LIMITS = Object.freeze({bytes: 2 * 1024 * 1024, records: 10000, columns: 100, issues: 200});
export const DIALECTS = Object.freeze([{value: ',', label: 'Comma'}, {value: ';', label: 'Semicolon'}, {value: '\t', label: 'Tab'}, {value: '|', label: 'Pipe'}]);

export function decodeUtf8(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new Error('Expected file bytes.');
  if (bytes.byteLength > LIMITS.bytes) throw new Error('This file exceeds the 2 MiB limit. Choose a smaller file.');
  if ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff) || (bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 0xfe && bytes[3] === 0xff)) throw new Error('UTF-16 and UTF-32 are not supported. Export the file as UTF-8, then try again.');
  let text;
  try { text = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bytes); }
  catch { throw new Error('This file is not valid UTF-8. Export it as UTF-8, then try again.'); }
  if (text.includes('\0')) throw new Error('This file contains NUL characters. It may be binary or use an unsupported encoding.');
  return text;
}

// A strict, bounded CSV reader. Source coordinates count Unicode code points;
// a CRLF pair is one line break. A leading UTF-8 BOM is not a visible column.
export function parseCsv(input, delimiter = ',') {
  if (!DIALECTS.some(d => d.value === delimiter)) throw new Error('Choose comma, semicolon, tab or pipe.');
  if (typeof input !== 'string') throw new Error('Expected CSV text.');
  if (new TextEncoder().encode(input).byteLength > LIMITS.bytes) throw new Error('Text exceeds the 2 MiB limit.');
  if (input.includes('\0')) throw new Error('NUL characters are not supported.');
  const bom = input.startsWith('\ufeff');
  const text = bom ? input.slice(1) : input;
  const rows = [], issues = [], endings = {LF: 0, CRLF: 0, CR: 0};
  let i = 0, line = 1, column = 1, rowLine = 1, rowStart = 0;
  let cells = [], positions = [], field = '', fieldStart = {line: 1, column: 1}, state = 'start', complete = true;
  const fail = (code, message) => { issues.push({severity: 'error', code, message, line, column, record: rows.length + 1}); complete = false; };
  const addField = () => {
    if (cells.length >= LIMITS.columns) { fail('column-limit', 'More than 100 fields in a record. Inspection stopped.'); return false; }
    cells.push(field); positions.push({...fieldStart}); field = ''; state = 'start'; return true;
  };
  const addRow = (end) => {
    if (rows.length >= LIMITS.records) { fail('record-limit', 'More than 10,000 records. Inspection stopped.'); return false; }
    rows.push({cells, positions, line: rowLine, endLine: line, blank: cells.length === 1 && text.slice(rowStart, end).trim() === ''});
    cells = []; positions = []; return true;
  };
  while (i < text.length && complete) {
    const ch = String.fromCodePoint(text.codePointAt(i));
    const newline = ch === '\r' ? (text[i + 1] === '\n' ? '\r\n' : '\r') : ch === '\n' ? '\n' : '';
    if (newline) {
      endings[newline === '\r\n' ? 'CRLF' : newline === '\n' ? 'LF' : 'CR']++;
      if (state === 'quoted') field += newline;
      else if (!addField() || !addRow(i)) break;
      i += newline.length; line++; column = 1;
      if (state !== 'quoted') { rowLine = line; rowStart = i; fieldStart = {line, column}; }
      continue;
    }
    if (state === 'quoted') {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; column += 2; continue; }
        state = 'closed';
      } else field += ch;
    } else if (ch === delimiter) {
      if (!addField()) break;
      fieldStart = {line, column: column + 1};
    } else if (state === 'closed') {
      fail('after-quote', 'Unexpected character after a closing quote. Use a delimiter or line break.'); break;
    } else if (ch === '"') {
      if (state !== 'start') { fail('unexpected-quote', 'A quote inside an unquoted field must be quoted and escaped.'); break; }
      state = 'quoted';
    } else { field += ch; state = 'plain'; }
    i += ch.length; column++;
  }
  if (complete && state === 'quoted') fail('unclosed-quote', 'A quoted field has no closing quote. Inspection stopped at the end of the input.');
  if (complete && text.length && rowStart < text.length) { if (addField()) addRow(text.length); }
  return {rows, issues, complete, bom, endings};
}

export function inspectCsv(text, {delimiter = ',', header = true, skipBlank = true} = {}) {
  const parsed = parseCsv(text, delimiter);
  const rows = parsed.rows.map((row, index) => ({...row, record: index + 1}));
  const included = rows.filter(row => !skipBlank || !row.blank);
  const issues = [...parsed.issues];
  let totalIssues = issues.length;
  const add = issue => { totalIssues++; if (issues.length < LIMITS.issues) issues.push(issue); };
  const expected = included[0]?.cells.length ?? 0;
  if (header && included[0]) {
    const seen = new Set();
    included[0].cells.forEach((value, index) => {
      const at = included[0].positions[index];
      if (!value.trim()) add({severity: 'warning', code: 'empty-header', message: `Header field ${index + 1} is empty or whitespace-only.`, ...at, record: included[0].record});
      if (seen.has(value)) add({severity: 'warning', code: 'duplicate-header', message: `Header field ${index + 1} repeats an earlier header exactly.`, ...at, record: included[0].record});
      seen.add(value);
    });
  }
  for (const row of included.slice(1)) if (row.cells.length !== expected) add({severity: 'error', code: 'field-count', message: `Expected ${expected} fields; found ${row.cells.length}.`, line: row.line, column: 1, record: row.record});
  const styles = Object.entries(parsed.endings).filter(([, count]) => count > 0).map(([name]) => name);
  if (styles.length > 1) add({severity: 'warning', code: 'mixed-line-endings', message: 'More than one line-ending style occurs in the input.', line: 1, column: 1, record: 1});
  issues.sort((a,b) => a.line-b.line || a.column-b.column);
  return {...parsed, rows: included, issues, totalIssues, delimiter, header, skipBlank, bytes: new TextEncoder().encode(text).byteLength, expected, skipped: rows.length-included.length, dataRecords: Math.max(0,included.length-(header && included.length ? 1 : 0)), lineStyles: styles};
}

// Comparisons are evidence, not a detector. A consistent one-column parse may
// mean the delimiter is wrong, or it may be a perfectly valid one-column file.
export function compareDialects(text, options = {}) {
  return DIALECTS.map(dialect => {
    const result = inspectCsv(text, {...options, delimiter: dialect.value});
    return {...dialect, fields: result.expected, records: result.rows.length, complete: result.complete, errors: result.issues.filter(x => x.severity === 'error').length, issues: result.totalIssues};
  });
}

export function makeReport(result) {
  return {
    reportVersion: 1, tool: 'RowBrief', toolVersion: VERSION,
    privacy: 'Cell values, header names, source excerpts and filename are omitted. Counts and source locations remain.',
    dialect: {delimiter: result.delimiter, header: result.header, skipWhitespaceOnlyRecords: result.skipBlank, quote: '"', escapedQuote: '""'},
    input: {bytes: result.bytes, utf8Bom: result.bom, lineEndings: result.lineStyles},
    inspection: {complete: result.complete, includedRecords: result.rows.length, dataRecords: result.dataRecords, expectedFields: result.expected, skippedBlankRecords: result.skipped, totalIssues: result.totalIssues, listedIssues: result.issues.length},
    issues: result.issues.map(({severity, code, message, line, column, record}) => ({severity, code, message, line, column, record})),
    limits: {...LIMITS},
    limitations: 'Structure only. No data-type, business-rule, formula-safety or universal spreadsheet-compatibility certification. Original data is not modified.'
  };
}

export function reportMarkdown(report) {
  const d = DIALECTS.find(d => d.value === report.dialect.delimiter)?.label;
  return `# RowBrief handoff report\n\n${report.privacy}\n\n## Parsing choices\n\n- Delimiter: ${d}\n- First included record is a header: ${report.dialect.header ? 'yes' : 'no'}\n- Skip whitespace-only records: ${report.dialect.skipWhitespaceOnlyRecords ? 'yes' : 'no'}\n- UTF-8 BOM: ${report.input.utf8Bom ? 'present' : 'absent'}\n- Line endings: ${report.input.lineEndings.join(', ') || 'none'}\n\n## Inspection\n\n- Complete: ${report.inspection.complete ? 'yes' : 'no; results are partial'}\n- Included records: ${report.inspection.includedRecords}\n- Data records: ${report.inspection.dataRecords}\n- Expected fields: ${report.inspection.expectedFields}\n- Skipped blank records: ${report.inspection.skippedBlankRecords}\n- Issues: ${report.inspection.totalIssues} (${report.inspection.listedIssues} listed)\n\n## Findings\n\n${report.issues.length ? report.issues.map(i => `- ${i.severity}: ${i.code}, record ${i.record}, line ${i.line}, column ${i.column}. ${i.message}`).join('\n') : 'No structural issues found for these parsing choices.'}\n\n## Limits\n\n2 MiB UTF-8, 10,000 parsed records, 100 fields per record, first 200 findings.\n\n${report.limitations}\n\nGenerated by RowBrief ${VERSION}.\n`;
}

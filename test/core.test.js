import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv, inspectCsv, decodeUtf8, compareDialects, makeReport, reportMarkdown, LIMITS} from '../src/core.js';
import {EXAMPLES} from '../src/examples.js';
const values=result=>result.rows.map(row=>row.cells);

test('empty input, quoted empty cell, blank and trailing empty fields stay distinct',()=>{
  assert.deepEqual(values(parseCsv('')),[]);
  assert.deepEqual(values(parseCsv('""')),[['']]);
  assert.deepEqual(values(parseCsv('a,,\n\n')),[['a','',''],['']]);
  assert.equal(inspectCsv('\n""\n,,\n').rows.length,2);
  assert.equal(inspectCsv('\n""\n,,\n').skipped,1);
});
test('quoted delimiters, doubled quotes and multiline values preserve contents',()=>{
  const result=parseCsv('a,b\r\n"one,two","a ""quote""\r\nnext"\r\n');
  assert.equal(result.complete,true);
  assert.deepEqual(values(result),[['a','b'],['one,two','a "quote"\r\nnext']]);
  assert.equal(result.rows[1].line,2);assert.equal(result.rows[1].endLine,3);
  assert.deepEqual(result.endings,{LF:0,CRLF:3,CR:0});
});
test('every supported delimiter and line ending parses explicitly',()=>{
  for(const delimiter of [',',';','\t','|'])for(const ending of ['\n','\r\n','\r']){
    const result=parseCsv(`a${delimiter}b${ending}c${delimiter}d${ending}`,delimiter);
    assert.equal(result.complete,true);assert.deepEqual(values(result),[['a','b'],['c','d']]);
  }
  assert.throws(()=>parseCsv('a:b',':'),/Choose/);
});
test('strict quoting errors stop at exact source locations and preserve complete records',()=>{
  const quote=parseCsv('a,b\n"ok","oops\nstill open');
  assert.equal(quote.complete,false);assert.equal(quote.rows.length,1);
  assert.deepEqual(quote.issues[0],{severity:'error',code:'unclosed-quote',message:'A quoted field has no closing quote. Inspection stopped at the end of the input.',line:3,column:11,record:2});
  const after=parseCsv('a,b\n"ok"x,2');assert.equal(after.issues[0].code,'after-quote');assert.equal(after.issues[0].column,5);
  assert.equal(parseCsv('a,b\nplain"bad,2').issues[0].column,6);
});
test('Unicode columns count code points; BOM does not shift visible columns',()=>{
  const result=parseCsv('\ufeffname,note\n😀x"bad,ok');
  assert.equal(result.bom,true);assert.equal(result.issues[0].column,3);
});
test('UTF-8 decoder accepts a BOM and rejects malformed and UTF-16 inputs',()=>{
  const original='\ufeffcity,name\n京都,Noor';
  assert.equal(decodeUtf8(new TextEncoder().encode(original)),original);
  for(const bytes of [[0xc3,0x28],[0xff,0xfe,97,0],[0xfe,0xff,0,97],[0,0,0xfe,0xff]])assert.throws(()=>decodeUtf8(Uint8Array.from(bytes)),/UTF/);
  assert.throws(()=>decodeUtf8(Uint8Array.from([97,0,98])),/NUL/);
});
test('header checks are exact and do not leak header values in issues',()=>{
  const result=inspectCsv('private-secret,private-secret, ,Name,name\n1,2,3,4,5');
  assert.deepEqual(result.issues.map(i=>i.code),['duplicate-header','empty-header']);
  assert.equal(JSON.stringify(result.issues).includes('private-secret'),false);
  assert.equal(inspectCsv('a,a\n1,2',{header:false}).totalIssues,0);
});
test('first included record defines width, whether or not treated as a header',()=>{
  for(const header of [true,false]){
    const result=inspectCsv('\n\na,b\n1\n2,3,4\n',{header});
    assert.equal(result.expected,2);assert.equal(result.skipped,2);
    assert.equal(result.dataRecords,header?2:3);
    assert.deepEqual(result.issues.map(i=>[i.line,i.record,i.code]),[[4,4,'field-count'],[5,5,'field-count']]);
  }
});
test('blank record setting is explicit; quoted whitespace and delimiter-only records remain',()=>{
  const text='a,b\n   \n" "\n,\n';
  assert.equal(inspectCsv(text).skipped,1);
  assert.equal(inspectCsv(text,{skipBlank:false}).rows.length,4);
  assert.equal(inspectCsv(text).rows[1].cells[0],' ');
  const tabs=inspectCsv('a\tb\tc\n\t\t\n',{delimiter:'\t'});
  assert.equal(tabs.skipped,0);assert.equal(tabs.rows.length,2);assert.deepEqual(tabs.rows[1].cells,['','','']);
});
test('line ending warning is structural and includes quoted line breaks',()=>{
  const result=inspectCsv('a,b\r\n1,"x\ny"\r\n');
  assert.ok(result.issues.some(i=>i.code==='mixed-line-endings'));
});
test('record and field limits are exact, including blank records',()=>{
  assert.equal(parseCsv('a\n'.repeat(LIMITS.records)).complete,true);
  const tooMany=parseCsv('\n'.repeat(LIMITS.records+1));
  assert.equal(tooMany.complete,false);assert.equal(tooMany.rows.length,LIMITS.records);assert.equal(tooMany.issues[0].code,'record-limit');
  assert.equal(parseCsv(Array(100).fill('a').join(',')).complete,true);
  assert.equal(parseCsv(Array(101).fill('a').join(',')).issues[0].code,'column-limit');
});
test('byte limits use UTF-8 byte length rather than character count',()=>{
  assert.equal(parseCsv('a'.repeat(LIMITS.bytes)).complete,true);
  assert.throws(()=>parseCsv('é'.repeat(LIMITS.bytes/2+1)),/2 MiB/);
  assert.throws(()=>decodeUtf8(new Uint8Array(LIMITS.bytes+1)),/2 MiB/);
});
test('finding list is bounded but total count remains exact',()=>{
  const result=inspectCsv('a,b\n'+'x\n'.repeat(300));
  assert.equal(result.totalIssues,300);assert.equal(result.issues.length,200);
});
test('delimiter comparison supplies evidence without changing the chosen delimiter',()=>{
  const text='a;b\n1;2\n';const comparison=compareDialects(text);
  assert.equal(comparison.find(x=>x.value===';').fields,2);
  assert.equal(comparison.find(x=>x.value===',').fields,1);
  assert.equal(inspectCsv(text).delimiter,',');assert.equal(text,'a;b\n1;2\n');
});
test('reports omit private values and header names, including hostile markup/formulas',()=>{
  const secret='UNIQUE_PRIVATE_58219';
  const text=`${secret},${secret}\n"<img src=x onerror=alert(1)>","=HYPERLINK(""secret"")"\n`;
  const report=makeReport(inspectCsv(text));
  for(const output of [JSON.stringify(report),reportMarkdown(report)])for(const absent of [secret,'<img','HYPERLINK'])assert.equal(output.includes(absent),false);
  assert.equal(report.inspection.totalIssues,1);assert.equal('rows' in report,false);assert.equal('filename' in report,false);
});
test('reports expose incomplete inspection rather than claiming a pass',()=>{
  const report=makeReport(inspectCsv('a,b\n"broken'));
  assert.equal(report.inspection.complete,false);assert.match(reportMarkdown(report),/partial/);
});
test('all synthetic examples have their stated outcomes',()=>{
  for(const id of ['handoff','dialect']){
    const e=EXAMPLES.find(e=>e.id===id);assert.equal(inspectCsv(e.text,{delimiter:e.delimiter}).totalIssues,0);
  }
  assert.equal(inspectCsv(EXAMPLES.find(e=>e.id==='issues').text).totalIssues,2);
  assert.equal(inspectCsv(EXAMPLES.find(e=>e.id==='headers').text).totalIssues,2);
  assert.equal(inspectCsv(EXAMPLES.find(e=>e.id==='quotes').text).complete,false);
});
test('generated valid records round-trip independently quoted content across dialects',()=>{
  const samples=['','a','one,two','semi;colon','tab\tvalue','pipe|value','say "yes"','one\ntwo','one\r\ntwo','京都','😀','  '];
  for(let n=0;n<100;n++){
    const delimiter=[',',';','\t','|'][n%4];
    const rows=Array.from({length:n%5+1},(_,r)=>Array.from({length:n%7+1},(_,c)=>samples[(n+r*7+c*3)%samples.length]));
    const written=rows.map(row=>row.map(cell=>'"'+cell.replaceAll('"','""')+'"').join(delimiter)).join('\r\n');
    const result=parseCsv(written,delimiter);assert.equal(result.complete,true);assert.deepEqual(values(result),rows);
  }
});

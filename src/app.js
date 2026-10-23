import {VERSION, LIMITS, DIALECTS, decodeUtf8, inspectCsv, compareDialects, makeReport, reportMarkdown} from './core.js';
import {EXAMPLES} from './examples.js';

const $ = id => document.getElementById(id);
const el = (tag, text, cls) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (cls) node.className = cls; return node; };
let result = null, report = null, page = 0, revision = 0, source = 'Pasted text', current = false, originalText = null;
const pageSize = 20;
for (const example of EXAMPLES) { const option = el('option', example.name); option.value = example.id; $('example').append(option); }
const reportButtons = ['json','markdown','report-preview'];
function error(message) { $('error').textContent = message; $('error').hidden = false; }
function clearError() { $('error').hidden = true; $('error').textContent = ''; }
function dirty() {
  revision++; current = false; report = null; clearError();
  $('results').setAttribute('aria-busy','false');
  reportButtons.forEach(id => $(id).disabled = true);
  document.querySelectorAll('.dialect').forEach(button => button.disabled = true);
  $('report-content').hidden = true; $('report-content').textContent = '';
  $('report-preview').textContent = 'Preview report';
  $('context-panel').hidden = true; $('context').replaceChildren();
  if (result) $('result-title').textContent = 'Previous inspection · input changed';
  $('status').textContent = 'Ready to inspect. Previous results cannot be exported after a change.';
}
$('csv').addEventListener('input', () => { originalText = null; source = 'Pasted or edited text · browser-normalized line endings'; $('example').value = ''; dirty(); });
['delimiter','header','blank'].forEach(id => $(id).addEventListener('change',dirty));

function preview() {
  const table = $('preview-table'); table.replaceChildren();
  const start = page * pageSize, rows = result.rows.slice(start, start + pageSize);
  const width = Math.max(result.expected,...rows.map(row => row.cells.length),0);
  const caption = el('caption', 'Parsed records. Field headings are positions, not inferred names.', 'sr-only'); table.append(caption);
  const head = el('thead'), headRow = el('tr');
  const first = el('th','Record / line','row-label'); first.scope='col'; headRow.append(first);
  for (let i=0;i<width;i++) { const th=el('th',`Field ${i+1}`);th.scope='col';headRow.append(th); }
  head.append(headRow);table.append(head);
  const body=el('tbody');
  for (const row of rows) {
    const tr=el('tr'); if(result.issues.some(issue=>issue.record===row.record))tr.className='issue-row';
    const label=el('th',`${result.header && row===result.rows[0] ? 'Header' : row.record}\nLine ${row.line}${row.endLine!==row.line?`–${row.endLine}`:''}`,'row-label');label.scope='row';tr.append(label);
    for(let i=0;i<width;i++) {
      const cell=el('td');
      if (i>=row.cells.length) { cell.textContent='[missing]';cell.className='missing'; }
      else { const value=row.cells[i]; cell.textContent=value===''?'∅':value.slice(0,200)+(value.length>200?'…':''); if(value==='')cell.setAttribute('aria-label','Empty field'); if(value.length>200)cell.title='Display limited to 200 characters. The original field is unchanged.'; }
      tr.append(cell);
    }
    body.append(tr);
  }
  table.append(body);
  $('range').textContent=rows.length?`Records ${start+1}–${start+rows.length} of ${result.rows.length}`:'No included records';
  $('page-label').textContent='20 per page · ∅ means empty';
  $('previous').disabled=page===0;$('next').disabled=start+pageSize>=result.rows.length;
}

function context(issue) {
  if (!current) return;
  const lines=(originalText??$('csv').value).replace(/^\ufeff/,'').split(/\r\n|\r|\n/);
  $('context').replaceChildren();
  for(let n=Math.max(1,issue.line-1);n<=Math.min(lines.length,issue.line+1);n++) {
    const points=Array.from(lines[n-1]);
    const point=n===issue.line?Math.max(0,issue.column-1):0;
    const start=Math.max(0,point-70), end=Math.min(points.length,start+160);
    const line=el('span'); line.append(document.createTextNode(`${n} │ ${start?'…':''}`));
    if(n===issue.line) {
      line.append(document.createTextNode(points.slice(start,point).join('')));
      line.append(el('mark',points[point]??' '));
      line.append(document.createTextNode(points.slice(point+1,end).join('')));
    } else line.append(document.createTextNode(points.slice(start,end).join('')));
    if(end<points.length)line.append(document.createTextNode('…'));
    line.append(document.createTextNode('\n'));$('context').append(line);
  }
  $('context-heading').textContent=`Source context · line ${issue.line}, column ${issue.column}`;
  $('context-panel').hidden=false;
  const index=result.rows.findIndex(row=>row.record===issue.record);
  if(index>=0){page=Math.floor(index/pageSize);preview();}
  $('context').focus();
}

function render(comparisons) {
  $('empty').hidden=true;$('output').hidden=false;
  $('result-title').textContent='Inspection';$('source-label').textContent=source;
  const errors=result.issues.some(issue=>issue.severity==='error');
  $('verdict').textContent=!result.complete?'Stopped · partial results':errors?'Review structure':result.totalIssues?'Review findings':result.rows.length?'Structure consistent':'No included records';
  $('verdict').className=`verdict${!result.complete||errors?' error':result.totalIssues||!result.rows.length?' warn':''}`;
  $('record-count').textContent=result.dataRecords.toLocaleString();$('field-count').textContent=result.expected;$('issue-count').textContent=result.totalIssues.toLocaleString();
  $('parse-note').textContent=`${DIALECTS.find(d=>d.value===result.delimiter).label} delimiter. UTF-8 BOM ${result.bom?'present':'absent'}. ${result.lineStyles.join(' + ')||'No line breaks'}. ${result.skipped} blank records skipped.${!result.complete?' Inspection stopped; counts cover complete records parsed before the stopping point.':''}`;
  $('dialect-grid').replaceChildren();
  for(const comparison of comparisons) {
    const button=el('button',undefined,`dialect${comparison.value===result.delimiter?' active':''}`);button.type='button';
    button.setAttribute('aria-label',`Inspect with ${comparison.label.toLowerCase()} delimiter`);button.setAttribute('aria-pressed',String(comparison.value===result.delimiter));
    button.append(el('strong',comparison.label),el('span',`${comparison.fields} fields · ${comparison.records} records`),el('span',comparison.complete?`${comparison.issues} findings`:'Stopped early'));
    button.addEventListener('click',()=>{if(!current)return;$('delimiter').value=comparison.value;dirty();inspect();});$('dialect-grid').append(button);
  }
  $('findings-intro').textContent=result.totalIssues?`${result.totalIssues} findings. Showing ${result.issues.length}${result.totalIssues>result.issues.length?' of the first 200 retained findings':''}. Locations refer to the original source, not preview row numbers.`:'No structural issues found for these choices. This does not validate the meaning or safety of the data.';
  $('findings').replaceChildren();
  for(const issue of result.issues) {
    const li=el('li',undefined,`finding ${issue.severity}`), text=el('div');
    text.append(el('strong',`${issue.severity==='error'?'Error':'Review'} · record ${issue.record}`),el('p',issue.message));
    const button=el('button',`See line ${issue.line}`,'secondary');button.setAttribute('aria-label',`See source line ${issue.line}, column ${issue.column}: ${issue.code}`);button.addEventListener('click',()=>context(issue));li.append(text,button);$('findings').append(li);
  }
  page=0;preview();reportButtons.forEach(id=>$(id).disabled=false);
}

async function inspect() {
  clearError();
  if(!$('csv').value.length && originalText===null){error('Choose a file, select an example or paste CSV text before inspecting.');return;}
  const token=++revision, text=originalText??$('csv').value, options={delimiter:$('delimiter').value,header:$('header').checked,skipBlank:$('blank').checked};
  current=false;report=null;reportButtons.forEach(id=>$(id).disabled=true);$('report-content').hidden=true;$('context-panel').hidden=true;
  $('results').setAttribute('aria-busy','true');$('status').textContent='Inspecting locally…';
  await new Promise(requestAnimationFrame);
  if(token!==revision)return;
  try {
    const inspected=inspectCsv(text,options), comparisons=compareDialects(text,options);
    if(token!==revision)return;
    result=inspected;report=makeReport(result);current=true;render(comparisons);
    $('status').textContent=`Inspection ${result.complete?'complete':'stopped'}. ${result.dataRecords} data records; ${result.totalIssues} findings. Reports omit cell values.`;
  } catch (err) { error(err.message);$('status').textContent='Inspection could not complete. The input is unchanged.'; }
  finally {if(token===revision)$('results').setAttribute('aria-busy','false');}
}
$('inspect').addEventListener('click',inspect);
function loadExample(id) {
  const example=EXAMPLES.find(e=>e.id===id);if(!example)return;
  dirty();originalText=example.text;source=`Synthetic example · ${example.name}`;$('csv').value=example.text;$('delimiter').value=example.delimiter;$('header').checked=true;$('blank').checked=true;$('example').value=id;$('file').value='';inspect();
}
$('example').addEventListener('change',()=>loadExample($('example').value));
$('try-example').addEventListener('click',()=>loadExample('handoff'));
async function loadFile(file) {
  if(!file)return;
  const token=++revision;
  $('results').setAttribute('aria-busy','false');
  try {
    if(file.size>LIMITS.bytes)throw new Error('This file exceeds the 2 MiB limit. Choose a smaller file.');
    const text=decodeUtf8(new Uint8Array(await file.arrayBuffer()));
    if(token!==revision)return;
    dirty();originalText=text;source=`Local file · ${file.name}`;$('csv').value=text;$('example').value='';inspect();
  } catch(err) {if(token===revision){error(err.message);$('status').textContent='File not loaded. Previous input and inspection are preserved.';}}
}
$('file').addEventListener('change',()=>loadFile($('file').files[0]));
const drop=$('dropzone');
for(const type of ['dragenter','dragover'])drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('drag');});
for(const type of ['dragleave','drop'])drop.addEventListener(type,event=>{event.preventDefault();drop.classList.remove('drag');});
drop.addEventListener('drop',event=>{if(event.dataTransfer.files.length!==1){error('Drop exactly one CSV or text file.');return;}loadFile(event.dataTransfer.files[0]);});
$('clear').addEventListener('click',()=>{
  revision++;result=null;report=null;current=false;originalText=null;source='Pasted text';page=0;
  $('csv').value='';$('file').value='';$('example').value='';
  ['preview-table','findings','dialect-grid','context'].forEach(id=>$(id).replaceChildren());
  ['source-label','record-count','field-count','issue-count','parse-note','range','report-content','verdict','findings-intro'].forEach(id=>$(id).textContent='');
  $('output').hidden=true;$('empty').hidden=false;$('context-panel').hidden=true;$('report-content').hidden=true;
  $('report-preview').textContent='Preview report';$('results').setAttribute('aria-busy','false');clearError();
  $('status').textContent='Cleared from this tab. Choose a file, example or paste text to begin.';$('csv').focus();
});
$('previous').addEventListener('click',()=>{if(page>0){page--;preview();}});
$('next').addEventListener('click',()=>{if((page+1)*pageSize<result.rows.length){page++;preview();}});
$('close-context').addEventListener('click',()=>{$('context-panel').hidden=true;$('context').replaceChildren();});
function download(format) {
  if(!current||!report)return;
  const text=format==='json'?JSON.stringify(report,null,2)+'\n':reportMarkdown(report);
  const url=URL.createObjectURL(new Blob([text],{type:format==='json'?'application/json;charset=utf-8':'text/markdown;charset=utf-8'}));
  const link=el('a');link.href=url;link.download=`rowbrief-report.${format==='json'?'json':'md'}`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('status').textContent='Report download requested. Cell values, header names, source excerpts and filename are omitted. Review before sharing.';
}
$('json').addEventListener('click',()=>download('json'));
$('markdown').addEventListener('click',()=>download('markdown'));
$('report-preview').addEventListener('click',()=>{if(!current||!report)return;const show=$('report-content').hidden;$('report-content').textContent=show?reportMarkdown(report):'';$('report-content').hidden=!show;$('report-preview').textContent=show?'Hide report preview':'Preview report';});
document.documentElement.dataset.version=VERSION;

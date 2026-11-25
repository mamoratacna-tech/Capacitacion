const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'../SAMARA/ACTUALIZAR');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],downloads=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));
  await page.route('https://samara.test/',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
  await page.route('https://samara.test/pdf.worker.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('/tmp/contracts-pdf.worker.min.js')}));
  await page.goto('https://samara.test/');
  for(const file of ['/tmp/samara-pdf-lib-1.17.1.js','/tmp/contracts-pdf.min.js'])await page.addScriptTag({content:fs.readFileSync(file,'utf8')});
  for(const name of ['Evaluaciones','ImpresionEvaluaciones'])await page.addScriptTag({content:fs.readFileSync(path.join(root,name+'.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1]});
  await page.evaluate(assets=>{pdfjsLib.GlobalWorkerOptions.workerSrc='https://samara.test/pdf.worker.min.js';SamaraEvaluationPrint.init({template:key=>Promise.resolve(assets[key]),toast:message=>{throw Error(message);}});},JSON.parse(fs.readFileSync(path.join(root,'DatosImpresionEvaluaciones.html'),'utf8')));
  const employee={no:'10001',curp:'A'.repeat(18),position:'ANALISTA DE RECURSOS HUMANOS',department:'RECURSOS HUMANOS',plant:'Planta 1',classification:'I',company:'SAMARA'},row={...employee,employeeId:employee.curp,employeeName:'ANA LÓPEZ MARTÍNEZ',kind:'renewal',scheduledDate:'2026-11-15',contractStart:'2026-09-01',contractEnd:'2026-11-15',periodStart:'2026-09-01',periodEnd:'2026-11-15'};
  const names=['Inducción a la empresa','Reglamento interior de trabajo','Seguridad e higiene','Excel para el trabajo administrativo','Comunicación efectiva','Protección de la información'],dates=['2026-09-01','2026-09-05','2026-09-12','2026-09-25','2026-10-09','2026-11-06'];
  const attendance=names.map((name,i)=>({id:'l'+i,fecha:dates[i],cursoCodigo:'CAP-'+(i+1),cursoNombre:name,estado:'Validada',asistentes:[{curp:employee.curp,numero:employee.no,estado:'ok',firmo:true}]}));
  attendance.push({...attendance[0],id:'before',fecha:'2026-08-31',cursoNombre:'FUERA ANTES'},{...attendance[0],id:'after',fecha:'2026-11-16',cursoNombre:'FUERA DESPUÉS'},{...attendance[0],id:'draft',cursoNombre:'BORRADOR EXCLUIDO',estado:'Borrador'},{...attendance[0],id:'unsigned',cursoNombre:'SIN FIRMA EXCLUIDO',asistentes:[{curp:employee.curp,estado:'ok',firmo:false}]});
  const context={employees:[employee],attendance};
  async function prepare(r,ctx=context,exam=false,file){
   const result=await page.evaluate(async({row,employee,context,exam})=>{
    const result=await SamaraEvaluationPrint.prepare(row,employee,context,exam),bytes=new Uint8Array(await result.blob.arrayBuffer()),pdf=await pdfjsLib.getDocument({data:bytes.slice(),useSystemFonts:true}).promise,text=[],items=[];
    for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i),content=await p.getTextContent();text.push(content.items.map(v=>v.str).join(' ').replace(/\s+/g,' '));items.push(content.items.map(v=>({text:v.str,x:v.transform[4],y:v.transform[5],width:v.width,height:v.height})));}
    await pdf.destroy();return {...result,blob:undefined,bytes:Array.from(bytes),text,items};
   },{row:r,employee,context:ctx,exam});
   if(file)fs.writeFileSync(file,Buffer.from(result.bytes));return result;
  }
  const indirect=await prepare(row,context,false,'/tmp/MUESTRA_PERFORMANCE_REVIEW_ANEXO.pdf');
  assert.equal(indirect.key,'review');assert.equal(indirect.pages,5);assert.equal(indirect.annexPages,1);
  let annex=indirect.text.at(-1);for(const name of names)assert.ok(annex.includes(name));assert.match(annex,/ANEXO DE CAPACITACIÓN Y REVISIÓN CMCAP/);assert.match(annex,/¿Aplica para renovación de contrato\?/);assert.match(annex,/01\/09\/2026 al 15\/11\/2026/);assert.match(annex,/Representante CMCAP/);assert.doesNotMatch(annex,/Solo cursos recibidos|Los renglones continúan|Con observaciones|Requiere seguimiento|MUESTRA|datos ficticios/);
  assert.doesNotMatch(indirect.text.join(' '),/FUERA ANTES|FUERA DESPUÉS|BORRADOR EXCLUIDO|SIN FIRMA EXCLUIDO/);
  const top=indirect.items.at(-1),x=label=>top.find(i=>i.text===label)?.x;assert.equal(x('Nombre:'),x('Planta:'));
  const mid=await prepare({...row,kind:'mid'},context,false,'/tmp/MUESTRA_MITAD_PERIODO_ANEXO.pdf');assert.equal(mid.key,'mid');assert.equal(mid.pages,4);assert.equal(mid.annexPages,1);
  const directRow={...row,classification:'D',position:'OPERADOR DE PRODUCCIÓN III'};
  const direct=await prepare(directRow,context,false,'/tmp/MUESTRA_RHF0005_PERIODO.pdf');assert.equal(direct.key,'direct');assert.equal(direct.pages,3);assert.equal(direct.annexPages,1);
  for(const name of names.slice(0,4))assert.ok(direct.text[1].includes(name));for(const name of names.slice(4))assert.ok(!direct.text[1].includes(name)&&direct.text[2].includes(name));assert.match(direct.text[1],/01\/09\/2026 al 15\/11\/2026/);
  const four={...context,attendance:attendance.slice(0,4)};const annual=await prepare({...row,kind:'annual'},four);assert.equal(annual.key,'review');assert.equal(annual.annexPages,1);assert.match(annual.text.at(-1),/Anual/);assert.equal((await prepare(directRow,four)).pages,2);assert.equal((await prepare(directRow,{...context,attendance:[]})).pages,2);
  for(const position of ['ALMACENISTA I','Almacenista II','Almacenista III']){
   const r={...row,position},result=await prepare(r,four,false,position==='ALMACENISTA I'?'/tmp/MUESTRA_ALMACENISTA_RHF0005.pdf':undefined);assert.equal(result.key,'direct');assert.equal(result.pages,2);assert.equal(result.annexPages,0);assert.doesNotMatch(result.text.join(' '),/ANEXO DE CAPACITACIÓN Y REVISIÓN CMCAP/);assert.equal(r.classification,'I');
  }
  const empty=await prepare(row,{...context,attendance:[]});assert.match(empty.text.at(-1),/Sin capacitaciones validadas y firmadas/);assert.equal(empty.annexPages,1);
  const many=Array.from({length:80},(_,i)=>({...attendance[0],id:'mass'+i,cursoCodigo:'PRUEBA-'+String(i).padStart(3,'0'),cursoNombre:'CURSO CONTINUIDAD '+String(i).padStart(3,'0')+(i===8?' '+('Contenido detallado de capacitación '.repeat(20)):''),fecha:'2026-09-01'}));
  const stress=await prepare(row,{...context,attendance:many},false,'/tmp/MUESTRA_ANEXO_CONTINUIDAD.pdf'),combined=stress.text.slice(4).join(' ');
  assert.ok(stress.annexPages>2);for(let i=0;i<80;i++)assert.ok(combined.includes('CURSO CONTINUIDAD '+String(i).padStart(3,'0')));
  assert.equal((combined.match(/¿Aplica para renovación de contrato\?/g)||[]).length,1);
  for(const items of stress.items.slice(4))for(const item of items)if(item.text.trim()){assert.ok(item.y>=15,'Texto fuera del pie: '+item.text);assert.ok(item.x>=35&&item.x+item.width<=578,'Texto fuera del ancho: '+item.text);}
  const long=await prepare(directRow,{...context,attendance:[{...attendance[0],cursoNombre:'CAPACITACIÓN EXTENSA '+('Trabajo de calidad y mejora continua '.repeat(20))}]});assert.equal(long.pages,3);assert.match(long.text[1],/Ver detalle en continuación/);assert.match(long.text[2],/CAPACITACIÓN EXTENSA/);
  await assert.rejects(()=>prepare({...row,periodStart:'',periodEnd:''}),/periodo a evaluar válido/);
  await assert.rejects(()=>prepare({...row,kind:'annual',periodStart:'2026-11-16',periodEnd:'2026-11-15'}),/periodo a evaluar válido/);
  await assert.rejects(()=>prepare({...row,position:'ALMACENISTA I',department:'SAMARA-MEP'},context,true),/solo a personal directo/);
  const exam=await prepare({...directRow,periodStart:'',periodEnd:'',department:'SAMARA-MEP'},context,true);assert.equal(exam.key,'exam-mep');assert.equal(exam.annexPages,0);
  const before=JSON.stringify(context);await page.evaluate(async({row,employee,context})=>SamaraEvaluationPrint.preview(row,employee,context),{row,employee,context});assert.equal(await page.locator('.ev-preview-paper canvas').count(),5);assert.equal(JSON.stringify(context),before);assert.deepEqual(downloads,[]);assert.deepEqual(errors,[]);
  console.log('OK: RHF0005 para tres almacenistas sin reclasificar, cuatro cursos y continuidad, filtro por periodo, anexo aprobado para Performance Review/mitad, seis cursos en una hoja, impresión sin descargas, casos vacíos/largos/80 cursos, fechas inválidas y examen solo directo.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

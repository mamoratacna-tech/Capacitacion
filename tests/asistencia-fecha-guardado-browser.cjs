const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'../SAMARA/ACTUALIZAR');
function include(name){const file=path.join(root,name+'.html');return fs.existsSync(file)?fs.readFileSync(file,'utf8'):'<script>window.seedData={positions:[],matrixPositions:[],courses:[]};window.sirceAreaThemes=[];</script>';}
const html=include('Index').replace(/<\?!= include\('([^']+)'\); \?>/g,(_,name)=>include(name)).replace(/<\?= initialView \?>/g,'dashboard').replace(/<script\b[^>]*\bsrc=[^>]*>[\s\S]*?<\/script>/gi,'');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
  sessionStorage.setItem('samara.session','valid-session');
  const state={'samara.demoEmployees.v1':true,'samara.attendanceMigration.v1':true,
   'samara.employees.v2':[{no:'67092',curp:'AAAAAAAAAAAAAAAAAA',names:'ANA',paternal:'EJEMPLO',company:'SAMARA',position:'OPERADOR',department:'PRODUCCIÓN',activeStatus:'Activo'}],
   'samara.positions.v2':[{job:'OPERADOR',department:'PRODUCCIÓN'}], 'samara.matrixPositions.v2':[],
   'samara.courses.v2':[{code:'RH-TACNA002',name:'NOM-035-STPS-2018 Factores de Riesgo Psicosocial',duration:'1',instructorClass:'Interno',plant:'Planta 1',instructorIds:['i'],objectiveCode:'1',objectiveCatalogVersion:'sirce-v1'}],
   'samara.instructors.v1':[{id:'i',type:'Interno',employeeName:'INSTRUCTOR AUTORIZADO',authorizedCourses:[{courseCode:'RH-TACNA002',certificationDate:'2026-01-01'}]}],
   'samara.attendance.v1':[{id:'pdf-sin-fecha',cursoCodigo:'RH-TACNA002',cursoNombre:'NOM-035-STPS-2018 Factores de Riesgo Psicosocial',fecha:'',estado:'Borrador',leidaDePDF:true,lecturaLocal:true,objectiveCatalogVersion:'sirce-v1',encabezado:{instructor:'INSTRUCTOR AUTORIZADO',instructorId:'i',clasificacion:'Interno',duracion:'1',lugar:'Planta 1',objetivo:'1'},asistentes:[{numero:'67092',firmo:false,ok:true}]}]};
  let db=JSON.parse(localStorage.getItem('fecha-test')||'null')||{state,revision:1};window.__db=db;
  function runner(success,failure){return new Proxy({},{get:(_,method)=>method==='withSuccessHandler'?cb=>runner(cb,failure):method==='withFailureHandler'?cb=>runner(success,cb):(...args)=>setTimeout(()=>{try{let result;if(method==='api_loadAppState')result=structuredClone(db);else if(method==='api_saveAppState'){if(args[1]!==db.revision)result={conflict:true};else{Object.assign(db.state,structuredClone(args[0]));result={revision:++db.revision};localStorage.setItem('fecha-test',JSON.stringify(db));}}else if(method==='api_listadosHistoricos')result=[];else throw Error(method);success(result);}catch(error){failure(error);}},0)});}window.google={script:{run:runner(()=>{},()=>{})}};
 });
 await page.route('https://samara.test/',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:html}));await page.route('**/*',route=>route.request().url()==='https://samara.test/'?route.fallback():route.abort());
 await page.goto('https://samara.test/');await page.locator('#cloud-loading').waitFor({state:'detached'});await page.locator('[data-view="attendance"]').click();await page.locator('[data-att="abrir"][data-id="pdf-sin-fecha"]').click();
 const date=page.locator('#att-fecha'),save=page.locator('#att-save'),message=page.locator('#att-msg');
 assert.equal(await date.inputValue(),'');assert.ok(await save.isDisabled());assert.match(await message.textContent(),/Captura una fecha de ejecución válida/);
 // A date entered with only an input event must immediately update validation,
 // before blur/change, without rerendering and losing focus or other field values.
 await date.focus();await date.evaluate(input=>{input.value='2026-10-20';input.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.ok(await save.isEnabled(),'Una fecha válida debe habilitar Guardar sin cambiar otro campo');assert.doesNotMatch(await message.textContent(),/fecha de ejecución válida/);assert.equal(await date.evaluate(input=>document.activeElement===input),true);
 assert.equal(await page.locator('[data-sirce-field="inicio"]').inputValue(),'2026-10-20');assert.equal(await page.locator('[data-sirce-field="fin"]').inputValue(),'2026-10-20');
 await date.fill('');assert.ok(await save.isDisabled());assert.match(await message.textContent(),/fecha de ejecución válida/);
 await date.fill('2026-10-20');assert.ok(await save.isEnabled());assert.doesNotMatch(await message.textContent(),/fecha de ejecución válida/);
 await save.click();await page.locator('#att-fecha').waitFor({state:'detached'});assert.equal(await page.evaluate(()=>window.__db.state['samara.attendance.v1'].length),1);
 let saved=await page.evaluate(()=>window.__db.state['samara.attendance.v1'][0]);assert.equal(saved.id,'pdf-sin-fecha');assert.equal(saved.fecha,'2026-10-20');assert.equal(saved.sirceDatos.inicio,'2026-10-20');assert.equal(saved.sirceDatos.fin,'2026-10-20');assert.equal(saved.asistentes[0].firmo,false);
 await page.reload();await page.locator('#cloud-loading').waitFor({state:'detached'});await page.locator('[data-view="attendance"]').click();await page.locator('[data-att="abrir"][data-id="pdf-sin-fecha"]').click();assert.equal(await date.inputValue(),'2026-10-20');assert.ok(await save.isEnabled());
 // Dates deliberately entered for a multi-day course remain independent.
 await page.locator('[data-sirce-field="inicio"]').fill('2026-10-18');await page.locator('[data-sirce-field="fin"]').fill('2026-10-25');await date.fill('2026-10-21');assert.ok(await save.isEnabled());assert.equal(await page.locator('[data-sirce-field="inicio"]').inputValue(),'2026-10-18');assert.equal(await page.locator('[data-sirce-field="fin"]').inputValue(),'2026-10-25');await save.click();await page.locator('#att-fecha').waitFor({state:'detached'});
 saved=await page.evaluate(()=>window.__db.state['samara.attendance.v1'][0]);assert.equal(saved.fecha,'2026-10-21');assert.equal(saved.sirceDatos.inicio,'2026-10-18');assert.equal(saved.sirceDatos.fin,'2026-10-25');
 assert.deepEqual(errors,[]);console.log('OK: borrador PDF sin fecha, validación inmediata por input/change, bloqueo de fecha vacía, guardado y recarga sin duplicados, firmas y rango SIRCE conservados.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

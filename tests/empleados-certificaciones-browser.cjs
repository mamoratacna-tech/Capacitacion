const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.join(__dirname,'../SAMARA/ACTUALIZAR');
function include(name){const file=path.join(root,name+'.html');return fs.existsSync(file)?fs.readFileSync(file,'utf8'):'<script>window.seedData={positions:[],matrixPositions:[],courses:[]};window.sirceAreaThemes=[];</script>';}
const html=include('Index').replace(/<\?!= include\('([^']+)'\); \?>/g,(_,name)=>include(name)).replace(/<\?= initialView \?>/g,'dashboard').replace(/<script\b[^>]*\bsrc=[^>]*>[\s\S]*?<\/script>/gi,'');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
  let db=JSON.parse(localStorage.getItem('test-db')||'null');if(!db){const state={'samara.demoEmployees.v1':true,'samara.attendanceMigration.v1':true,'samara.employees.v2':[{no:'1',curp:'AAAAAAAAAAAAAAAAAA',names:'ANA',paternal:'UNO',position:'OPERADOR',department:'PRODUCCIÓN',company:'SAMARA'},{no:'2',curp:'BBBBBBBBBBBBBBBBBB',names:'LUIS',paternal:'DOS',position:'OPERADOR',department:'PRODUCCIÓN',company:'SAMARA'},{no:'3',curp:'CCCCCCCCCCCCCCCCCC',names:'MARIA',paternal:'TRES',position:'OPERADOR',department:'PRODUCCIÓN',company:'TACNA'}],'samara.positions.v2':[],'samara.matrixPositions.v2':[],'samara.courses.v2':[{code:'INT',name:'CURSO INTERNO ÁREA',duration:'2',instructorClass:'Interno'},{code:'EXT',name:'CURSO EXTERNO',duration:'2',instructorClass:'Externo'}],'samara.instructors.v1':[{id:'i',type:'Interno',employeeName:'ANA EJEMPLO',authorizationDate:'2024-01-01',authorizedCourses:[{courseCode:'INT',name:'CURSO INTERNO ÁREA',certificationDate:'2025-01-01'},{courseCode:'EXT',name:'CURSO EXTERNO',certificationDate:'2026-01-01'}]},{id:'e',type:'Externo',externalName:'PROVEEDOR',rfc:'XAXX010101000'}]};state['samara.attendance.v1']=[{id:'lst-hidden-a',cursoCodigo:'INT',cursoNombre:'CURSO INTERNO ÁREA',fecha:'2026-01-09',encabezado:{instructor:'ANA EJEMPLO',duracion:'2'},asistentes:[]},{id:'lst-hidden-b',cursoCodigo:'EXT',cursoNombre:'CURSO EXTERNO',fecha:'2026-01-10',encabezado:{instructor:'PROVEEDOR',duracion:'2'},asistentes:[]}];db={state,revision:1};}
  window.__testDb=db;function runner(success,failure){return new Proxy({},{get:(_,method)=>method==='withSuccessHandler'?cb=>runner(cb,failure):method==='withFailureHandler'?cb=>runner(success,cb):(...args)=>setTimeout(()=>{try{let result;if(method==='api_loadAppState')result=structuredClone(db);else if(method==='api_saveAppState'){if(args[1]!==db.revision)result={conflict:true};else{Object.assign(db.state,structuredClone(args[0]));db.revision++;localStorage.setItem('test-db',JSON.stringify(db));result={revision:db.revision};}}else if(method==='api_listadosHistoricos')result=[];else throw Error(method);success(result);}catch(error){failure(error);}},0)});}window.google={script:{run:runner(()=>{},()=>{})}};
 });
 await page.route('https://samara.test/',route=>route.fulfill({contentType:'text/html',body:html}));await page.route('**/*',route=>route.request().url()==='https://samara.test/'?route.fallback():route.abort());await page.goto('https://samara.test/');await page.locator('#cloud-loading').waitFor({state:'detached'});await page.locator('[data-view="attendance"]').click();

 await page.locator('[data-view="people"]').click();
 assert.ok((await page.locator('#people-table').textContent()).includes('PRODUCCIÓN'));
 await page.locator('#import-active-employees').click();
 await page.locator('#employee-file').setInputFiles({name:'activos.csv',mimeType:'text/csv',buffer:Buffer.from('No,Departamento\r\n1,NUEVA AREA\r\n')});
 await page.locator('#employee-import-dialog').waitFor({state:'visible'});
 assert.ok((await page.locator('#employee-import-summary').textContent()).includes('1 marcados como baja'));
 assert.ok((await page.locator('#employee-import-details').textContent()).includes('LUIS DOS'));assert.ok((await page.locator('#employee-import-details').textContent()).includes('NUEVA AREA'));
 assert.equal(await page.evaluate(()=>window.__testDb.state['samara.employees.v2'][1].activeStatus),undefined);
 await page.locator('#employee-import-apply').click();await page.locator('#employee-import-dialog').waitFor({state:'hidden'});
 const employees=await page.evaluate(()=>window.__testDb.state['samara.employees.v2']);assert.equal(employees[1].activeStatus,'Inactivo');assert.equal(employees[2].activeStatus,undefined);assert.equal(employees.length,3);assert.equal(employees[0].department,'NUEVA AREA');assert.ok(await page.evaluate(()=>window.__testDb.state['samara.matrixPositions.v2'].some(x=>x.job==='OPERADOR'&&x.department==='NUEVA AREA')));
 await page.locator('[data-employee-company="TACNA"]').click();assert.ok(await page.locator('#import-active-employees').isHidden());
 await page.locator('[data-view="instructors"]').click();
 await page.locator('[data-edit-instructor="i"]').click();
 assert.equal(await page.locator('[data-certification-date]').count(),2);assert.equal(await page.locator('[data-certification-date]').first().inputValue(),'2025-01-01');
 await page.locator('#instructor-dialog [data-close="instructor-dialog"]').first().click();
 await page.locator('[data-print-instructor="i"]').click();assert.equal(await page.locator('[data-print-course]').count(),2);
 await page.locator('#instructor-print-from').fill('2026-01-01');await page.locator('#instructor-print-from').dispatchEvent('change');assert.equal(await page.locator('[data-print-course]').count(),1);
 await page.locator('#instructor-print-dialog [data-close="instructor-print-dialog"]').first().click();
 assert.deepEqual(errors,[]);await browser.close();console.log('OK: carga SAMARA con vista previa, bajas conservadas y TACNA intacta.');
})().catch(error=>{console.error(error);process.exit(1)});

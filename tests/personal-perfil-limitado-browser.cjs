const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const createServer=require('./helpers/auth-server.cjs'),root=path.join(__dirname,'../SAMARA/ACTUALIZAR');
function include(name){const file=path.join(root,name+'.html');return fs.existsSync(file)?fs.readFileSync(file,'utf8'):'<script>window.seedData={positions:[],matrixPositions:[],courses:[]};window.sirceAreaThemes=[];</script>';}
const html=include('Index').replace(/<\?!= include\('([^']+)'\); \?>/g,(_,name)=>include(name)).replace(/<\?= initialView \?>/g,'dashboard').replace(/<script\b[^>]*\bsrc=[^>]*>[\s\S]*?<\/script>/gi,'');
(async()=>{
 const server=createServer(html),{admin,b}=server.setup(),context=server.context;
 const target=server.call('api_usersList',admin.token).find(user=>user.role==='coordinator');
 server.call('api_usersSave',{...target,permissions:{people:'edit'}},admin.token);
 const limited=server.call('api_authLogin',target.username,b.key);
 const people=[{no:'1',curp:'A'.repeat(18),names:'ANA',paternal:'EJEMPLO',maternal:'UNO',company:'SAMARA',position:'OPERADOR',department:'PRODUCCIÓN',plant:'Planta 1',activeStatus:'Activo',studies:'3',proofDocType:'2',institutionType:'1'},{no:'2',curp:'B'.repeat(18),names:'LUIS',paternal:'EJEMPLO',maternal:'DOS',company:'SAMARA',position:'OPERADOR',department:'PRODUCCIÓN',plant:'Planta 2',activeStatus:'Activo',studies:'3',proofDocType:'2',institutionType:'1'}];
 const state={'samara.demoEmployees.v1':true,'samara.attendanceMigration.v1':true,'samara.employees.v2':people,'samara.positions.v2':[{job:'OPERADOR',department:'PRODUCCIÓN',classification:'D',activeStatus:'Activo'}],'samara.matrixPositions.v2':[{id:'p',job:'OPERADOR',department:'PRODUCCIÓN',classification:'D'}],'samara.matrixDepartments.v1':[{id:'dep',name:'PRODUCCIÓN',activeStatus:'Activo'}],'samara.courses.v2':[{code:'C1',name:'CURSO DE PRUEBA',duration:'2',instructorClass:'Interno',plant:'Planta 1',instructorIds:['i'],objectiveCode:'1',objectiveCatalogVersion:'sirce-v1'}],'samara.instructors.v1':[{id:'i',type:'Interno',employeeName:'INSTRUCTOR AUTORIZADO',authorizedCourses:[{courseCode:'C1',certificationDate:'2026-01-01'}]}],'samara.attendance.v1':[{id:'lista',cursoCodigo:'C1',cursoNombre:'CURSO DE PRUEBA',fecha:'2026-10-20',estado:'Borrador',objectiveCatalogVersion:'sirce-v1',encabezado:{instructor:'INSTRUCTOR AUTORIZADO',instructorId:'i',clasificacion:'Interno',duracion:'2',lugar:'Planta 1',objetivo:'1'},asistentes:[{numero:'1',firmo:false,ok:true}]}]};
 let storage=[['Colección','Parte','JSON'],['_revision',0,'1'],...Object.entries(state).map(([key,value])=>[key,0,'JSON:'+JSON.stringify(value)])];
 const sheet={getDataRange:()=>({getValues:()=>structuredClone(storage)}),getLastRow:()=>storage.length,getMaxRows:()=>10000,insertRowsAfter(){},getRange(row,col,height,width){return {setValues(values){values.forEach((v,i)=>storage[row+i-1]=structuredClone(v));},clearContent(){for(let i=0;i<height;i++)storage[row+i-1]=['','',''];}};}};
 context.database_=()=>({getSheetByName:name=>name==='SAMARA_AppState'?sheet:null});context.SpreadsheetApp={flush(){}};
 const read=()=>context.appRead_(sheet),calls=[],writes=[];
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.exposeFunction('__rpc',(method,args)=>{calls.push(method);if(method==='api_saveAppState')writes.push(Object.keys(args[0]));return server.call(method,...args);});
 await page.addInitScript(({admin})=>{sessionStorage.setItem('samara.session',admin.token);window.SAMARA_ENTRY={user:admin.user};function runner(success,failure){return new Proxy({},{get:(_,method)=>method==='withSuccessHandler'?cb=>runner(cb,failure):method==='withFailureHandler'?cb=>runner(success,cb):(...args)=>window.__rpc(method,args).then(success,e=>failure({message:e.message}))});}window.google={script:{run:runner(()=>{},()=>{})}};},{admin:limited});
 await page.route('https://samara.test/',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:html}));await page.route('**/*',r=>r.request().url()==='https://samara.test/'?r.fallback():r.abort());
 await page.goto('https://samara.test/');await page.locator('#cloud-loading').waitFor({state:'detached'});
 assert.ok(await page.locator('#cloud-error').isHidden(),'El perfil Personal no debe fallar al inicializar módulos sin permiso: '+await page.locator('#cloud-error-message').textContent());
 await page.locator('[data-view="people"]').click();assert.ok(await page.locator('[data-view="matrix"]').isHidden());
 await page.locator('#add-employee').click();await page.locator('#employee-dialog').waitFor();
 for(const [name,value] of Object.entries({no:'3',curp:'C'.repeat(18),names:'NUEVA PERSONA',paternal:'EJEMPLO',maternal:'TRES'}))await page.locator('#employee-form [name="'+name+'"]').fill(value);
 for(const [name,value] of Object.entries({studies:'3',proofDocType:'2',institutionType:'1',position:'OPERADOR',plant:'Planta 2'}))await page.locator('#employee-form [name="'+name+'"]').selectOption(value);
 assert.equal(await page.locator('#employee-form [name="department"]').inputValue(),'PRODUCCIÓN');
 const protectedBefore=JSON.stringify(read().state['samara.positions.v2']);
 await page.locator('#employee-form [type="submit"]').click();await page.locator('#employee-dialog').waitFor({state:'hidden'});
 const saved=read().state['samara.employees.v2'].find(row=>row.curp==='C'.repeat(18));assert.equal(saved.no,'3');assert.equal(saved.plant,'Planta 2');assert.equal(saved.position,'OPERADOR');assert.equal(JSON.stringify(read().state['samara.positions.v2']),protectedBefore);
 assert.throws(()=>server.call('api_saveAppState',{'samara.positions.v2':[]},read().revision,limited.token),/PERMISSION_DENIED/);
 assert.throws(()=>server.call('api_usersList',limited.token),/administrador/);
 await page.reload();await page.locator('#cloud-loading').waitFor({state:'detached'});await page.locator('[data-view="people"]').click();assert.equal(await page.locator('[data-edit-employee="'+saved.curp+'"]').count(),1);
 await page.locator('[data-edit-employee="'+saved.curp+'"]').click();assert.equal(await page.locator('#employee-form [name="plant"]').inputValue(),'Planta 2');await page.locator('#employee-form [name="names"]').fill('PERSONA ACTUALIZADA');await page.locator('#employee-form [type="submit"]').click();await page.locator('#employee-dialog').waitFor({state:'hidden'});assert.equal(read().state['samara.employees.v2'].find(row=>row.no==='3').names,'PERSONA ACTUALIZADA');
 assert.ok(writes.flat().every(key=>['samara.employees.v2','samara.demoEmployees.v1'].includes(key)),'No debe escribir catálogos de módulos ajenos');
 const updated=server.call('api_usersSave',{...target,permissions:{people:'view'}},admin.token),readOnly=server.call('api_authLogin',updated.username,b.key),ro=await browser.newPage();
 await ro.exposeFunction('__rpc',(method,args)=>server.call(method,...args));
 await ro.addInitScript(({actor})=>{sessionStorage.setItem('samara.session',actor.token);window.SAMARA_ENTRY={user:actor.user};function runner(success,failure){return new Proxy({},{get:(_,method)=>method==='withSuccessHandler'?cb=>runner(cb,failure):method==='withFailureHandler'?cb=>runner(success,cb):(...args)=>window.__rpc(method,args).then(success,e=>failure({message:e.message}))});}window.google={script:{run:runner(()=>{},()=>{})}};},{actor:readOnly});
 await ro.route('https://samara.test/',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:html}));await ro.route('**/*',r=>r.request().url()==='https://samara.test/'?r.fallback():r.abort());
 await ro.goto('https://samara.test/');await ro.locator('#cloud-loading').waitFor({state:'detached'});assert.ok(await ro.locator('#cloud-error').isHidden());await ro.locator('[data-view="people"]').click();assert.ok(await ro.locator('#add-employee').isHidden());assert.ok(await ro.locator('[data-edit-employee="'+saved.curp+'"]').isHidden());
 assert.throws(()=>server.call('api_saveAppState',{'samara.employees.v2':[]},read().revision,readOnly.token),/PERMISSION_DENIED/);assert.equal(read().state['samara.employees.v2'].length,3);
 assert.deepEqual(errors,[]);console.log('OK: usuario con solo Personal edición puede entrar, agregar y modificar empleado con puesto/departamento existentes; no puede editar Matriz ni administrar Usuarios.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

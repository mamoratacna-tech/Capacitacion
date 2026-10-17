const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('SAMARA/ACTUALIZAR/Cmcap.html','utf8').replace(/<\/?script>/g,''),ctx);const C=ctx.window.Cmcap;
const row=(name,startDate,endDate)=>({role:'Coordinador',name,startDate,endDate});
test('periodo de dos años, inclusive y año bisiesto',()=>{assert.equal(C.end('2026-01-01'),'2027-12-31');assert.equal(C.end('2024-02-29'),'2026-02-27');assert.equal(C.valid('2026-99-01'),false);assert.equal(C.valid('2026-02-30'),false)});
test('firma histórica en ambos límites; no usa integrante actual ni datos sin fechas',()=>{const rows=[row('Ana','2024-01-01','2025-12-31'),row('Luis','2026-01-01','2027-12-31'),{role:'Coordinador',name:'Sin fechas'}];for(const date of ['2024-01-01','2025-12-31'])assert.equal(C.member(rows,'Coordinador',date).name,'Ana');assert.equal(C.member(rows,'Coordinador','2026-01-01').name,'Luis');assert.throws(()=>C.member(rows,'Coordinador','2028-01-01'),/No hay/)});
test('rechaza solapamientos, huecos, fechas inválidas y periodos mayores a dos años',()=>{assert.throws(()=>C.validate([row('Ana','2026-01-01','2027-12-31'),row('Luis','2027-12-31','2029-12-30')]),/superponer/);assert.throws(()=>C.validate([row('Ana','2026-01-01','2028-01-01')]),/dos años/);assert.throws(()=>C.validate([row('Ana','','')]),/Completa/);assert.throws(()=>C.member([row('Ana','2026-01-01','2027-12-31'),row('Luis','2026-01-01','2027-12-31')],'Coordinador','2026-05-01'),/superpuestas/);assert.doesNotThrow(()=>C.validate([row('Ana','2024-01-01','2025-12-31'),row('Luis','2026-01-01','2027-12-31')]))});
test('FT007 imprime los firmantes de la fecha de autorización, no los actuales',()=>{
 const source=fs.readFileSync('SAMARA/ACTUALIZAR/App.html','utf8');const fn=source.slice(source.indexOf('function instructorApprovalHtml('),source.indexOf('function printInstructor('));
 const rows=[row('Coordinador anterior','2024-01-01','2025-12-31'),row('Coordinador actual','2026-01-01','2027-12-31'),{role:'Representante de los trabajadores',name:'Representante anterior',startDate:'2024-01-01',endDate:'2025-12-31'}];
 const context={window:{FT007_IMG:''},escapeHtml:s=>String(s||''),cmcapSigner:(role,date)=>C.member(rows,role,date).name};vm.createContext(context);vm.runInContext(fn,context);
 const html=context.instructorApprovalHtml({type:'Interno',authorizationDate:'2025-12-31',authorizedCourses:[]});assert.match(html,/Coordinador anterior/);assert.match(html,/Representante anterior/);assert.doesNotMatch(html,/Coordinador actual/);assert.throws(()=>context.instructorApprovalHtml({authorizationDate:'2028-01-01'}),/No hay/);
});
test('seis puestos, etiquetas de firma y colores de vigencia',()=>{
 assert.equal(C.roles.length,6);assert.equal(C.signatureLabel('Vocal - Representante del Patrón'),'Vocal');assert.equal(C.signatureLabel('Secretario - Representa de los trabajadores'),'Secretario');
 assert.equal(C.status(row('Ana','',''),'2026-10-15').kind,'pending');assert.equal(C.status(row('Ana','2026-01-01','2027-12-31'),'2026-10-15').kind,'active');assert.equal(C.status(row('Ana','2024-01-01','2025-12-31'),'2026-10-15').kind,'expired');
 assert.throws(()=>C.validate([row('Ana','2026-01-01','2027-12-31'),{...row('Luis','2026-01-01','2027-12-31'),role:'Coordinador de CMCAP'}]),/superponer/);
 const vocal={...row('Ana','2026-01-01','2027-12-31'),role:C.roles[2]},worker={...vocal,name:'Luis',role:C.roles[4]};assert.doesNotThrow(()=>C.validate([vocal,worker]));
});
test('alta independiente de registros anteriores sin fechas o puestos sin reclasificar',()=>{
 const legacy=[{role:'Vocal',name:'Nombre conservado',term:'2024-2026'},{role:'Representante de los trabajadores',name:'Anterior',startDate:'',endDate:''}];
 const member={role:'Representante de los trabajadores',name:'Ana',employeeCurp:'DEMO',startDate:'2026-10-01',endDate:'2028-09-27'};
 const result=C.validateAddition(legacy,member);assert.equal(result.length,3);assert.equal(result[0],legacy[0]);assert.equal(result[1],legacy[1]);assert.throws(()=>C.validateAddition(result,{...member,name:'Otra persona'}),/superponer/);assert.throws(()=>C.validateAddition(legacy,{...member,endDate:'2028-10-02'}),/dos años/);
});
test('vocales y secretarios ilimitados con confirmación al superar dos simultáneos',()=>{
 const m={role:C.roles[2],name:'Uno',startDate:'2026-01-01',endDate:'2027-12-31'};
 const second={...m,role:C.roles[3],name:'Dos'},third={...m,name:'Tres'};
 assert.doesNotThrow(()=>C.validate([m,second,third]));
 assert.equal(C.needsConfirmation([m],second),false);
 assert.equal(C.needsConfirmation([m,second],third),true);
 assert.equal(C.needsConfirmation([m,second],{...third,startDate:'2028-01-01',endDate:'2029-12-31'}),false);
 assert.equal(C.role('Secretario - Representa del Patrón'),'Secretario - Representante del patrón');
 assert.equal(C.role('Vocal - Representante de los trabajadores'),'Vocal - Representante de los Trabajadores');
});
test('DC3 usa representante legal independiente del coordinador en backend',()=>{
 const source=fs.readFileSync('SAMARA/ACTUALIZAR/Code.gs','utf8');
 const fn=source.slice(source.indexOf('function api_cmcapFirmantes('),source.indexOf('// Lectura del histórico'));
 const state={'samara.cmcap.v2':[{role:'Representante de los trabajadores',name:'Firma trabajadores',startDate:'2026-01-01',endDate:'2027-12-31'}]};
 const context={LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},appRead_:()=>({state}),appSheet_:()=>null,database_:()=>null};
 vm.createContext(context);vm.runInContext(fn,context);
 assert.equal(context.api_cmcapFirmantes('2026-10-16').legal,'MIRNA ULBRICH LABASTIDA');
 state['samara.legalRepresentative.v1']=[{name:'Otra representante'}];
 assert.equal(context.api_cmcapFirmantes('2026-10-16').legal,'OTRA REPRESENTANTE');
 assert.equal(context.api_cmcapFirmantes('2026-10-16').trab,'Firma trabajadores');
});

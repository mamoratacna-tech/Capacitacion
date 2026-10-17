const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../SAMARA/ACTUALIZAR/App.html'),'utf8');
test('instructor autorizado se agrega sin duplicarse ni quitar otros instructores',()=>{
 const context=vm.createContext({fullInstructorName:item=>item.employeeName||item.externalName});
 vm.runInContext(source.slice(source.indexOf('    function syncInstructorCourseAssignments('),source.indexOf('    function instructorApprovalHtml(')),context);
 const instructor={id:'new',type:'Interno',employeeName:'ANA',authorizedCourses:[{courseCode:'RH001'},{courseCode:'__other__'}]},other={id:'old',type:'Interno',employeeName:'LUIS'};
 const catalog=[{code:'RH001',instructorIds:['old'],instructorId:'old'},{code:'RH002',instructorIds:['old']}];
 const updated=context.syncInstructorCourseAssignments(catalog,instructor,[other,instructor]);
 assert.equal(updated[0].instructorIds.join(','),'old,new');assert.equal(updated[0].instructor,'LUIS, ANA');assert.equal(updated[0].instructorId,'old');assert.equal(updated[1],catalog[1]);assert.equal(catalog[0].instructorIds.join(','),'old');
 const repeated=context.syncInstructorCourseAssignments(updated,instructor,[other,instructor]);assert.equal(repeated[0].instructorIds.join(','),'old,new');
});
test('puestos inactivos se excluyen por nombre de todos sus departamentos, activos anteriores se conservan',()=>{
 const context=vm.createContext({norm:value=>String(value||'').toLowerCase(),positions:[{job:'Operador',activeStatus:'Inactivo'},{job:'Técnico'},{job:'Supervisor',_legacy:{estado:'Inactivo'}}],matrixPositions:[{job:'OPERADOR',department:'A'},{job:'OPERADOR',department:'B'},{job:'Técnico',department:'A'},{job:'Supervisor',department:'A'}]});
 vm.runInContext(source.slice(source.indexOf('    function positionIsActive('),source.indexOf('    function filteredMatrixRows(')),context);
 assert.equal(context.activeMatrixPositions().length,1);assert.equal(context.activeMatrixPositions()[0].job,'Técnico');
 context.positions[0].activeStatus='Activo';assert.equal(context.activeMatrixPositions().length,3);
});

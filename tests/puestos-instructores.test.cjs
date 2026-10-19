const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../SAMARA/ACTUALIZAR/App.html'),'utf8');
test('instructor autorizado se agrega sin duplicarse ni quitar otros instructores',()=>{
 const context=vm.createContext({norm:value=>String(value||'').trim().toLowerCase(),fullInstructorName:item=>item.employeeName||item.externalName});
 vm.runInContext(source.slice(source.indexOf('    function syncInstructorCourseAssignments('),source.indexOf('    function instructorApprovalHtml(')),context);
 const instructor={id:'new',type:'Interno',employeeName:'ANA',authorizedCourses:[{courseCode:'RH001'},{courseCode:'__other__'}]},other={id:'old',type:'Interno',employeeName:'LUIS'};
 const catalog=[{code:'RH001',instructorIds:['old'],instructorId:'old'},{code:'RH002',instructorIds:['old']}];
 const updated=context.syncInstructorCourseAssignments(catalog,instructor,[other,instructor]);
 assert.equal(updated[0].instructorIds.join(','),'old,new');assert.equal(updated[0].instructor,'LUIS, ANA');assert.equal(updated[0].instructorId,'old');assert.equal(updated[1],catalog[1]);assert.equal(catalog[0].instructorIds.join(','),'old');
 const repeated=context.syncInstructorCourseAssignments(updated,instructor,[other,instructor]);assert.equal(repeated[0].instructorIds.join(','),'old,new');
});
test('puestos inactivos se excluyen por nombre de todos sus departamentos, activos anteriores se conservan',()=>{
 const context=vm.createContext({employeeIsActive:e=>e.activeStatus!=='Inactivo',employees:[{position:'Operador',department:'A'},{position:'Operador',department:'B'},{position:'Técnico',department:'A'},{position:'Supervisor',department:'A'}],employeeCompany:e=>e.company||'SAMARA',matrixDepartments:[],norm:value=>String(value||'').toLowerCase(),positions:[{job:'Operador',activeStatus:'Inactivo'},{job:'Técnico'},{job:'Supervisor',_legacy:{estado:'Inactivo'}}],matrixPositions:[{job:'OPERADOR',department:'A'},{job:'OPERADOR',department:'B'},{job:'Técnico',department:'A'},{job:'Supervisor',department:'A'}]});
 vm.runInContext(source.slice(source.indexOf('    function positionIsActive('),source.indexOf('    function filteredMatrixRows(')),context);
 assert.equal(context.activeMatrixPositions().length,1);assert.equal(context.activeMatrixPositions()[0].job,'Técnico');
 context.positions[0].activeStatus='Activo';assert.equal(context.activeMatrixPositions().length,3);
});
test('departamentos inactivos o eliminados excluyen sus puestos, incluidos nombres anteriores',()=>{
 const context=vm.createContext({employeeIsActive:e=>e.activeStatus!=='Inactivo',employees:[{position:'Uno',department:'Producción'},{position:'Dos',department:'Calidad'},{position:'Tres',department:'RH'}],employeeCompany:e=>e.company||'SAMARA',norm:value=>String(value||'').toLowerCase(),positions:[],matrixDepartments:[{name:'Producción general',aliases:['Producción'],activeStatus:'Inactivo'},{name:'Calidad',activeStatus:'Activo',deleted:true}],matrixPositions:[{job:'Uno',department:'Producción'},{job:'Dos',department:'Calidad'},{job:'Tres',department:'RH'}]});
 vm.runInContext(source.slice(source.indexOf('    function positionIsActive('),source.indexOf('    function filteredMatrixRows(')),context);
 assert.equal(context.activeMatrixPositions().length,1);assert.equal(context.activeMatrixPositions()[0].department,'RH');context.matrixDepartments[0].activeStatus='Activo';assert.equal(context.activeMatrixPositions().length,2);
});
test('matriz conserva puestos sin activos hasta inactivarlos; excluye TACNA',()=>{
 const context=vm.createContext({employeeIsActive:e=>e.activeStatus!=='Inactivo',norm:value=>String(value||'').toLowerCase(),employeeCompany:e=>e.company||'SAMARA',positions:[],matrixDepartments:[],employees:[{position:'ASESOR',company:'TACNA',department:'OTRO NOMBRE'},{position:'TÉCNICO',department:'RH',company:'TACNA'},{position:'TÉCNICO',department:'RH',company:'SAMARA'},{position:'NUEVO',department:'RH',company:'SAMARA',activeStatus:'Inactivo'}],matrixPositions:[{job:'ASESOR',department:'RH'},{job:'TÉCNICO',department:'RH'},{job:'NUEVO',department:'RH'}]});
 vm.runInContext(source.slice(source.indexOf('    function positionIsActive('),source.indexOf('    function filteredMatrixRows(')),context);
 assert.equal(context.activeMatrixPositions().map(p=>p.job).join(','),'TÉCNICO,NUEVO');
});
test('vacante se conserva en matriz hasta elegir inactivar esa combinación, sin afectar otros departamentos',()=>{
 const context=vm.createContext({norm:value=>String(value||'').toLowerCase(),employeeCompany:e=>e.company||'SAMARA',employees:[{position:'OPERADOR',department:'A',company:'SAMARA'},{position:'OPERADOR',department:'B',company:'SAMARA',activeStatus:'Inactivo'}],matrixDepartments:[],positions:[{job:'OPERADOR'}],matrixPositions:[{id:'a',job:'OPERADOR',department:'A'},{id:'b',job:'OPERADOR',department:'B'}]});
 vm.runInContext(source.slice(source.indexOf('    function positionIsActive('),source.indexOf('    function filteredMatrixRows(')),context);assert.equal(context.activeMatrixPositions().length,2);context.matrixPositions[1].activeStatus='Inactivo';assert.equal(context.activeMatrixPositions().map(x=>x.id).join(','),'a');assert.equal(context.matrixPositions.length,2);
});
test('curso capturado por nombre único vincula al instructor, sin elegir arbitrariamente nombres duplicados',()=>{const c=vm.createContext({norm:value=>String(value||'').trim().toLowerCase(),fullInstructorName:x=>x.employeeName});vm.runInContext(source.slice(source.indexOf('    function syncInstructorCourseAssignments('),source.indexOf('    function instructorApprovalHtml(')),c);const instructor={id:'i',employeeName:'NOMBRE',authorizedCourses:[{courseCode:'__other__',name:'Curso único'}]},catalog=[{code:'A',name:'CURSO ÚNICO'},{code:'B',name:'OTRO'}];assert.equal(c.syncInstructorCourseAssignments(catalog,instructor,[instructor])[0].instructorIds[0],'i');const ambiguous=[{code:'A',name:'Curso único'},{code:'B',name:'Curso único'}];assert.equal(c.syncInstructorCourseAssignments(ambiguous,instructor,[instructor])[0].instructorIds,undefined);});

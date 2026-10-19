const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../SAMARA/ACTUALIZAR/App.html'),'utf8');
test('identifica cursos de abreviaciones actuales y anteriores sin cambiar códigos',()=>{
 const courses=[{code:'RH-SAMARA001',department:'RH'},{code:'HR-TACNA001',department:'HR'},{code:'EHS-SAMARA001',department:'EHS'},{code:'RH-SAMARA002'}];
 const ctx=vm.createContext({courses});
 vm.runInContext(source.slice(source.indexOf('    function departmentCourses('),source.indexOf('    function renderCourseDepartments(')),ctx);
 const before=JSON.stringify(courses);
 assert.equal(ctx.departmentCourses({abbreviation:'HR',aliases:['RH']}).length,3);
 assert.equal(ctx.departmentCourses({abbreviation:'EHS'}).length,1);
 assert.equal(JSON.stringify(courses),before);
});
test('edición de curso conserva departamento eliminado sin ofrecerlo en cursos nuevos',()=>{
 const select={innerHTML:'',value:''};
 const ctx=vm.createContext({courseDepartments:[{abbreviation:'PROD',name:'Producción'}],courseForm:{elements:{department:select}},escapeHtml:String});
 vm.runInContext(source.slice(source.indexOf('    function fillCourseDepartmentOptions('),source.indexOf("    $$('[data-course-tab]')")),ctx);
 ctx.fillCourseDepartmentOptions('RH');assert.match(select.innerHTML,/RH · Código conservado/);assert.equal(select.value,'RH');
 ctx.fillCourseDepartmentOptions();assert.doesNotMatch(select.innerHTML,/Código conservado/);assert.match(select.innerHTML,/PROD · Producción/);
});
test('departamento canónico repara alias en puestos y módulos sin cambiar IDs ni cursos aplicables',()=>{
 const c=vm.createContext({norm:v=>String(v||'').toLowerCase()});vm.runInContext(source.slice(source.indexOf('    function syncDepartmentReferences('),source.indexOf('    function currentDepartmentNames(')),c);
 const collections={'samara.positions.v2':[{job:'PUESTO',department:'ANTERIOR',sirceCode:'123'}],'samara.matrixPositions.v2':[{id:'ID-ESTABLE',job:'PUESTO',department:'ANTERIOR'}],'samara.employees.v2':[{curp:'CURP',department:'ANTERIOR'}],'samara.instructors.v1':[{id:'i',employeeDepartment:'ALIAS'}],'samara.courses.v2':[{code:'RH001',department:'ANTERIOR',applicablePositions:['ID-ESTABLE']}]},snapshot=JSON.stringify(collections),departments=[{name:'NOMBRE COMPLETO',aliases:['ANTERIOR','ALIAS']}];
 const result=c.syncDepartmentReferences(departments,collections);assert.equal(Object.keys(result.updates).length,4);assert.equal(result.next['samara.positions.v2'][0].department,'NOMBRE COMPLETO');assert.equal(result.next['samara.positions.v2'][0].sirceCode,'123');assert.equal(result.next['samara.matrixPositions.v2'][0].id,'ID-ESTABLE');assert.equal(result.next['samara.instructors.v1'][0].employeeDepartment,'NOMBRE COMPLETO');assert.equal(result.next['samara.courses.v2'][0].applicablePositions[0],'ID-ESTABLE');assert.equal(result.next['samara.courses.v2'][0].department,'ANTERIOR');assert.equal(JSON.stringify(collections),snapshot);assert.equal(Object.keys(c.syncDepartmentReferences(departments,result.next).updates).length,0);
});

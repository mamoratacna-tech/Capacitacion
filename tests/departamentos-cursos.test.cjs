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

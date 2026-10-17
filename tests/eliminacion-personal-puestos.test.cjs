const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../SAMARA/ACTUALIZAR/App.html'),'utf8');
function setup(accept=true){
 const writes=[];const context=vm.createContext({norm:s=>String(s||'').toLowerCase(),employees:[{curp:'A',names:'ANA',position:'Operador',company:'TACNA'}],positions:[{job:'Operador'},{job:'Técnico'}],matrixPositions:[{id:'p1',job:'Operador'},{id:'p2',job:'Técnico'}],courses:[{code:'C1',applicablePositions:['p1','p2']}],appConfirm:async()=>accept,fullEmployeeName:e=>e.names,toast(){},fillEmployeePositionOptions(){},persistCollection:async(key,value)=>writes.push({[key]:value})});
 vm.runInContext(source.slice(source.indexOf('    function employeeCompany('),source.indexOf('    function renderPositions(')),context);
 context.persistCollections=async updates=>writes.push(updates);for(const name of ['renderPeople','renderPositions','renderMatrix','renderCourses'])context[name]=()=>{};
 return {context,writes};
}
test('eliminar puesto limpia referencias de cursos y matriz, conservando personal y otros puestos',async()=>{
 const {context:c,writes}=setup();await c.deleteSircePosition('Operador',{disabled:false});assert.equal(c.positions.length,1);assert.equal(c.matrixPositions[0].id,'p2');assert.equal(c.courses[0].applicablePositions.join(','),'p2');assert.equal(c.employees[0].position,'Operador');assert.equal(Object.keys(writes[0]).length,3);
});
test('cancelar eliminación conserva todos los datos y no escribe',async()=>{
 const {context:c,writes}=setup(false);await c.deleteSircePosition('Operador',{disabled:false});await c.deleteEmployee('A',{disabled:false});assert.equal(c.positions.length,2);assert.equal(c.employees.length,1);assert.equal(writes.length,0);
});
test('TACNA se distingue y los registros anteriores pertenecen a SAMARA por defecto',()=>{
 const {context:c}=setup();assert.equal(c.employeeCompany({}),'SAMARA');assert.equal(c.employeeCompany({company:'Tacna'}),'TACNA');
});

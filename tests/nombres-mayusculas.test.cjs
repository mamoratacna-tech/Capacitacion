const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
for(const file of ['App.html','Code.gs'])test(file+': normaliza nombres sin alterar datos originales ni otros catálogos',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../SAMARA/ACTUALIZAR',file),'utf8');
 const start=source.indexOf('function normalizePersonNames('),end=source.indexOf(file==='App.html'?'    function loadStore(':'function appRead_(',start);
 const context=vm.createContext({});vm.runInContext(source.slice(start,end),context);
 const input=[{names:'María José',paternal:'Muñoz',maternal:'pérez',position:'Ingeniero'}];
 const result=context.normalizePersonNames('samara.employees.v2',input);
 assert.equal(result[0].names,'MARÍA JOSÉ');assert.equal(result[0].paternal,'MUÑOZ');assert.equal(result[0].maternal,'PÉREZ');assert.equal(result[0].position,'INGENIERO');assert.equal(input[0].names,'María José');
 assert.equal(context.normalizePersonNames('samara.instructors.v1',[{externalName:'Pedro García'}])[0].externalName,'PEDRO GARCÍA');
 const unrelated=['valor'];assert.equal(context.normalizePersonNames('otro',unrelated),unrelated);
 assert.equal(context.normalizePersonNames('samara.attendance.v1',[{encabezado:{instructor:'Ana'},asistentes:[{nombre:'Luis'}]}])[0].asistentes[0].nombre,'LUIS');
});

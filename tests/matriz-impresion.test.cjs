const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../SAMARA/ACTUALIZAR/App.html'),'utf8');
test('orden de nomenclatura compara números sin modificar códigos',()=>{
 const context=vm.createContext({});vm.runInContext(source.slice(source.indexOf('    function compareCourseCodes('),source.indexOf('    function filteredGlossaryCourses(')),context);
 const courses=[{code:'RH-TACNA10'},{code:'EHS-EXTERNO001'},{code:'RH-TACNA2'}];
 assert.deepEqual(courses.sort(context.compareCourseCodes).map(c=>c.code),['EHS-EXTERNO001','RH-TACNA2','RH-TACNA10']);
});
test('impresión cubre cada cruce de 29 cursos y 14 puestos una vez',()=>{
 const pairs=[];const rows=Array.from({length:14},(_,id)=>({position:{id}})),columns=Array.from({length:29},(_,code)=>({code}));
 const context=vm.createContext({filteredMatrixRows:()=>rows,filteredMatrixCourses:()=>columns,$:()=>({selectedOptions:[{textContent:'Todos'}],value:''}),escapeHtml:String,crossMatrixTable:(rs,cs)=>{rs.forEach(r=>cs.forEach(c=>pairs.push(r.position.id+':'+c.code)));return '<table></table>';}});
 vm.runInContext(source.slice(source.indexOf('    function matrixPrintHtml('),source.indexOf("    $('#matrix-print').addEventListener")),context);
 assert.match(context.matrixPrintHtml(),/MATRIZ DE CURSOS/);assert.equal(pairs.length,29*14);assert.equal(new Set(pairs).size,29*14);
});

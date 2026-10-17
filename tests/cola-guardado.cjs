const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = readFileSync(require('node:path').join(__dirname, '../SAMARA/ACTUALIZAR/App.html'), 'utf8');
const queue = source.slice(source.indexOf('    function flushCloud()'), source.indexOf('    function loadStore('));
const store = source.slice(source.indexOf('    function saveStore('), source.indexOf('    function migrateLegacy('));
const names = source.slice(source.indexOf('function normalizePersonNames('),source.indexOf('    function loadStore('));
const persist = source.slice(source.indexOf('    async function persistCollection('), source.indexOf("    $('#cmcap-add-form').addEventListener('invalid'"));
function setup() {
  const calls = [];
  const cloud = {pending:{},cache:{},revision:10,saving:false,blocked:false,inFlight:null};
  const context = vm.createContext({cloud, cloudKeys:['attendance','employees'], structuredClone, setTimeout, clearTimeout,
    cloudLabel(){}, cloudError(error){cloud.blocked=true;},
    googleCall(method,batch,revision){return new Promise((resolve,reject)=>calls.push({batch,revision,resolve,reject}));}});
  vm.runInContext(names + queue + store + persist + ';globalThis.api={persistCollection,flushCloud,saveStore};',context);
  return {cloud,calls,...context.api};
}
(async()=>{
  const q=setup();
  q.saveStore('employees',[1]); q.flushCloud();
  let done=false;
  const saved=q.persistCollection('attendance',[{id:'list-1'}]).then(()=>{done=true;});
  // Google can take longer than the former 15-second client deadline.
  await new Promise(resolve=>setTimeout(resolve,16000));
  assert.equal(done,false); assert.equal(q.calls.length,1);
  q.calls[0].resolve({revision:11}); await new Promise(setImmediate);
  assert.equal(q.calls.length,2); assert.equal(q.calls[1].revision,11);
  assert.equal(q.calls[1].batch.attendance[0].id,'list-1');
  q.saveStore('employees',[2]); q.calls[1].resolve({revision:12}); await new Promise(setImmediate);
  assert.equal(q.calls.length,3); assert.equal(q.calls[2].revision,12);
  q.calls[2].resolve({revision:13}); await saved;
  assert.equal(done,true); assert.equal(q.cloud.saving,false);
  const f=setup(); const failed=f.persistCollection('attendance',[{id:'keep-me'}]);
  f.calls[0].reject(new Error('Sin conexión'));
  await assert.rejects(failed,/Sin conexión/);
  assert.equal(f.cloud.pending.attendance[0].id,'keep-me');
  f.cloud.blocked=false; const retry=f.flushCloud();
  f.calls[1].resolve({revision:11}); await retry;
  assert.equal(Object.keys(f.cloud.pending).length,0);
  const c=setup(); const conflict=c.persistCollection('attendance',[{id:'conflict-draft'}]);
  c.calls[0].resolve({conflict:true,revision:20});
  await assert.rejects(conflict,/Otra ventana/);
  assert.equal(c.cloud.pending.attendance[0].id,'conflict-draft');
  assert.equal(c.cloud.revision,10);
  console.log('OK: guardado >15 s, cola sin solicitudes simultáneas, revisiones consecutivas, cambios durante el guardado, fallo y reintento, conflicto conserva borrador.');
})().catch(error=>{console.error(error);process.exitCode=1;});

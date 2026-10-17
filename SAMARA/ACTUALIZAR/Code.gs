const SHEETS = {
  empleados:['id','no','curp','nombres','apellidoPaterno','apellidoMaterno','estudios','docProbatorio','tipoInstitucion','puestoId','estado'],
  puestos:['id','nombre','departamento','sirce','estado'],
  cursos:['id','codigo','nombre','departamento','sede','duracion','instructores','clasificacionInstructor','modalidad','validezOficial','tipo','frecuencia','objetivo','noEC','revision','areaDC3','sirce','puestos','comisiones','estado'],
  instructores:['id','tipo','empleadoId','nombre','area','cursos','especialidad','certificacion','contacto','estado'],
  cmcap:['id','rol','empleadoId','nombre'],
  catalogos:['id','tipo','clave','valor']
};
function doGet(e){
  const page=e&&e.parameter&&e.parameter.page;
  const pagina=page==='listados-clasico'?'Listados':'Index';
  const t=HtmlService.createTemplateFromFile(pagina);
  t.appUrl=ScriptApp.getService().getUrl();
  t.initialView=page==='listados'?'attendance':'dashboard';
  return t.evaluate().setTitle(page==='listados'?'Listados de asistencia | SAMARA':'Entrenamiento | SAMARA').addMetaTag('viewport','width=device-width, initial-scale=1');
}
// Inserta el contenido de los demás archivos HTML (Estilos, JSZip, DatosIniciales, CatalogoSIRCE, PlantillaFT007, App).
function include(nombre){
  return HtmlService.createTemplateFromFile(nombre).getRawContent();
}
// Ejecuta esta función una vez desde el editor para dar permisos y crear la hoja de datos.
function instalar(){ const ss=database_(); Logger.log('Listo. Hoja de datos: '+ss.getUrl()); }
function getDb_(){const p=PropertiesService.getScriptProperties();let id=p.getProperty('DB_ID');if(id)return SpreadsheetApp.openById(id);let ss=SpreadsheetApp.create('SAMARA | Gestión de Capacitación — Datos');p.setProperty('DB_ID',ss.getId());setup_();return ss;}
function setup_(){const ss=SpreadsheetApp.getActiveSpreadsheet()||(()=>{const p=PropertiesService.getScriptProperties();const id=p.getProperty('DB_ID');return id?SpreadsheetApp.openById(id):null;})();if(!ss)return;Object.keys(SHEETS).forEach(k=>{let sh=ss.getSheetByName(k);if(!sh){sh=ss.insertSheet(k);sh.appendRow(SHEETS[k]);sh.setFrozenRows(1);sh.getRange(1,1,1,SHEETS[k].length).setFontWeight('bold').setBackground('#eaf2f2');}});}
function database_(){const p=PropertiesService.getScriptProperties();let id=p.getProperty('DB_ID');if(!id){const ss=SpreadsheetApp.create('SAMARA | Gestión de Capacitación — Datos');id=ss.getId();p.setProperty('DB_ID',id);}const ss=SpreadsheetApp.openById(id);Object.keys(SHEETS).forEach(k=>{let sh=ss.getSheetByName(k);if(!sh){sh=ss.insertSheet(k);sh.appendRow(SHEETS[k]);sh.setFrozenRows(1);sh.getRange(1,1,1,SHEETS[k].length).setFontWeight('bold').setBackground('#eaf2f2');}});return ss;}
function api_init(){const ss=database_();seed_(ss);return {data:readAll_(ss),url:ss.getUrl(),objectives:['Actualizar y perfeccionar conocimientos y habilidades, y proporcionar información de nuevas tecnologías.','Prevenir riesgos de trabajo.','Incrementar la productividad.','Mejorar el nivel educativo.','Preparar para ocupar vacantes o puestos de nueva creación.'],frequencies:['1era vez ingreso','1 vez anual'],cmcapRoles:['Coordinador','Representante de los trabajadores','Vocal','Secretario']};}
function seed_(ss){const sh=ss.getSheetByName('puestos');if(sh.getLastRow()===1){[['p1','Operador de producción I','Producción','','Activo'],['p2','Operador de producción II','Producción','','Activo']].forEach(r=>sh.appendRow(r));}const e=ss.getSheetByName('empleados');if(e.getLastRow()===1){[['e1','1','CURP DEMO 001','Ana','Prueba','Uno','Preparatoria','Constancia','Pública','p1','Activo'],['e2','2','CURP DEMO 002','Luis','Ejemplo','Dos','Secundaria','Certificado','Pública','p2','Activo'],['e3','3','CURP DEMO 003','Marta','Muestra','Tres','Licenciatura','Título','Privada','p1','Activo']].forEach(r=>e.appendRow(r));}const c=ss.getSheetByName('cmcap');if(c.getLastRow()===1){['Coordinador','Representante de los trabajadores','Vocal','Secretario'].forEach((r,i)=>c.appendRow(['c'+(i+1),r,'','']));}}
function readAll_(ss){const out={};Object.keys(SHEETS).forEach(k=>{const sh=ss.getSheetByName(k),v=sh.getDataRange().getValues(),h=v.shift();out[k]=v.filter(r=>r[0]).map(r=>{const o={};h.forEach((x,i)=>o[x]=r[i]);return o;});});return out;}
function api_save(entity,obj){if(!SHEETS[entity])throw Error('Sección desconocida');const ss=database_(),sh=ss.getSheetByName(entity),headers=SHEETS[entity];obj=obj||{};if(entity==='cursos'&&!obj.id){obj.id=Utilities.getUuid();obj.codigo=nextCourseCode_(ss,obj.sede,obj.departamento);}if(entity==='empleados'&&!obj.id){obj.id=Utilities.getUuid();obj.no=String(Math.max(0,sh.getLastRow()-1)+1);}if(!obj.id)obj.id=Utilities.getUuid();const rows=sh.getDataRange().getValues();let at=rows.findIndex((r,i)=>i>0&&String(r[0])===String(obj.id));const row=headers.map(h=>obj[h]===undefined?'':obj[h]);if(at<0)sh.appendRow(row);else sh.getRange(at+1,1,1,row.length).setValues([row]);return readAll_(ss)[entity];}
function nextCourseCode_(ss,sede,dep){let base=String(sede||'').toUpperCase();if(base!=='SAMARA'&&base!=='TACNA')base=String(dep||'GENERAL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9]/gi,'').toUpperCase()||'GENERAL';base='RH-'+base;const rows=ss.getSheetByName('cursos').getDataRange().getValues();let n=0;rows.slice(1).forEach(r=>{const m=String(r[1]||'').match(new RegExp('^'+base+'(\\d+)$'));if(m)n=Math.max(n,Number(m[1]));});return base+String(n+1).padStart(3,'0');}
function api_delete(entity,id){if(!SHEETS[entity])throw Error('Sección desconocida');const sh=database_().getSheetByName(entity),v=sh.getDataRange().getValues();for(let i=1;i<v.length;i++)if(String(v[i][0])===String(id)){sh.deleteRow(i+1);break;}return true;}
function api_importEmployees(rows){if(!Array.isArray(rows)||!rows.length)return 0;const ss=database_(),sh=ss.getSheetByName('empleados'),headers=SHEETS.empleados;let count=0;rows.slice(1).forEach(r=>{if(!r||!r.some(x=>String(x||'').trim()))return;const o={id:Utilities.getUuid(),no:String(sh.getLastRow()),curp:r[1]||'',nombres:r[2]||'',apellidoPaterno:r[3]||'',apellidoMaterno:r[4]||'',estudios:r[5]||'',docProbatorio:r[6]||'',tipoInstitucion:r[7]||'',puestoId:'',estado:'Activo'};sh.appendRow(headers.map(h=>o[h]||''));count++;});return count;}

// Store the advanced Site's collections in the existing DB. Legacy tabs remain intact.
const APP_KEYS_ = ['samara.matrixDepartments.v1','samara.courseDepartments.v1','samara.legalRepresentative.v1','samara.attendanceMigration.v1','samara.attendance.v1','samara.matrixPositions.v2','samara.positions.v2','samara.occupationCatalog.v1','samara.employees.v2','samara.demoEmployees.v1','samara.instructors.v1','samara.cmcap.v2','samara.courses.v2'];
function appSheet_(ss){
  let sheet=ss.getSheetByName('SAMARA_AppState');
  if(!sheet){sheet=ss.insertSheet('SAMARA_AppState');sheet.appendRow(['Colección','Parte','JSON']);sheet.setFrozenRows(1);sheet.getRange(1,1,1,3).setFontWeight('bold').setBackground('#eaf2f2');}
  return sheet;
}
function normalizePersonNames(key, value) {
  if (!Array.isArray(value)) return value;
  const fields = {'samara.employees.v2':['names','paternal','maternal'],'samara.instructors.v1':['employeeName','externalName'],'samara.cmcap.v2':['name'],'samara.legalRepresentative.v1':['name'],'samara.courses.v2':['instructor','owner']};
  if (!fields[key] && key !== 'samara.attendance.v1') return value;
  const upper = text => typeof text === 'string' ? text.toLocaleUpperCase('es-MX') : text;
  return value.map(record => {
    const item = {...record};
    (fields[key] || []).forEach(field => {if(typeof item[field] === 'string') item[field] = upper(item[field]);});
    if(key === 'samara.attendance.v1') {
      if(item.encabezado) item.encabezado = {...item.encabezado,instructor:upper(item.encabezado.instructor)};
      if(Array.isArray(item.asistentes)) item.asistentes = item.asistentes.map(person=>({...person,nombre:upper(person.nombre),name:upper(person.name)}));
    }
    return item;
  });
}
function appRead_(sheet){
  const fragments={},state={};let revision=0;
  sheet.getDataRange().getValues().slice(1).forEach(row=>{
    if(row[0]==='_revision'){revision=Number(row[2])||0;return;}
    if(!APP_KEYS_.includes(row[0]))return;
    if(!fragments[row[0]])fragments[row[0]]=[];
    const fragment=String(row[2]);fragments[row[0]][Number(row[1])]=fragment.startsWith('JSON:')?fragment.slice(5):fragment;
  });
  Object.keys(fragments).forEach(key=>{state[key]=normalizePersonNames(key,JSON.parse(fragments[key].join('')));});
  return {state:state,revision:revision};
}
function api_loadAppState(){
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{const ss=database_(),result=appRead_(appSheet_(ss));if(result.revision===0)result.legacy=readAll_(ss);return result;}
  finally{lock.releaseLock();}
}
function api_saveAppState(updates,expectedRevision){
  if(!updates||typeof updates!=='object'||Array.isArray(updates))throw Error('Cambios inválidos');
  const keys=Object.keys(updates);
  if(!keys.length||keys.some(key=>!APP_KEYS_.includes(key)))throw Error('Colección desconocida');
  keys.forEach(key=>{if(key==='samara.demoEmployees.v1'||key==='samara.attendanceMigration.v1'){if(typeof updates[key]!=='boolean')throw Error('Dato inválido');}else if(!Array.isArray(updates[key]))throw Error('Se esperaba una lista');});
  if(JSON.stringify(updates).length>10000000)throw Error('El lote es demasiado grande');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const sheet=appSheet_(database_()),current=appRead_(sheet);
    if(Number(expectedRevision)!==current.revision)return {conflict:true,revision:current.revision};
    const next=Object.assign({},current.state,updates),revision=current.revision+1;
    keys.forEach(key=>next[key]=normalizePersonNames(key,next[key]));
    const rows=[['Colección','Parte','JSON'],['_revision',0,String(revision)]];
    APP_KEYS_.forEach(key=>{if(!Object.prototype.hasOwnProperty.call(next,key))return;const json=JSON.stringify(next[key]);for(let start=0,part=0;start<json.length;start+=40000,part++)rows.push([key,part,'JSON:'+json.slice(start,start+40000)]);});
    const previousRows=sheet.getLastRow();
    if(rows.length>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),rows.length-sheet.getMaxRows());
    sheet.getRange(1,1,rows.length,3).setValues(rows);
    if(previousRows>rows.length)sheet.getRange(rows.length+1,1,previousRows-rows.length,3).clearContent();
    SpreadsheetApp.flush();return {revision:revision,conflict:false};
  }finally{lock.releaseLock();}
}


/* =====================================================================
   LISTADOS DE ASISTENCIA (FT-RH-010) Y DC-3
   ===================================================================== */
// Hoja SAMARA - SIRCE 2026: padrón (Trabajadores), Glosario y BD (CURP).
const SIRCE_ID='1x6nOx-C5woPo6dPbQt9tlz-EF-___jkNclnJeT-F1eo';
const LS_HEAD=['id','fecha','cursoCodigo','cursoNombre','sirce','instructor','estado','asistentes','actualizado','json'];
const AL_HEAD=['numero','nombre','puesto','depto','planta','curp','fecha'];

function lsTexto_(v){if(v instanceof Date)return Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd');return String(v==null?'':v).trim();}
function lsHoja_(nombre,encabezados){
  const ss=database_();let sh=ss.getSheetByName(nombre);
  if(!sh){sh=ss.insertSheet(nombre);sh.appendRow(encabezados);sh.setFrozenRows(1);sh.getRange(1,1,1,encabezados.length).setFontWeight('bold').setBackground('#eaf2f2');}
  return sh;
}
function lsLeer_(){
  const v=lsHoja_('Listados',LS_HEAD).getDataRange().getValues().slice(1);
  return v.filter(r=>r[0]).map(r=>{try{const o=JSON.parse(r[9]);o.id=String(r[0]);return o;}catch(e){return null;}}).filter(Boolean);
}
function alLeer_(){
  const v=lsHoja_('AltasColaboradores',AL_HEAD).getDataRange().getValues().slice(1);
  return v.filter(r=>r[0]!=='').map(r=>{const o={};AL_HEAD.forEach((h,i)=>o[h]=lsTexto_(r[i]));return o;});
}
function listados_cargar(){
  const s=SpreadsheetApp.openById(SIRCE_ID);
  const rango=(hoja,a1)=>{const sh=s.getSheetByName(hoja);return sh?sh.getRange(a1).getValues().map(r=>r.map(lsTexto_)):[];};
  let ins=[];
  try{
    const st=appRead_(appSheet_(database_())).state;
    ins=(st['samara.instructors.v1']||[]).map(i=>({
      id:i.id,
      nombre:i.type==='Interno'?(i.employeeName||''):(i.externalName||''),
      tipo:i.type||'',
      rfc:i.rfc||'',
      registro:i.stpsRegistration||'',
      cursos:(i.authorizedCourses||[]).map(c=>c.courseCode).filter(c=>c&&c!=='__other__'),
      cursosNombres:(i.authorizedCourses||[]).map(c=>c.name).filter(Boolean)
    })).filter(i=>i.nombre);
  }catch(e){}
  return {tr:rango('Trabajadores','A8:H1009'),gl:rango('Glosario','A6:O200'),bd:rango('BD','A2:K1000'),ins:ins,listados:lsLeer_(),altas:alLeer_()};
}
function listados_guardar(doc){
  if(!doc||typeof doc!=='object')throw Error('Listado inválido');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const sh=lsHoja_('Listados',LS_HEAD);
    const id=doc.id||Utilities.getUuid();delete doc.id;
    const fila=[id,doc.fecha||'',doc.cursoCodigo||'',doc.cursoNombre||'',doc.sirce?'Sí':'No',(doc.encabezado&&doc.encabezado.instructor)||'',doc.estado||'',(doc.asistentes||[]).length,new Date(),JSON.stringify(doc)];
    const v=sh.getDataRange().getValues();
    const at=v.findIndex((r,i)=>i>0&&String(r[0])===String(id));
    const rango=at>0?sh.getRange(at+1,1,1,fila.length):sh.getRange(sh.getLastRow()+1,1,1,fila.length);
    rango.setNumberFormat('@');rango.offset(0,8,1,1).setNumberFormat('yyyy-mm-dd hh:mm');rango.setValues([fila]);
    SpreadsheetApp.flush();
  }finally{lock.releaseLock();}
  return lsLeer_();
}
function listados_eliminar(id){
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{const sh=lsHoja_('Listados',LS_HEAD),v=sh.getDataRange().getValues();for(let i=v.length-1;i>0;i--)if(String(v[i][0])===String(id))sh.deleteRow(i+1);}
  finally{lock.releaseLock();}
  return lsLeer_();
}
function listados_alta(o){
  if(!o||!/^\d{3,}$/.test(String(o.numero||'')))throw Error('Número de empleado inválido');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    if(alLeer_().some(a=>a.numero===String(o.numero)))throw Error('Ese número ya fue dado de alta');
    const sh=lsHoja_('AltasColaboradores',AL_HEAD),r=sh.getRange(sh.getLastRow()+1,1,1,AL_HEAD.length);
    r.setNumberFormat('@');r.setValues([[String(o.numero),o.nombre||'',o.puesto||'',o.depto||'',o.planta||'',o.curp||'',lsTexto_(new Date())]]);
  }finally{lock.releaseLock();}
  return alLeer_();
}
// Lee la foto de la lista con Gemini. La foto no se guarda en ningún lado.
function listados_leerFoto(base64,mime,instrucciones){
  const props=PropertiesService.getScriptProperties();
  const clave=props.getProperty('GEMINI_API_KEY');
  if(!clave)throw Error('Falta GEMINI_API_KEY en Propiedades del script');
  const modelo=props.getProperty('GEMINI_MODEL')||'gemini-flash-latest';
  const r=UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(modelo)+':generateContent',{
    method:'post',contentType:'application/json',muteHttpExceptions:true,headers:{'x-goog-api-key':clave},
    payload:JSON.stringify({contents:[{role:'user',parts:[{text:instrucciones},{inline_data:{mime_type:mime||'image/jpeg',data:base64}}]}],generationConfig:{temperature:0,responseMimeType:'application/json'}})
  });
  const code=r.getResponseCode(),body=r.getContentText();
  if(code!==200){let m=body;try{m=JSON.parse(body).error.message;}catch(e){}throw Error('Gemini respondió '+code+': '+m);}
  const data=JSON.parse(body);
  const txt=(((data.candidates||[])[0]||{}).content||{}).parts?data.candidates[0].content.parts.map(p=>p.text||'').join(''):'';
  if(!txt)throw Error('Gemini no devolvió datos');
  return JSON.parse(txt.replace(/```json|```/g,'').trim());
}


// Compatibilidad con el módulo de asistencia integrado.
// Las funciones listados_* y sus hojas originales se conservan.
function api_leerHojaSIRCE(rango){
  const partes=String(rango||'').split('!');
  if(partes.length!==2)throw Error('Rango inválido');
  const id=PropertiesService.getScriptProperties().getProperty('SIRCE_ID')||SIRCE_ID;
  const hoja=SpreadsheetApp.openById(id).getSheetByName(partes[0]);
  if(!hoja)throw Error('No existe la pestaña '+partes[0]+' en la hoja SIRCE');
  return hoja.getRange(partes[1]).getValues().map(fila=>fila.map(lsTexto_));
}
function api_leerListaFT(base64,mime,instrucciones){
  return listados_leerFoto(base64,mime,instrucciones);
}


// Firmas de DC-3 resueltas por la fecha del documento, desde la página Listados.
function api_cmcapFirmantes(fecha){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha||'')))throw Error('Selecciona una fecha válida para el documento.');
  const parsed=new Date(fecha+'T12:00:00Z');
  if(isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==fecha)throw Error('Fecha del documento inválida.');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const state=appRead_(appSheet_(database_())).state;
    const rows=state['samara.cmcap.v2']||[];
    const representatives=state['samara.legalRepresentative.v1'];
    const legal=representatives===undefined?'Mirna Ulbrich Labastida':String(representatives[0]&&representatives[0].name||'').trim();
    if(!legal)throw Error('Completa el representante legal en CMCAP.');
    const role=value=>value==='Coordinador'?'Coordinador de CMCAP':value;
    const find=puesto=>{
      const matches=rows.filter(m=>role(m.role)===puesto&&m.name&&/^\d{4}-\d{2}-\d{2}$/.test(m.startDate||'')&&/^\d{4}-\d{2}-\d{2}$/.test(m.endDate||'')&&m.startDate<=fecha&&fecha<=m.endDate);
      if(matches.length!==1)throw Error(matches.length?'Hay vigencias superpuestas para '+puesto+'.':'No hay integrante vigente como '+puesto+' el '+fecha+'. Revisa la CMCAP.');
      return matches[0].name;
    };
    return {legal:legal.toLocaleUpperCase('es-MX'),trab:find('Representante de los trabajadores')};
  }finally{lock.releaseLock();}
}


// Lectura del histórico para incorporarlo una vez al módulo integrado.
// No modifica ni elimina la hoja Listados original.
function api_listadosHistoricos(){
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{return lsLeer_();}finally{lock.releaseLock();}
}

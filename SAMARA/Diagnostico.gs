/** Ejecutar desde el editor. Comprueba el arranque sin guardar ni borrar registros. */
function diagnosticarSAMARA(){
  const informe=[];
  const fuentes={};
  const registrar=texto=>{informe.push(texto);console.log(texto);};
  const cargar=nombre=>{
    if(Object.prototype.hasOwnProperty.call(fuentes,nombre))return fuentes[nombre];
    try{
      const texto=HtmlService.createHtmlOutputFromFile(nombre).getContent();
      fuentes[nombre]=texto;
      registrar('OK archivo '+nombre+' ('+texto.length+' caracteres)');
      return texto;
    }catch(error){
      registrar('ERROR: falta o no se puede leer el archivo HTML '+nombre+'.');
      fuentes[nombre]=null;
      return null;
    }
  };
  registrar('DIAGNÓSTICO SAMARA — solo comprobación');
  const index=cargar('Index');
  if(index){
    const includes=/include\(['"]([^'"]+)['"]\)/g;
    let coincidencia;
    while((coincidencia=includes.exec(index)))cargar(coincidencia[1]);
  }
  cargar('App');
  Object.keys(fuentes).forEach(nombre=>{
    const texto=fuentes[nombre];
    if(!texto)return;
    const bloques=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let bloque,numero=0;
    while((bloque=bloques.exec(texto))){
      numero++;
      if(/\bsrc\s*=/.test(bloque[1]))continue;
      const inicio=texto.slice(0,bloque.index).split('\n').length;
      try{
        new Function(bloque[2]);
        registrar('OK sintaxis '+nombre+', bloque '+numero+' (desde línea '+inicio+').');
      }catch(error){
        registrar('ERROR SINTAXIS en '+nombre+', bloque '+numero+' (desde línea '+inicio+'): '+String(error.message));
      }
    }
    const aperturas=(texto.match(/<script\b/gi)||[]).length;
    const cierres=(texto.match(/<\/script>/gi)||[]).length;
    if(aperturas!==cierres)registrar('ERROR en '+nombre+': etiquetas script sin cerrar ('+aperturas+' aperturas, '+cierres+' cierres).');
  });
  if(fuentes.App){
    if(!fuentes.App.trim().endsWith('</script>'))registrar('ERROR: App no termina con </script>.');
    registrar('Módulo integrado de asistencia: '+(fuentes.App.includes('function renderAttendance(')?'presente':'NO ENCONTRADO'));
  }
  const id=PropertiesService.getScriptProperties().getProperty('DB_ID');
  if(!id){
    registrar('ERROR: no está configurada DB_ID. No se creó una hoja nueva.');
    return informe.join('\n');
  }
  let ss;
  try{
    ss=SpreadsheetApp.openById(id);
    registrar('OK acceso de esta cuenta a la base de datos.');
  }catch(error){
    registrar('ERROR: esta cuenta no puede abrir la hoja indicada por DB_ID.');
    return informe.join('\n');
  }
  const requeridas=['empleados','puestos','cursos','instructores','cmcap','catalogos','SAMARA_AppState'];
  const faltantes=requeridas.filter(nombre=>!ss.getSheetByName(nombre));
  if(faltantes.length){
    registrar('ERROR: faltan pestañas: '+faltantes.join(', ')+'. No se crearon ni modificaron pestañas.');
    return informe.join('\n');
  }
  try{
    if(typeof appRead_!=='function')throw Error('Falta la función appRead_.');
    const lock=LockService.getScriptLock();lock.waitLock(30000);
    let resultado;
    try{
      resultado=appRead_(ss.getSheetByName('SAMARA_AppState'));
      if(resultado.revision===0)resultado.legacy=readAll_(ss);
    }finally{lock.releaseLock();}
    const contieneFecha=valor=>{
      if(Object.prototype.toString.call(valor)==='[object Date]')return true;
      if(Array.isArray(valor))return valor.some(contieneFecha);
      if(valor&&typeof valor==='object')return Object.keys(valor).some(clave=>contieneFecha(valor[clave]));
      return false;
    };
    registrar('OK lectura del estado inicial; revisión '+resultado.revision+'.');
    if(contieneFecha(resultado))registrar('ERROR: la respuesta inicial contiene Date, un tipo no admitido por google.script.run.');
    else registrar('OK respuesta inicial sin objetos Date.');
  }catch(error){
    registrar('ERROR al leer el estado inicial: '+String(error.message));
  }
  registrar('FIN. Este informe no comprueba la versión publicada ni el JavaScript del navegador.');
  return informe.join('\n');
}

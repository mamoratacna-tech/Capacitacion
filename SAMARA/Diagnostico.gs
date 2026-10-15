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
  const app=cargar('App');
  if(app){
    if(!app.trim().endsWith('</script>'))registrar('ERROR: App no termina con </script>.');
    const bloque=app.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
    if(!bloque){
      registrar('ERROR: no se encontró un bloque script completo en App.');
    }else{
      try{
        new Function(bloque[1]);
        registrar('OK sintaxis de App; el código se compiló sin ejecutarlo.');
      }catch(error){
        registrar('ERROR sintaxis de App: '+String(error.message));
      }
    }
    registrar('Módulo integrado de asistencia: '+(app.includes('function renderAttendance(')?'presente':'NO ENCONTRADO'));
  }
  if(fuentes.Cmcap){
    const bloque=fuentes.Cmcap.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
    try{
      if(!bloque)throw Error('Falta bloque script completo.');
      new Function(bloque[1]);
      registrar('OK sintaxis de Cmcap.');
    }catch(error){registrar('ERROR sintaxis de Cmcap: '+String(error.message));}
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

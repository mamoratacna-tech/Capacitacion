/** Localiza errores sin ejecutar App ni modificar hojas o propiedades. */
function localizarErrorApp(){
  console.log('LOCALIZADOR SAMARA v1 — línea y columna exactas');
  const url='https://cdn.jsdelivr.net/npm/acorn@8.15.0/dist/acorn.js';
  const esperado='fdb08546776ec6228b03e8d02b40d4ab3255bae5f401adba7ff5dad927ac5c9c';
  const respuesta=UrlFetchApp.fetch(url);
  const codigoParser=respuesta.getContentText('UTF-8');
  const digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,codigoParser,Utilities.Charset.UTF_8);
  const hash=digest.map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
  if(hash!==esperado)throw Error('No coincide la integridad del analizador. Se detuvo la comprobación.');
  const parser=new Function('var exports={};var module={exports:exports};\n'+codigoParser+'\nreturn module.exports;')();
  const revisar=(etiqueta,html)=>{
    const expresion=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let bloque,numero=0,errores=0;
    while((bloque=expresion.exec(html))){
      numero++;
      if(/\bsrc\s*=/i.test(bloque[1]))continue;
      const tipo=bloque[1].match(/\btype\s*=\s*["']([^"']+)["']/i);
      if(tipo&&!/javascript|ecmascript|module/i.test(tipo[1]))continue;
      try{
        parser.parse(bloque[2],{ecmaVersion:'latest',sourceType:tipo&&tipo[1]==='module'?'module':'script'});
      }catch(error){
        errores++;
        const linea=error.loc?error.loc.line:0;
        const columna=error.loc?error.loc.column:0;
        const desplazamiento=html.slice(0,bloque.index+bloque[0].indexOf('>')+1).split('\n').length-1;
        console.log('ERROR '+etiqueta+' — bloque '+numero+', línea JavaScript '+linea+', columna '+columna+', línea HTML aproximada '+(desplazamiento+linea)+': '+error.message);
        // Solo muestra fuente de App; no vuelca registros, catálogos ni claves.
        if(etiqueta.indexOf('App')>=0||bloque[2].indexOf('api_loadAppState')>=0){
          const lineas=bloque[2].split('\n');
          for(let i=Math.max(0,linea-3);i<Math.min(lineas.length,linea+2);i++){
            console.log('FUENTE '+(i+1)+': '+lineas[i].slice(0,240));
          }
        }
      }
    }
    console.log(etiqueta+': '+errores+' errores; '+html.length+' caracteres.');
    return errores;
  };
  const original=HtmlService.createTemplateFromFile('App').getRawContent();
  const procesado=HtmlService.createHtmlOutputFromFile('App').getContent();
  const erroresOriginal=revisar('App ORIGINAL',original);
  revisar('App lectura PROCESADA',procesado);
  if(original!==procesado){
    let pos=0;
    while(pos<Math.min(original.length,procesado.length)&&original[pos]===procesado[pos])pos++;
    console.log('Primera diferencia entre lecturas: carácter '+pos+', cerca de línea '+original.slice(0,pos).split('\n').length+'.');
  }
  let erroresPagina;
  try{
    const pagina=doGet({parameter:{}}).getContent();
    erroresPagina=revisar('PÁGINA GENERADA ACTUAL',pagina);
  }catch(error){console.log('ERROR al generar la página desde el código actual: '+error.message);}
  if(erroresOriginal===0&&erroresPagina===0){
    console.log('La fuente de App y la página generada actual no tienen errores de sintaxis. Si la URL publicada aún los muestra, hay que comprobar la versión de la implementación.');
  }
  console.log('FIN LOCALIZADOR. No se modificaron datos.');
}

/* Requires pinned assets downloaded to SAMARA_OCR_ASSETS (default /tmp/samara-ocr-assets).
   Exercises real pdf.js and Tesseract workers; external assets are served from this cache. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {PDFDocument,StandardFonts}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pdf-lib/dist/pdf-lib.min.js');
const assets=process.env.SAMARA_OCR_ASSETS||'/tmp/samara-ocr-assets';
const root=path.join(__dirname,'../SAMARA/ACTUALIZAR');
const include=name=>fs.readFileSync(path.join(root,name+'.html'),'utf8');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage(),requests=[],errors=[];let failLanguageOnce=true;page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{const req=route.request(),url=req.url();if(url==='https://pdf.test/')return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html><head><meta charset="utf-8">'+include('EstilosListados')+'</head><body>'+include('LecturaPDF')+'</body></html>'});requests.push({url,method:req.method(),body:req.postData()});let file;
 if(url.includes('/pdf.js/3.11.174/'))file=path.join(assets,path.basename(new URL(url).pathname));
 else if(url.includes('/tesseract.js@6.0.1/'))file=path.join(assets,'tesseract.js',url.split('/tesseract.js@6.0.1/')[1]);
 else if(url.includes('/tesseract.js-core@6.0.0/'))file=path.join(assets,'tesseract.js-core',url.split('/tesseract.js-core@6.0.0/')[1]);
 else if(url.includes('/@tesseract.js-data/spa@1.0.0/4.0.0_best_int/')){if(failLanguageOnce){failLanguageOnce=false;return route.fulfill({status:503,body:'Temporarily unavailable'});}file=path.join(assets,'spa.traineddata.gz');}
 if(!file||!fs.existsSync(file)){console.error('Unexpected request',url);return route.abort();}
 return route.fulfill({contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.wasm')?'application/wasm':'application/octet-stream',body:fs.readFileSync(file)});
 });
 await page.goto('https://pdf.test/');
 const lines=['CURSO: RH-001 INDUCCION RECURSOS HUMANOS','Fecha de ejecucion: 22/10/2026','Duracion en horas: 2','Instructor: LUIS PEREZ','(X) Planta 1','No empleado Nombre completo Puesto Firma','67092 ANA MARIA LOPEZ RUIZ OPERADOR','64364 LUIS PEREZ SUPERVISOR'];
 const ctx={courses:[{code:'RH-001',name:'Inducción Recursos Humanos'}],employees:[{no:'67092',names:'ANA MARIA',paternal:'LOPEZ',maternal:'RUIZ',position:'OPERADOR'},{no:'64364',names:'LUIS',paternal:'PEREZ',position:'SUPERVISOR'}],instructors:[{name:'LUIS PEREZ'}]};
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),p=doc.addPage([700,900]);lines.forEach((text,i)=>p.drawText(text,{x:30,y:850-i*45,size:17,font}));const native=Array.from(await doc.save());
 const result=await page.evaluate(async({bytes,ctx})=>{const source=await SamaraPdfReader.open(new File([new Uint8Array(bytes)],'texto.pdf',{type:'application/pdf'}));const result=await SamaraPdfReader.read(source,1,ctx);await source.document.destroy();return result;},{bytes:native,ctx});
 assert.equal(result.metodo,'text');assert.equal(result.fecha,'2026-10-22');assert.equal(result.codigoSugerido,'RH-001');assert.deepEqual(result.asistentes.map(a=>a.numero),['67092','64364']);assert.equal(requests.filter(r=>r.url.includes('tesseract')).length,0);
 const png=await page.evaluate(lines=>{const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=2000;const c=canvas.getContext('2d');c.fillStyle='white';c.fillRect(0,0,1600,2000);c.fillStyle='black';c.font='32px Arial';lines.forEach((line,i)=>c.fillText(line,60,120+i*115));return canvas.toDataURL('image/png').split(',')[1];},lines);
 const scanned=await PDFDocument.create(),image=await scanned.embedPng(Buffer.from(png,'base64'));scanned.addPage([800,1000]).drawImage(image,{x:0,y:0,width:800,height:1000});const bytes=Array.from(await scanned.save());
 const firstError=await page.evaluate(async({bytes,ctx})=>{window.testSource=await SamaraPdfReader.open(new File([new Uint8Array(bytes)],'escaneado.pdf',{type:'application/pdf'}));try{await SamaraPdfReader.read(window.testSource,1,ctx);return '';}catch(error){return error.message;}},{bytes,ctx});
 assert.match(firstError,/No se pudo descargar el idioma/);
 const ocr=await page.evaluate(async ctx=>{const result=await SamaraPdfReader.read(window.testSource,1,ctx);await window.testSource.document.destroy();await SamaraPdfReader.close();return result;},ctx);
 assert.equal(ocr.metodo,'ocr');assert.equal(ocr.codigoSugerido,'RH-001');assert.equal(ocr.fecha,'2026-10-22');assert.deepEqual(ocr.asistentes.map(a=>a.numero),['67092','64364']);assert.ok(ocr.asistentes.every(a=>a.firmo===false));assert.match(ocr.advertencias.join(' '),/manuscrita/);
 assert.ok(requests.some(r=>r.url.endsWith('spa.traineddata.gz')));assert.ok(requests.every(r=>r.method==='GET'&&!r.body));assert.ok(!requests.some(r=>/generativelanguage|googleapis.com\/v1|gemini/i.test(r.url)));assert.deepEqual(errors,[]);
 console.log('OK: PDF nativo real sin OCR; PDF escaneado real leído por Tesseract en español, firmas sin confirmar, recuperación tras descarga fallida; solo descarga de herramientas, sin envío del documento.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

# SAMARA · Capacitación con Google Sheets

Aplicación para gestionar cursos, personal, instructores, CMCAP, asistencia y reportes.
Esta entrega conserva las funciones de los últimos archivos recibidos y restaura
el módulo integrado de asistencia junto con las mejoras de CMCAP.

## Descargar los archivos

1. Abre [SAMARA_ARCHIVOS_COMPLETOS.zip](descargas/SAMARA_ARCHIVOS_COMPLETOS.zip).
2. Pulsa **Download raw file** (icono de descarga) o **View raw**.
3. Descomprime el ZIP y abre **SAMARA/LEEME_PRIMERO.txt**.

También puedes pulsar el botón verde **Code → Download ZIP** para descargar
el repositorio entero.

Última actualización: [Formato del programa, asistencia y pendientes](descargas/SAMARA_PROGRAMA_FORMATO_ASISTENCIA.zip).
Impresión FT-RH-012 con el diseño adjunto y población de puestos activos; CSV de personas pendientes; captura con foto o manual; sugerencias solo de instructores autorizados y planta obligatoria con aviso rojo. Las evidencias se editan desde el glosario. [Guía de actualización](SAMARA/PROGRAMA_FORMATO_ASISTENCIA.txt).

[Ver diseño](descargas/PROGRAMA_MENSUAL.png) · [Ejemplo FT-RH-012](descargas/MUESTRA_FT-RH-012.pdf).

## Ver el código

Los archivos completos están en [SAMARA/ACTUALIZAR](SAMARA/ACTUALIZAR).
Haz clic en un nombre de archivo para abrirlo y revisar su contenido en GitHub.

## Actualizar tu proyecto de Google Apps Script

Abre tu proyecto existente en https://script.google.com. Sustituye el contenido
de los archivos con los de **ACTUALIZAR**. Crea los HTML faltantes con su nombre
sin la extensión `.html`.

Conserva tus **DatosIniciales**, **CatalogoSIRCE**, hojas de Google y propiedades
**DB_ID**, **SIRCE_ID** y claves existentes. **SOLO_SI_NO_EXISTEN** contiene bases
vacías para los dos archivos que no se recibieron completos; no sustituye tus
catálogos reales. El manifiesto de **CONFIGURACION** es una referencia.

Después de guardar: **Implementar → Gestionar implementaciones → Editar →
Nueva versión → Implementar**. Abre de nuevo la aplicación.

## Estado de verificación

Se probaron localmente CMCAP, recuperación del histórico sin duplicados,
filtros, captura manual, guardado y recarga con Google simulado, generación del
PDF de asistencia y cola de dos imágenes con lectura simulada. La conexión
real con Google Sheets y Gemini debe comprobarse en la cuenta propietaria.
Los indicadores estáticos del resumen conservan datos de demostración.

# Comparación de los archivos de SAMARA

Esta comparación utiliza las últimas versiones de Code.gs, App.html y
Listados.html enviadas por la usuaria, y los otros archivos originales recibidos.
Los números de líneas pueden variar por espacios y saltos de línea: algunos
bloques del chat se mostraron expandidos y los archivos conservan líneas largas.

| Archivo | Líneas recibidas | Líneas publicadas | Resultado |
| --- | ---: | ---: | --- |
| Code.gs | 162 | 206 | 26 funciones originales conservadas: 24 sin cambios en su estructura de código y 2 actualizadas; 4 funciones nuevas |
| App.html | 385 | 4155 | 87 funciones originales conservadas: 80 sin cambios en su estructura de código y 7 actualizadas; 46 funciones nuevas |
| Listados.html | 416 | 417 | 45 funciones originales conservadas: 44 sin cambios en su estructura de código y 1 actualizada |
| Index.html | 84 | 90 | Incluye el menú y contenedores del módulo integrado y el formulario de CMCAP |
| Estilos.html | 469 | 493 | Añade el diseño del formulario y los estados de CMCAP |
| PlantillaFT007.html | 4 | 4 | Contenido idéntico al original recibido: imagen incrustada, aproximadamente 330 KB |
| PlantillasListados.html | 67 | 67 | Contenido idéntico al original recibido: plantillas incrustadas, aproximadamente 506 KB |

La comparación de funciones utiliza análisis de la estructura de JavaScript,
ignorando posiciones, comentarios y formato. Confirma lo descrito en la tabla;
no sustituye probar la aplicación en la cuenta propietaria de Google.

## Archivos que requieren conservar la versión real del proyecto

**DatosIniciales.html y CatalogoSIRCE.html no se recibieron completos.**
Los archivos incluidos en SOLO_SI_NO_EXISTEN son bases vacías expresamente
separadas de ACTUALIZAR. No representan los catálogos reales ni deben sustituir
las versiones completas de un proyecto existente.

JSZip.html incorpora bibliotecas auxiliares. No se recibió la versión actual
completa de ese archivo para compararla con el proyecto de Google.

Para comparar cualquier otro archivo con la versión de Google hace falta
recibir esa versión. No debe inferirse equivalencia únicamente por el nombre
del archivo, ni pérdida de funciones únicamente por el número de líneas.

## Corrección posterior de arranque

El diagnóstico ejecutado en Google detectó errores de sintaxis en JSZip y App.
JSZip se reemplazó por un cargador pequeño con versiones e integridad SRI;
App se formateó en líneas legibles. Se comprobó que la estructura de JavaScript
antes y después del formato es idéntica, ignorando comentarios y posiciones.
Los nuevos tamaños no indican eliminación de funciones: las bibliotecas se
cargan desde sus URLs en vez de estar incrustadas en el archivo HTML.

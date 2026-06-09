# Auditoría de fuentes

Primera, segunda y tercera pasada el 2026-06-09. **Validación real de acceso** completada el mismo día sobre los 5 datasets clave. Este documento queda como referencia viva; se actualiza si aparecen fuentes nuevas o si las existentes cambian de licencia, formato o acceso.

## Validación real (2026-06-09) — datasets clave del MVP

| Dataset | URL de descarga | Formatos reales | Licencia | Última actualización | Frecuencia |
|---|---|---|---|---|---|
| **Euskadi — Fosas** | `opendata.euskadi.eus/.../fosas_euskadi/opendata/fosas.{csv,xml,xls}` | CSV (10KB), XML (12KB), XLS (40KB) | **CC BY 4.0** | 04/11/2012 ⚠️ frío | No declarada |
| **Euskadi — Víctimas mortales (Gogora)** | `opendata.euskadi.eus/.../victimas_guerra_civil/opendata/victimas_guerra_civil.{json,xml,jsonp,xlsx}` | JSON (13.89MB), XML (16.58MB), JSON-P (13.89MB), XLSX (3.72MB) | **CC BY 4.0** | 17/05/2026 | **Semanal** ✅ |
| **Andalucía — Fosas** | `juntadeandalucia.es/datosabiertos` (CSV/JSON/XLSX/HTML) | CSV, JSON, XLSX, HTML interactivo | Licencia legal Junta de Andalucía (compatible, revisar texto) | 24/03/2025 | No declarada |
| **Valencia — Fosas (Generalitat)** | `geomemdemocratica.gva.es/` + endpoints WFS/WMS | CSV vía WFS, GeoPackage, Shapefile, WFS, WMS, geoportal | **CC BY** | 23/03/2026 | No declarada |
| **Catalunya — ANC Llista reparació jurídica** | `anc.gencat.cat/.../La-llista-de-reparacio-juridica-de-victimes-del-franquisme-en-dades-obertes` (URL directa de descarga pendiente) | Open data reutilizable (formato exacto por confirmar) | Open data (Ley 11/2017) | 14/01/2026 | Continua |

**Veredicto de la validación:**
- ✅ Los 5 datasets son **reales y descargables**.
- ✅ Todas las licencias son **CC BY o equivalente** — ninguna con share-alike. El conjunto del índice puede publicarse bajo CC BY sin contaminación.
- ✅ La mayoría están **frescos** (4 de 5 con actualización 2025-2026). Solo Euskadi-Fosas es de 2012 — mitigable porque el dataset de víctimas de Euskadi sí es semanal.
- ✅ Valencia aporta capas GIS (WFS/WMS/Shapefile/GeoPackage) — pieza valiosa para el componente geoespacial del Mapa de Fosas.
- ✅ Catalunya (ANC) aporta los **69.769 registros más voluminosos** entre los confirmados como abiertos.
- ⚠️ La URL directa de descarga del ANC necesita una visita manual a la página del anuncio para extraerla.

**Campos confirmados en el ANC** (los más completos para diseño del schema): apellidos, nombres, sexo, tipo de procedimiento, número de caso, fechas, sentencias, conmutaciones, indultos, ejecutados, referencias archivísticas, edad, lugar de nacimiento, lugar de residencia, fecha de registro, fecha de corrección.

**Campos confirmados en Andalucía**: nombre, carácter, provincia, municipio, fecha, titularidad, fotografías, descripción de ubicación, número de víctimas, relato histórico, promotor, descripción de la acción.

## Resumen ejecutivo

- **Corrección importante respecto a la primera pasada:** la entrada de datos.gob.es **"Base de datos: Víctimas durante la Guerra Civil y el franquismo (1936-1975)"** **no es un dataset descargable**. Es una ficha de "aplicación" que enlaza al sitio fuente — `scwd.ihr.world`. Los ~230.000 registros existen pero no son datos abiertos: se consultan vía el buscador de IHR. Para indexarlos hay que **negociar cesión directa con IHR**.
- **El Censo Estatal de Víctimas (Cenomi)** del Ministerio + USC tiene **510.857 registros** almacenados en la herramienta Dédalo. Apertura pública prevista para el **primer semestre de 2026** (estamos en junio). Aún no descargable a fecha de auditoría. **Vigilar fechas.**
- **Lo realmente descargable y abierto hoy** son los **datasets autonómicos de fosas** en `datos.gob.es`: Euskadi (CSV/XML/XLS confirmado), Andalucía, Comunitat Valenciana. Estos son la pieza concreta sobre la que arrancar el MVP.
- **Todos los Nombres** y **memoriahistorica.dival.es** (Diputació de València) son los proyectos no estatales más sólidos. TLN usa **CC BY-NC-SA** — compatible con proyecto sin ánimo de lucro pero impone share-alike.
- **PARES, patrimoniocultural.defensa.gob.es, ARMH**: sin API pública. Para el MVP encajan en el patrón **c1** (redirección con URL pre-rellenada). La URL de búsqueda del Portal Víctimas de PARES es `pares.cultura.gob.es/victimasGCFPortal/buscadorSencilloFilter.form`; los parámetros exactos requieren inspección manual con navegador (acción pendiente para Nacho).

## Tabla comparativa

| Fuente | URL | Acceso real | Licencia | Formato | Nº registros | Estado para MVP |
|---|---|---|---|---|---|---|
| **Fosas Euskadi (Gogora)** | [datos.gob.es](https://datos.gob.es/es/catalogo/a16003011-localizacion-de-la-fosas-comunes-de-la-guerra-civil-y-del-franquismo-en-euskadi1) | **Descarga directa** | Datos abiertos | **CSV, XML, XLS** | Por confirmar tras descarga | **Prioridad 1**. Listo para indexar. |
| **Fosas Andalucía** | [datos.gob.es](https://datos.gob.es/en/catalogo/a01002820-fosas-comunes-de-la-guerra-civil) | **Descarga directa** | Datos abiertos | Por confirmar | Por confirmar | **Prioridad 1**. Listo para indexar. |
| **Fosas Comunitat Valenciana** | [datos.gob.es](https://datos.gob.es/en/catalogo/a10002983-mapa-de-la-localizacion-en-la-comunitat-valenciana-de-las-fosas-de-la-represion-en-retaguardia-republicana-represion-franquista-durante-la-dictadura-combatientes-en-la-guerra-civil-y-victimas-de-bombardeos) | **Descarga directa** | Datos abiertos | Por confirmar | Por confirmar | **Prioridad 1**. Listo para indexar. |
| **Víctimas mortales Guerra Civil Euskadi** | [datos.gob.es](https://datos.gob.es/es/catalogo/a16003011-victimas-mortales-de-la-guerra-civil-en-euskadi) | **Descarga directa** | Datos abiertos | Por confirmar | Por confirmar | **Prioridad 1**. Pieza personal, no geoespacial. |
| **Mapa de Fosas estatal + mapa RTVE** | [mptmd.gob.es](https://mptmd.gob.es/portal/memoria-democratica/mapa-de-fosas) | Buscador web. Versiones autonómicas como descarga (ver arriba) | Datos abiertos | HTML / variable | ~6.000 fosas | **Prioridad 1**. Combinar con datasets autonómicos. |
| **SCWD / IHR** | [scwd.ihr.world](https://scwd.ihr.world/es/) | Buscador web. Sin descarga formal. Aparece como "aplicación" en datos.gob.es **no descargable** | No declarada | HTML | ~230.000 docs de 109 fuentes (incluye AGMG, ANC, archivos militares) | **c1** (redirección) + acción: contactar IHR para cesión. |
| **Censo Estatal Cenomi** | [mptmd.gob.es](https://mptmd.gob.es/portal/memoria-democratica/registro-y-censo-estatal-de-victimas) | Solo consulta online cuando se abra | Por confirmar | Por confirmar | 510.857 (con duplicados) | **Vigilar apertura 1S 2026.** Verificar manualmente hoy. |
| **Portal Víctimas PARES** | [pares.cultura.gob.es/victimasGCFPortal](https://pares.cultura.gob.es/victimasGCFPortal/buscadorSencilloFilter.form) | Buscador web. Sin API. Acceso libre sin registro. | Catálogo público | HTML | Por confirmar | **c1**: redirección. **Pendiente Nacho:** inspeccionar parámetros GET en URL real al hacer una búsqueda. |
| **patrimoniocultural.defensa.gob.es** | [enlace](https://patrimoniocultural.defensa.gob.es) | Buscador web. Sin API documentada. Reproducción presencial. | Catálogo público | HTML | Cientos de miles (AGMG, AGMS, AGMAV) | **c1**: redirección. Contacto: patrimonio.cultural@oc.mde.es / +34 91 780 86 08 |
| **Todos los Nombres** | [todoslosnombres.org](https://www.todoslosnombres.org) | Buscador web. Sin API. | **CC BY-NC-SA** | HTML | 120.491 víctimas + 1.144 microbiografías | Contactar CGT.A / Nuestra Memoria para cesión. Mantener licencia obliga share-alike. |
| **Memòria Històrica Diputació València** | [memoriahistorica.dival.es](https://memoriahistorica.dival.es/recursos/bases-de-datos/) | Buscadores web por base | Por confirmar | HTML | Múltiples bases (BDST valencianos, procedimientos militares, represión republicana, fosas, audiovisual) | **c1**: redirección. Excelente modelo conceptual de portal regional. |
| **ARMH** | [memoriahistorica.org.es](https://memoriahistorica.org.es/listados-de-victimas/) | Buscador web. Sin API. | Por confirmar | HTML | 1.400+ recuperadas + listas parciales | **c1**: redirección. Contactar para acuerdo. |
| **CDMH Salamanca** | [cultura.gob.es/cdmh](https://www.cultura.gob.es/cultura/areas/archivos/mc/archivos/cdmh/bases-de-datos.html) | Pendiente (problemas SSL recurrentes desde herramientas automatizadas) | Catálogo público | HTML | Por confirmar | **Pendiente Nacho:** revisar manualmente y catalogar las bases. |
| **Buscar Combatientes (MPTMD)** | [mptmd.gob.es/.../buscar-combatientes](https://mptmd.gob.es/en/portal/memoria-democratica/archivos-estatales/guiadecensosdevictimas/proyectos-memorialistas/buscar-combatientes) | Buscador web | Por confirmar | HTML | Por confirmar | **c1**: redirección. Inspección manual pendiente. |

## Notas detalladas por fuente

### Lo que es realmente descargable hoy
- **Euskadi (Gogora)**: dataset de fosas y dataset de víctimas mortales. CSV / XML / XLS. Confirmado abierto. Pieza de partida del MVP.
- **Andalucía**: fosas comunes de la Guerra Civil. Campos confirmados: nombre, carácter, provincia, municipio, fecha, titularidad, fotografías, descripción de ubicación, número de víctimas, relato histórico, promotor, descripción de la acción.
- **Comunitat Valenciana**: mapa de fosas (represión en retaguardia republicana, represión franquista, combatientes, víctimas de bombardeos).

**Acción inmediata para el plan técnico:** descargar una muestra de cada uno y validar esquema antes de modelar la base.

### SCWD / IHR — fuente central pero NO abierta
La entrada de datos.gob.es es **engañosa**: figura como "aplicación" porque enlaza al buscador, no porque ofrezca el dataset. Los ~230.000 registros (que incluyen AGMG, Arxiu Nacional de Catalunya, Archivo Intermedio Militar de Canarias, archivos militares de Madrid, León, Huesca, Ávila) sólo son consultables vía el buscador. Para indexarlos hay dos caminos: (1) contactar a Innovation and Human Rights y negociar cesión, (2) patrón c1 con redirección. Decisión a tomar.

### Censo Estatal Cenomi
Confirmado: 510.857 registros en la herramienta **Dédalo**, base oficial. Periodo de primera fase: 1936-1939, civiles ejecutados por motivos ideológicos. Hay una propuesta metodológica para extender al periodo 1940-1942. Apertura pública prevista 1S 2026. Estado a hoy: pendiente de verificación manual.

### Portal Víctimas PARES
URL del buscador identificada: `https://pares.cultura.gob.es/victimasGCFPortal/buscadorSencilloFilter.form`. Acceso libre sin registro. **Los parámetros exactos de URL para deep linking no están documentados públicamente.** Hay que hacer una búsqueda real y mirar el GET resultante. PARES también tiene buscador con IA (`pares-htr`) que conviene explorar.

### patrimoniocultural.defensa.gob.es
Catálogo del Sistema Archivístico de la Defensa. Incluye los fondos del AGMG (Luciano está aquí), AGMS, AGMAV. Reproducción de expedientes: trámite manual al archivo. Esto es exactamente lo que la **guía dinámica** debe automatizar con plantillas de carta + dirección postal + procedimiento.

### Todos los Nombres — atención a la licencia
**CC BY-NC-SA**: encaja con proyecto sin ánimo de lucro pero obliga a (1) atribuir, (2) no usar comercialmente, (3) **compartir cualquier derivado bajo la misma licencia**. Si en algún momento se quiere relicenciar el conjunto del índice como datos abiertos sin restricción comercial, no se podrá incluir TLN sin acuerdo expreso. Mantenedores: CGT Andalucía + Asociación "Nuestra Memoria". Contactos: tlngab@cgtandalucia.org, nuestramemoriasevilla@gmail.com.

### Memòria Històrica Diputació de València
Hallazgo de la segunda pasada. Portal regional con múltiples bases propias (represaliados valencianos en BDST, procedimientos militares en Tribunales Militares Territoriales, víctimas de represión republicana en la CV, base integrada de fosas) más enlaces a externas. Sirve como **referencia conceptual** del tipo de portal regional que se quiere construir a escala estatal.

### ARMH
Buscador web con datos no oficiales ni exhaustivos. Útil como complemento, no como pieza central.

## Acciones pendientes (manuales, para Nacho)

Estas no se pueden cerrar con WebFetch automatizado y requieren navegación real o gestión humana:

1. **Inspeccionar parámetros GET de PARES Portal Víctimas.** Hacer una búsqueda en `pares.cultura.gob.es/victimasGCFPortal/buscadorSencilloFilter.form` y copiar la URL resultante. Esto da el contrato de deep linking para integración c1.
2. **Verificar Cenomi.** Entrar a `mptmd.gob.es/portal/memoria-democratica/registro-y-censo-estatal-de-victimas` con un navegador y ver si la consulta pública ya está activa.
3. **Revisar el CDMH Salamanca.** La página `cultura.gob.es/cultura/areas/archivos/mc/archivos/cdmh/bases-de-datos.html` da problemas de certificado SSL a herramientas automatizadas. Catalogar manualmente qué bases ofrecen.
4. **Inspeccionar parámetros de URL en**: patrimoniocultural.defensa.gob.es, todoslosnombres.org, memoriahistorica.org.es/listados-de-victimas, mptmd.gob.es/buscar-combatientes. El mismo procedimiento: hacer una búsqueda real y copiar la URL.
5. **Contactar IHR (Innovation and Human Rights)** para preguntar si entregan dataset bajo acuerdo a un proyecto público sin ánimo de lucro.
6. **Contactar CGT Andalucía / Nuestra Memoria** sobre cesión de Todos los Nombres bajo CC BY-NC-SA.

## Implicaciones para el plan técnico

- **El MVP arranca con datasets autonómicos confirmados** (Euskadi, Andalucía, Valencia) + redirección c1 al resto. Es realista, abierto, sin dependencias de negociación, y suficiente para empezar a probar el caso piloto con datos reales.
- El modelo de datos del índice propio debe soportar **trazabilidad por fuente** en cada registro (un nombre puede aparecer en varias fuentes). Necesario para score de confianza y para citar.
- **Licencia CC BY-NC-SA de TLN** marca el techo del proyecto: si se incluye, el conjunto derivado hereda la condición. Decisión a tomar antes de integrarla.
- **Deep linking** sigue siendo la pieza más urgente a verificar y queda como acción manual.
- **El caso piloto de Luciano Herrera Calonge no se cubre con los datasets autonómicos abiertos** (Luciano aparece en AGMG, que está en SCWD/IHR vía el agregado-redirección). Es decir, para validar el caso piloto en el MVP necesitamos sí o sí redirección a SCWD/IHR o acuerdo con IHR. Asumirlo desde el principio.

## Decisión tomada

**Opción A + B en paralelo** (decisión #15 en [decisiones.md](decisiones.md)). Arrancar indexando solo lo descargable y abierto hoy; en paralelo, abrir negociación con IHR (SCWD) y otras fuentes con licencia restrictiva.

---

# Ampliación — tercera pasada (CCAA + categorías específicas)

Realizada el 2026-06-09. Se han identificado fuentes adicionales por comunidad autónoma y por categoría temática (deportados a campos nazis, brigadistas internacionales, exilio, niños de la guerra).

## Fuentes regionales / autonómicas adicionales

| CCAA / fuente | URL | Acceso | Contenido | Estado MVP |
|---|---|---|---|---|
| **Catalunya — Banc de la Memòria Democràtica** | [banc.memoria.gencat.cat](https://banc.memoria.gencat.cat/) | Buscador integrado + ANC publicó **69.833 registros como open data reutilizable** | Procedimientos militares 1938-1978, Cost Humà de la Guerra Civil (víctimas mortales confirmadas), prisiones franquistas, fosas, espacios de memoria | **Prioridad 1**. Open data confirmado. Indexar. |
| **Catalunya — Deportados a campos nazis** | [memoria.gencat.cat/deportats](https://memoria.gencat.cat/deportats) | Web pública. Probable open data dentro del Banc | 9.161 deportados (5.166 fallecidos, 3.539 supervivientes; 2.000 catalanes) | **Prioridad 1**. Cubre categoría sin equivalente nacional. |
| **Galicia — Nomes e Voces** | [scwd.ihr.world/en/dataset/36](https://scwd.ihr.world/en/dataset/36) (vía IHR) | Vía SCWD/IHR mediante acuerdo USC-IHR | 14.951-18.000 fichas. Cooperación tres universidades gallegas + Xunta | **Prioridad 1 si se cierra acuerdo con IHR**. Si no, c1. |
| **Extremadura — PREMHEX** | [premhex.es](https://premhex.es/buscar-represaliados-buscador/) | Buscador web + fondos digitalizados | Sentencias de Expedientes de Responsabilidades Políticas y Consejos de Guerra. Filtros: nombre, apellidos, vecindad, provincia | **c1**: redirección. Contactar para cesión. |
| **Asturias — Memoria Democrática** | [memoriademocratica.asturias.es](https://memoriademocratica.asturias.es/fondos-documentales-y-bases-de-datos) | Portal regional con buscador de fosas | 400 fosas + fondos | **c1**: redirección. |
| **Navarra — Fondo Documental Memoria Histórica** | [memoria-oroimena.unavarra.es](https://memoria-oroimena.unavarra.es/) | Buscador web (UPNA) | Miles de represaliados 1936-1975. Mezcla investigación publicada + archivos + testimonio oral | **c1**: redirección. |
| **Aragón — DARA Memoria Democrática** | DARA (Archivos Aragón) | Portal regional | Documentación, fotos, audios 1936-1977 | **c1**: redirección. |

## Fuentes temáticas específicas

| Tema / fuente | URL | Acceso | Contenido |
|---|---|---|---|
| **Deportados a campos nazis — Amical de Mauthausen** | [amical-mauthausen.org/projectes/bases-de-dades](https://amical-mauthausen.org/en/projectes/bases-de-dades/) | Buscador web | Censo desarrollado con Memorial Democràtic + UPF. 9.161 deportados |
| **Deportados a campos nazis — deportados.es** | [deportados.es](https://deportados.es/) | Portal informativo + buscador | Portal nacional de referencia |
| **Brigadas Internacionales — SIDBRINT** | [sidbrint.ub.edu](https://sidbrint.ub.edu/) | Buscador web. UB + 12 universidades + Min. Ciencia | 7.000 brigadistas (objetivo final 35.000). Datos: país de origen, profesión, batallón |
| **Exilio español en América Latina — México (SRE)** | [portales.sre.gob.mx/acervo/coleccion-digital-exilio-espanol-en-america-latina-1936-1975](https://portales.sre.gob.mx/acervo/coleccion-digital-exilio-espanol-en-america-latina-1936-1975) | Colección digital | Acervo Histórico Diplomático México |
| **CIDA — Guías de exilio** | [cultura.gob.es/cida](https://www.cultura.gob.es/cultura/areas/archivos/mc/centros/cida/4-difusion-cooperacion/4-1-guias-de-lectura/guia-exilio-espanol-1939-archivos-estatales/recursos-exilio.html) | Guías documentales del Min. Cultura | Recursos sobre exilio, barcos de exilio, fondos AGA / AHN / CDMH |
| **Niños de la guerra — Los niños que nunca volvieron** | [losninosquenuncavolvieron.es](https://losninosquenuncavolvieron.es/) | Portal interactivo del Min. Inclusión, Seguridad Social y Migración | >34.000 niños evacuados; URSS (~2.895), México (~500 niños de Morelia), otros |

## Implicaciones para el plan técnico (revisadas)

1. **El MVP arranca ahora con tres pilares descargables / open data confirmados**, no solo dos:
   - Datasets autonómicos en datos.gob.es (Euskadi, Andalucía, Valencia)
   - **Banc de la Memòria Democràtica de Catalunya** — 69.833 registros open data reutilizable (vía ANC)
   - Cesión paralela negociada con IHR (Galicia + AGMG + resto SCWD)

   Con solo Catalunya + los autonómicos, ya tenemos cobertura significativa: ~70.000 registros como mínimo, más datos geoespaciales de fosas. Suficiente para validar el modelo y las búsquedas con casos reales.

2. **Cobertura temática mejorada.** Más allá del eje "víctima en territorio español", el producto puede ofrecer **caminos temáticos específicos en la guía**: deportado a campos nazis → derivación a Amical / Banc Catalunya; brigadista internacional → SIDBRINT; niño evacuado → Los niños que nunca volvieron; exiliado → CIDA + SRE México. Esto refuerza la pieza C (guía asistida): la app no solo "busca" sino que reconoce el perfil y orienta al recurso adecuado.

3. **Mapa de fuentes por CCAA cubierto al 70-80%**: confirmadas Catalunya, Euskadi, Andalucía, Valencia (Generalitat y Diputació), Galicia (vía IHR), Extremadura, Asturias, Navarra, Aragón. Pendientes claras: Castilla y León, Castilla-La Mancha, Madrid, Murcia, Canarias, Cantabria, Baleares, La Rioja. Probablemente existan portales regionales para varias.

4. **Trazabilidad y desambiguación temática**: el modelo de datos debe etiquetar cada registro con su **categoría** (consejo de guerra, fosa, BDST, deportado, brigadista, exiliado, niño evacuado, prisión, expediente de responsabilidades políticas, etc.) para que la guía dinámica pueda activar el módulo correcto.

5. **Acuerdo con IHR sube de "deseable" a "estratégico"**: además del agregado de 230.000 documentos, IHR es la vía técnica de acceso a Nomes e Voces (Galicia) y posiblemente a otros datasets con acuerdo similar. Un solo acuerdo abre varias fuentes.

## Acciones manuales pendientes (ampliadas)

A las ya listadas se añaden:
7. **Verificar formato de descarga del Banc de la Memòria Democràtica** (ANC publicó como open data — confirmar URL directa de descarga y licencia).
8. **Catalogar fuentes pendientes** por CCAA: Castilla y León, Castilla-La Mancha, Madrid, Murcia, Canarias, Cantabria, Baleares, La Rioja.
9. **Inspeccionar SIDBRINT** para deep linking de búsqueda.
10. **Inspeccionar memoria.gencat.cat/deportats** para deep linking o descarga.
11. **Inspeccionar Los niños que nunca volvieron** para deep linking y descarga.

# Visión y alcance — Memoria Histórica

## 1. Objetivo

Aplicación web pública y sin ánimo de lucro que ayuda a familiares de personas desaparecidas durante la Guerra Civil española y la posguerra a averiguar qué ocurrió con sus seres queridos. Combina dos funciones: **buscador unificado** sobre fuentes históricas y **guía asistida** personalizada para los siguientes pasos de investigación.

## 2. Usuario principal

Familiares (con o sin investigación previa), priorizando lenguaje claro y guiado. Arquitectura preparada para escalar a investigadores y asociaciones de memoria histórica más adelante.

## 3. Flujo principal

1. Pantalla de bienvenida con dos caminos: **"Buscar a alguien"** / **"No sé por dónde empezar, guíame"**.
2. Modo invitado por defecto; registro opcional para guardar progreso, recibir avisos y colaborar.
3. Creación de una **ficha del desaparecido** mediante formulario guiado paso a paso.
4. La ficha persiste como expediente personal que se enriquece con el tiempo.
5. Búsqueda automática cruzada contra el índice propio + enlaces pre-rellenados a fuentes externas.
6. Guía dinámica personalizada según los datos de la ficha y los hallazgos.
7. Posibilidad de invitar a otros familiares a colaborar en la misma ficha.

## 4. Modelo de ficha (inputs)

### Identidad
- Nombre y apellidos
- Apodo / forma familiar
- Fecha de nacimiento (aproximada o exacta)
- Lugar de nacimiento (pueblo, provincia)
- Profesión / oficio

### Contexto familiar
- Nombre del padre y la madre
- Estado civil, nombre del cónyuge
- Hijos conocidos

### Contexto político/social (sensible)
- Afiliación política o sindical conocida
- Bando o simpatías (republicano / nacional / sin definir / desconocido)
- Cargo público, militar o religioso si lo tuvo

### Desaparición
- Fecha aproximada de la última vez que se le vio
- Lugar de la desaparición
- Circunstancias (detenido por…, llevado a…, huido a…, frente de batalla…)
- Testigos o testimonios familiares

### Investigación previa
- Pistas
- Búsquedas ya realizadas
- Hipótesis (fosa concreta, exilio, campo de concentración…)

### Metadatos
- Quién la creó, cuándo
- Visibilidad (privada / pública / pública anonimizada)
- Familiares colaboradores invitados
- Estado de la investigación

**Sin archivos.** Solo texto estructurado. No se suben fotos ni documentos.

## 5. Outputs

- Ficha del desaparecido visible según permisos.
- Resultados de búsqueda con score de confianza y origen de cada coincidencia.
- Enlaces pre-rellenados a buscadores externos.
- Guía paso a paso personalizada (artículos, plantillas, contactos de asociaciones).
- Estado de la investigación.

## 6. Reglas principales

- **Visibilidad por ficha:** privada / pública / pública anonimizada. Por defecto pública.
- **Datos sensibles** con control independiente: ocultos a visitantes anónimos en fichas públicas salvo autorización.
- **Sin almacenamiento de archivos** — solo texto.
- **Multilingüe:** español, catalán, gallego, euskera (interfaz + equivalencias de nombres en búsqueda).
- **Matching difuso** (fuzzy + fonético adaptado al español) con score de confianza.
- **Web responsive** — sin app nativa.
- **Sin ánimo de lucro**, aviso legal claro, mecanismo de retirada de datos.

## 7. Excepciones y casos límite

- Dos ramas familiares descubren que buscan a la misma persona → cruce de fichas.
- Datos sobre terceros vivos en testimonios → revisión / anonimización.
- Nombres con variantes lingüísticas regionales → tabla de equivalencias.
- Fechas inciertas o aproximadas → tolerancia en el matching.
- **Pendiente de resolver:** conflictos de edición en fichas colaborativas.
- **Pendiente de resolver:** verificación de "soy familiar" para acceso a datos sensibles.

## 8. Criterios de calidad

- Un familiar sin conocimientos previos puede crear una ficha y obtener al menos una pista útil o un siguiente paso claro en menos de 10 minutos.
- Los resultados de búsqueda muestran origen, fecha de la fuente y nivel de confianza.
- La guía paso a paso es accionable (plantilla concreta, dirección concreta, no consejos genéricos).
- Lenguaje accesible, sin jerga archivística ni histórica.
- Carga rápida y uso fluido en móvil.
- Cumplimiento riguroso de RGPD y respeto a la sensibilidad ética del dominio.

## 9. Arquitectura de búsqueda

**MVP (c1):** índice propio sobre datos abiertos descargables + redirección con búsquedas pre-rellenadas a fuentes externas que no tienen API (PARES, archivos provinciales).

**Evoluciones futuras:**
- **c2:** scraping legal y respetuoso en background con notificaciones al usuario cuando aparezcan resultados nuevos.
- **c3:** acuerdos con asociaciones y proyectos académicos para que cedan sus datasets directamente.

## 10. Guía asistida

Dos capas:

- **Biblioteca estática** de contenido experto organizada por casuísticas (bando, tipo de represión, zona, época, trámites).
- **Guía dinámica** que selecciona y ordena pasos según los datos de la ficha **y los hallazgos** de la búsqueda. Si la búsqueda devuelve "BDST", la guía se reorienta hacia el procedimiento del Archivo General Militar de Guadalajara.

Sin IA conversacional — el riesgo de alucinar nombres de archivos y formularios no compensa.

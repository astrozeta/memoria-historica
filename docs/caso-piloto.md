# Caso piloto — Luciano Herrera Calonge

Caso real aportado por el usuario el 2026-06-09. Sirve como prueba de extremo a extremo del MVP.

## Datos conocidos

- **Nombre:** Luciano Herrera Calonge
- **Referencia indexada:**
  - Archivo: Archivo General Militar de Guadalajara (AGMG)
  - Fondo / serie: Batallones Disciplinarios de Soldados Trabajadores y soldados escolta — BDST
  - Caja: 303042
  - Expediente: 71620

## Fuentes donde aparece

- **patrimoniocultural.defensa.gob.es** — catálogo oficial del Ministerio de Defensa.
- **scwd.ihr.world** — Spanish Civil War Database (Institute for Historical Research), base de 137.898 nombres de BDST procedentes del AGMG.

## Lo que revela este caso

- No es un "desaparecido sin rastro" — el sistema franquista lo registró en algún momento dentro de los batallones disciplinarios.
- Próximo paso lógico: solicitar reproducción del expediente al AGMG para confirmar identidad y contrastar datos.

## Cómo lo manejaría la app (recorrido esperado)

1. El familiar entra → "buscar a alguien" → formulario guiado.
2. Rellena nombre y los datos que conozca.
3. Búsqueda automática cruza con el índice propio (incluyendo dataset SCWD/IHR) → coincidencia con score alto.
4. La ficha muestra el hallazgo: Caja 303042, Expediente 71620, BDST, AGMG. Con enlace pre-rellenado a `patrimoniocultural.defensa.gob.es`.
5. La guía dinámica detecta "BDST" y activa el módulo correspondiente: qué eran los batallones disciplinarios, qué contiene un expediente, plantilla de solicitud al AGMG con dirección y procedimiento, plazos.
6. La ficha queda guardada y compartible con otros familiares.

## Hallazgo de diseño que surge de este caso

La guía dinámica debe poder activarse no solo por los datos de entrada de la ficha sino también por el **tipo de hallazgo** de la búsqueda. Es decir, los módulos de la guía se asocian a etiquetas (BDST, fosa común, exilio, campo de concentración, consejo de guerra, etc.) que se activan al encontrar coincidencias clasificadas.

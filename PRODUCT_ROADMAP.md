# Hoja de ruta del producto

Última actualización: 2026-08-26

Este documento conserva las mejoras de producto propuestas para **Marvel Rivals Hero Training Assistant**. No representa trabajo ya implementado. Debe usarse para elegir las próximas iteraciones sin perder el enfoque principal de la aplicación.

## Visión

La aplicación debe ser un entrenador personal explicable, no otro tracker generalista. Su función central es ayudar al jugador a decidir qué héroe practicar, registrar el resultado con poca fricción y demostrar si está progresando.

El ciclo ideal del producto es:

> recomendación → jugar → registrar rápidamente → ver progreso → nueva recomendación

El principal riesgo actual es que cargar datos manualmente requiera más esfuerzo del que la recomendación devuelve. Las siguientes mejoras deben reducir esa fricción y hacer visible el valor acumulado de usar Training.

## Prioridad 1 — Panel de progreso general

**Estado: primera versión implementada el 2026-08-26.**

Crear una vista que permita entender el estado completo del hero pool sin depender de girar la ruleta.

Por cada héroe debería mostrar:

- experiencia efectiva;
- partidas Quick Match registradas;
- fecha de la última práctica;
- confiabilidad de los datos;
- prioridad actual de Training;
- estado legible: `Sin probar`, `Reuniendo datos`, `Necesita práctica`, `En mantenimiento` o `Bien cubierto`.

La vista debería permitir ordenar o filtrar por prioridad, rol, estado y recencia. Los estados deben derivarse de las señales ya calculadas por `trainingPriority`, sin crear una segunda lógica contradictoria.

La primera versión incluye los 55 héroes/formas, resumen por estado, búsqueda, filtros por rol y estado, orden por prioridad, experiencia, recencia o nombre, y tarjetas responsive con las señales principales. Los estados se derivan en `services/trainingProgress.js` a partir del resultado de `trainingPriority`.

Antes de considerarla cerrada definitivamente, debe recibir la evaluación visual y de claridad del usuario. Posibles iteraciones posteriores: hacer clic en un estado del resumen para filtrarlo, abrir la edición de estadísticas desde una tarjeta y ajustar densidad o vocabulario según uso real.

Se considera terminada cuando el usuario puede abrir la pantalla y responder rápidamente: “¿qué héroes conozco poco, cuáles necesitan trabajo y cuáles ya están cubiertos?”.

## Prioridad 2 — Registro rápido al finalizar un bloque

Convertir cada bloque de práctica en una fuente de datos propia para la app.

Al completar el bloque, pedir únicamente:

- victorias;
- derrotas o partidas totales;
- opcionalmente, una valoración subjetiva breve como `Me costó`, `Normal` o `Me sentí cómodo`.

La aplicación debe sumar automáticamente el resultado al snapshot Quick Match correspondiente y archivar la sesión. El formulario debe permitir omitir el resultado si el usuario no quiere registrarlo.

Es importante evitar dobles conteos entre estadísticas acumuladas introducidas manualmente y partidas registradas por Training. Antes de implementarlo se debe definir si la app mantiene un ledger propio de partidas, snapshots acumulados o ambos con procedencia explícita.

Se considera terminada cuando el usuario puede practicar, registrar el resultado en pocos segundos y obtener una recomendación actualizada sin abrir Player Stats.

## Prioridad 3 — Objetivos de entrenamiento configurables

Permitir que el usuario indique qué quiere obtener de la sesión. Perfiles iniciales sugeridos:

- **Práctica equilibrada:** comportamiento actual como opción predeterminada.
- **Explorar héroes nuevos:** aumenta exploración y baja experiencia.
- **Mejorar puntos débiles:** aumenta la influencia de resultados Quick Match por debajo del baseline.
- **Ampliar mi pool competitivo:** prioriza héroes con familiaridad parcial pero poca evidencia Quick Match.
- **Mantener mis héroes principales:** aumenta la influencia de recencia en héroes ya conocidos.

Los perfiles deben modificar parámetros del mismo modelo de prioridad, no duplicar algoritmos. La interfaz debe explicar en una frase qué cambia y recordar la preferencia.

Se considera terminada cuando dos objetivos distintos producen recomendaciones comprensiblemente diferentes con los mismos datos del jugador.

## Prioridad 4 — Explicaciones más concretas

Mejorar **Why this hero** para que la recomendación sea auditable sin exponer toda la matemática.

Ejemplo:

> Poca experiencia: 4 partidas efectivas. Quick Match: 42%; baseline comunitario: 51%. Tus datos todavía tienen confiabilidad baja.

La explicación debería mostrar, cuando corresponda:

- experiencia efectiva y cómo influyó Competitive;
- win rate personal Quick Match;
- baseline operativo de Counterwatch;
- cantidad de partidas y nivel de confiabilidad;
- recencia;
- procedencia y compatibilidad temporal del benchmark.

Debe conservarse el límite de dos razones principales y utilizar lenguaje prudente con muestras pequeñas. Puede existir un control `Ver detalles` para la información secundaria.

Se considera terminada cuando el usuario puede explicar por qué salió un héroe y distinguir entre falta de datos, falta de experiencia y rendimiento débil.

## Prioridad 5 — Historial y evolución

Mostrar que la práctica produce cambios a lo largo del tiempo.

Por héroe, registrar y visualizar:

- bloques completados;
- partidas y resultados registrados;
- evolución del win rate, cuando los puntos sean comparables;
- cambios en experiencia efectiva y confiabilidad;
- fechas de práctica;
- notas o sensación subjetiva opcional.

Los gráficos no deben unir contextos incompatibles como si fueran una misma serie. Temporadas y modos diferentes deben estar separados o identificados claramente.

Se considera terminada cuando el usuario puede comparar su estado actual con semanas anteriores y reconocer continuidad en su práctica.

## Prioridad 6 — Simplificar temporadas en la interfaz

Conservar temporadas completas y parciales en el modelo de datos, pero reducir la carga mental en la entrada manual.

Propuesta:

- seleccionar automáticamente la temporada vigente;
- presentar `Temporada actual` como opción principal;
- mover temporadas anteriores a una sección de historial o selector avanzado;
- mantener `overall` como contexto separado;
- explicar brevemente por qué los datos antiguos pueden recibir menos peso;
- evitar pedir al usuario que comprenda la segmentación interna para realizar una carga común.

La compatibilidad estricta debe mantenerse para evaluaciones Competitive. Simplificar la interfaz no autoriza a mezclar contextos en el almacenamiento o en los benchmarks.

Se considera terminada cuando registrar datos de la temporada actual requiere menos decisiones sin perder la procedencia temporal.

## Orden recomendado de implementación

1. Panel de progreso general.
2. Registro rápido al finalizar un bloque.
3. Explicaciones más concretas.
4. Objetivos configurables.
5. Historial y evolución.
6. Simplificación de temporadas, incorporándola también durante las mejoras anteriores cuando sea natural.

El panel debería construirse primero porque hace visible el modelo actual y permite detectar prioridades contraintuitivas antes de agregar más señales. El registro rápido es el cambio con mayor impacto en retención, pero requiere diseñar cuidadosamente la procedencia y el doble conteo de los datos.

## Criterios permanentes

- Mantener Quick Random simple y uniforme.
- Mantener Training explicable y Quick Match-first.
- No inventar precisión con muestras pequeñas.
- No promediar poblaciones o fuentes incompatibles.
- Mantener separadas las identidades de las tres formas de Deadpool.
- Priorizar menos carga manual y mayor claridad para jugadores no técnicos.
- Ajustar pesos con evidencia de uso real, no solo porque una fórmula parezca elegante.
- No agregar un backend o sincronización obligatoria hasta que el ciclo local de práctica sea sólido.

## Decisión para la próxima iteración

La próxima mejora recomendada es el **panel de progreso general**. Antes de programarlo conviene definir un pequeño wireframe y los estados derivados del modelo actual. Luego se puede probar con el respaldo real para comprobar que la clasificación resulte intuitiva.

# Continuidad del proyecto

Última actualización: 2026-08-25

Este documento es la memoria durable del desarrollo de **Marvel Rivals Hero Training Assistant**. Debe leerse junto con `README.md` y el historial Git antes de continuar el trabajo desde otra computadora o desde una nueva tarea de Codex.

## Objetivo del producto

La aplicación busca convertir una ruleta de héroes en una herramienta de práctica deliberada. Debe recomendar héroes para entrenar usando experiencia, desempeño y recencia, sin inventar precisión cuando faltan datos compatibles.

El usuario no necesita conocimientos técnicos. La interfaz debe explicar por qué recomienda un héroe y distinguir claramente entre datos insuficientes, datos incompatibles y rendimiento débil conocido.

## Estado actual

- Aplicación estática en HTML, CSS y JavaScript, sin build obligatorio.
- Rama principal: `main`.
- Producción: <https://marvel-rivals-hero-training-app.vercel.app/>.
- Catálogo de benchmarks de Season 9.5 generado desde CSV reproducibles.
- Modos separados: **Quick Random** y **Training**.
- Training usa selección ponderada y muestra una explicación de la recomendación.
- Los datos del jugador se guardan localmente en el navegador.
- La interfaz permite exportar e importar un respaldo JSON portable.
- La batería actual contiene 69 pruebas y debe permanecer completamente verde.

## Decisiones de benchmark

Una comparación de habilidad requiere coincidencia exacta de:

- temporada;
- `gameMode = competitive`;
- rango competitivo exacto;
- héroe;
- nombre de métrica;
- unidad canónica.

No existe fallback entre temporadas, rangos, Quick Play o poblaciones acumulativas con sufijo `+`.

Los filtros `Diamond+`, `Grandmaster+`, `Celestial+` y `Eternity+` son poblaciones de referencia distintas. Nunca representan el rango exacto del jugador y no pueden satisfacer una búsqueda exacta.

Quick Play se conserva para experiencia, volumen, recencia e historial de entrenamiento, pero nunca altera una evaluación de habilidad Competitive.

Las fuentes de validación permanecen separadas de la fuente primaria. Sus valores no se promedian.

## Datos de benchmark disponibles

- Temporada: Season 9.5.
- Modo: Competitive.
- Fuente primaria: RivalsTracker.
- Trece filtros publicados: Bronze, Silver, Gold, Platinum, Diamond, Diamond+, Grandmaster, Grandmaster+, Celestial, Celestial+, Eternity, Eternity+ y One Above All.
- Los filtros completos tienen 55 entradas de héroes.
- One Above All conserva solamente los héroes publicados por la fuente; no se rellenan ausencias.
- Bronze y Silver no publican `banRate`; esos valores permanecen no disponibles, no se convierten en cero.
- Los porcentajes se almacenan como ratios entre `0` y `1`.
- Los CSV fuente están en `data/benchmark-sources/` y el catálogo generado está en `data/benchmarks.json`.
- `npm run build:benchmarks` regenera el catálogo.

## Identidad de Deadpool

Las tres formas de Deadpool son héroes independientes porque tienen habilidades y estadísticas distintas:

- `deadpool-duelist`;
- `deadpool-strategist`;
- `deadpool-vanguard`.

No deben fusionarse estadísticas, benchmarks, sesiones ni prioridades entre las formas. Solo comparten recursos visuales y la página oficial. Los datos legacy bajo el antiguo ID `deadpool` se conservan, pero nunca se asignan por suposición a una forma.

## Datos del jugador

`playerDataStorage` utiliza schema version 2:

- `winRate` es un ratio `0–1`;
- las métricas de tasa utilizan claves `perMinute`;
- Quick Play y Competitive se almacenan por separado;
- overall y temporada se almacenan por separado;
- las sesiones de entrenamiento conservan héroe, fecha, partidas, modo y temporada cuando están disponibles.

La entrada manual pide:

- modo de juego;
- período overall o temporada;
- número de temporada, por ejemplo `9` o `9.5`;
- rango exacto para Competitive estacional;
- partidas jugadas;
- partidas ganadas.

La aplicación calcula `winRate = matchesWon / matchesPlayed`. Las victorias deben ser enteras y no pueden superar las partidas. Con cero partidas el win rate queda no disponible. Los registros anteriores que solo tienen win rate siguen siendo compatibles.

## Estados de evaluación

- `known`: evidencia compatible suficiente.
- `weak`: evidencia compatible suficiente por debajo del benchmark.
- `unknown`: existe una comparación, pero la muestra es insuficiente.
- `unrated`: falta un benchmark compatible, rango, temporada, métrica o dato Competitive.

La confianza está limitada por la muestra del jugador y la del benchmark. Las muestras muy bajas o bajas permanecen `unknown`; se requiere al menos confianza media para declarar una categoría de rendimiento.

El Competitive de la temporada actual es primario. El Competitive overall aporta soporte limitado mientras la muestra estacional es pequeña y pierde influencia progresivamente.

## Prioridad de entrenamiento

Quick Random permanece uniforme. Training pondera candidatos usando:

- exploración cuando no existen datos;
- experiencia baja;
- recencia de sesiones;
- estado de evaluación `weak` o `unknown`;
- penalización por práctica muy reciente.

La interfaz muestra **Why this hero**. Los pesos se mantienen estables durante cada animación de ruleta.

Cuando un bloque completado es reemplazado por el siguiente giro, se archiva una sesión en `playerData.trainingSessions` para alimentar la recencia.

## Respaldo y migración entre computadoras

En **Player Stats → Data backup**:

- **Export data** descarga un JSON privado.
- **Import data** valida el archivo, pide confirmación y reemplaza los datos locales del navegador.

Backup schema version 1 incluye:

- player data y sesiones de entrenamiento;
- preferencias, filtros de rol y modo;
- lista de héroes bloqueados;
- UID y username guardados;
- bloque de práctica activo.

La importación pasa los datos por los sanitizadores de almacenamiento existentes. Un archivo malformado, de otra aplicación o de una versión no soportada debe rechazarse sin reemplazar datos.

El respaldo puede contener identificadores del jugador y debe mantenerse privado. El código y los benchmarks no forman parte del JSON porque se distribuyen mediante Git/GitHub.

## Archivos principales

- `index.html`: estructura de la interfaz y modales.
- `app.js`: estado de UI, ruleta, práctica, evaluación y respaldo.
- `services/playerDataStorage.js`: esquema y sanitización de datos del jugador.
- `services/preferencesStorage.js`: preferencias persistentes.
- `services/practiceStorage.js`: bloque activo.
- `services/appDataTransfer.js`: contrato del respaldo portable.
- `services/performanceResolver.js`: resolución estricta de contexto Competitive.
- `services/heroEvaluator.js`: evaluación conservadora y confianza.
- `services/trainingPriority.js`: pesos explicables de Training.
- `services/heroSelector.js`: selección uniforme o ponderada.
- `services/benchmarkCatalog.js`: validación y búsqueda de benchmarks.
- `scripts/buildBenchmarks.js`: importación reproducible de los CSV.

## Validación antes de entregar cambios

1. Ejecutar `npm test`.
2. Confirmar que todos los tests pasan.
3. Probar la interfaz en un servidor local.
4. Revisar que no haya errores en la consola del navegador.
5. Confirmar `git diff --check`.
6. Mantener `work/` fuera de los commits salvo decisión explícita del usuario; contiene descargas, capturas y scripts auxiliares de recolección.

## Próximos pasos sugeridos

1. Probar el respaldo exportado en un segundo navegador o perfil vacío.
2. Publicar la versión con exportación/importación para que los datos puedan moverse entre dominios sin herramientas técnicas.
3. Cargar datos reales de 5–10 héroes y observar si las recomendaciones de Training resultan intuitivas.
4. Ajustar pesos y mensajes solamente con evidencia de uso; no agregar precisión artificial.
5. Considerar una pantalla para revisar y editar todas las estadísticas guardadas sin depender del héroe actualmente seleccionado.
6. Considerar sincronización opcional con cuenta o backend en una etapa posterior. No asumirla como disponible hoy.

## Instrucción de reanudación para una nueva tarea

Usar este texto al iniciar una nueva tarea de Codex:

> Continuá el desarrollo de Marvel Rivals Hero Training Assistant. Antes de cambiar código, leé `PROJECT_HANDOFF.md`, `README.md`, el último historial Git y los tests relevantes. Conservá las decisiones de compatibilidad estricta, las identidades separadas de Deadpool y la separación entre Quick Play y Competitive. Verificá el estado actual antes de proponer el siguiente cambio.

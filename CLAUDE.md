# Jardín — app personal de proceso y hábitos

> Nombre provisional. App de uso estrictamente personal, para un solo usuario, en un solo celular Android. No hay cuentas, servidor ni nube.

## 1. Qué es

Una app móvil que acompaña un proceso terapéutico con enfoque ACT (Terapia de Aceptación y Compromiso) y un plan de metas personales. El MVP tiene dos secciones:

1. **Registro diario:** monitoreo del día por horas, auto-registro funcional de momentos de malestar, apertura y cierre del día, y un módulo de patrones *pensamiento → acción → refuerzo*.
2. **Seguimiento de hábitos:** checks diarios, racha flexible, recordatorios por hábito y un jardín visual que crece.

La app no reemplaza la terapia. Es una herramienta para **darse cuenta**, registrar y llevar información a las sesiones.

## 2. Contexto del proceso (léelo antes de diseñar cualquier pantalla)

La app traduce a software los conceptos que el usuario trabaja en terapia. Respeta este vocabulario en la interfaz:

- **Triple respuesta:** todo se registra en tres planos: lo que pienso (cognitivo), lo que hago (conductual) y lo que pasa en mi cuerpo (fisiológico).
- **Tres pasos de la terapia:** (1) darme cuenta, identificar pensamientos; (2) gestionar el malestar; (3) hacer acciones valiosas, llamadas **acciones comprometidas**.
- **Me acerca / me aleja:** cada acción del día se puede etiquetar según acerque o aleje de la "vida soñada".
- **Regla verbal → acción → refuerzo:** un pensamiento o regla ("debo ir al gym") lleva a una conducta ("ir dos veces y abandonar"), que se refuerza ("qué pereza ir al gym"). Un pensamiento se hace más fuerte cada vez que se le da la razón. Para romper el ciclo se usa una **acción opuesta** o una **regla verbal funcional** ("cada vez que no tenga ganas de ir al gym, voy a ir").
- **Pensamiento principal:** se reconoce porque aparece en todas las áreas de la vida.
- **Metáfora del jardín:** cada área de la vida es una planta. Se riega con acciones comprometidas. Puede haber maleza (miedos) y se puede convivir con ella. Una planta firme no muere si se deja de regar un tiempo. Se riega un área a la vez y se agrega algo nuevo cuando lo anterior ya es fácil.
- **Frase guía:** "No se incumplen los valores, se incumplen las acciones."

### Áreas de vida (fijas, sembradas en la base de datos)

`personal`, `profesional_estudio`, `amigos_familia`, `ocio`, `salud_bienestar`, `finanzas`, `pareja`

Nombres visibles: Personal, Profesional y estudio, Amigos y familia, Ocio, Salud y bienestar, Finanzas, Pareja.

## 3. Principios de producto (no negociables)

1. **Registrar debe tomar segundos.** Ningún formulario exige más de un campo para guardar. Todo lo demás es opcional y se puede completar después. Los borradores se guardan solos.
2. **Lenguaje compasivo.** Nunca "fallaste", "incumpliste" ni cruces rojas. Un día sin check se muestra en gris neutro. Textos sugeridos: "Hoy no regaste esta planta", "¿Cuál sería la versión mínima?", "Dos días seguidos sin regar. ¿Qué obstáculo apareció?".
3. **Lo mínimo cuenta.** Todo hábito tiene una "versión mínima"; marcarla cuenta para la racha y para el jardín.
4. **Nada castiga.** Las rachas no vuelven a cero por un día perdido. Las plantas se marchitan, pero nunca mueren y nunca pierden lo que crecieron.
5. **Privacidad total.** Datos solo en el dispositivo. Sin analítica, sin telemetría, sin llamadas de red.
6. **Funciona sin internet**, siempre.
7. **Interfaz en español (Colombia).** Identificadores de código en inglés.
8. **Simple antes que bonito.** El usuario pidió no preocuparse por la interfaz: componentes limpios, legibles, botones grandes, modo oscuro según el sistema. El único elemento con cuidado visual especial es el jardín.

## 4. Stack técnico

| Pieza | Elección |
| --- | --- |
| Framework | Expo (SDK estable más reciente) + React Native + TypeScript estricto |
| Navegación | expo-router (tabs) |
| Base de datos | expo-sqlite + Drizzle ORM con migraciones versionadas |
| Estado de UI | Zustand (solo estado efímero; la fuente de verdad es SQLite) |
| Fechas | date-fns con locale `es`; zona horaria fija `America/Bogota` |
| Notificaciones | expo-notifications (locales y programadas, sin push) |
| Gráficos del jardín | react-native-svg (+ react-native-reanimated para animaciones suaves, opcional) |
| PDF | expo-print (HTML → PDF) + expo-sharing |
| Respaldo | expo-file-system + expo-document-picker + expo-sharing |
| Tests | Jest para la lógica de dominio |
| Build | EAS Build con perfil que genere APK para instalar directo en el celular |

Notas para Claude Code:

- Trabaja con un **development build** (`expo-dev-client`) desde el inicio; Expo Go limita algunas funciones de notificaciones.
- Antes de usar una API de Expo, revisa la documentación de la versión instalada; las APIs cambian entre SDKs.
- Solicita el permiso de notificaciones (Android 13+) la primera vez que el usuario crea un recordatorio, no al abrir la app.

## 5. Alcance del MVP

### 5.1 Pestaña "Hoy" (registro diario)

Pantalla principal. Muestra el día actual con navegación a días anteriores (flechas o calendario).

**a) Apertura del día** (tarjeta plegable arriba)

- Lista de valores personales del usuario (editable en Ajustes) para leerlos. Botón "Leí mis valores".
- Pregunta: **"¿Qué puedo hacer hoy por mi jardín?"** → hasta 3 acciones comprometidas del día, cada una con un área opcional. Aviso suave si intenta poner más de 3: "Ve a lo simple".
- Completar la apertura marca automáticamente el hábito "Rutina de mañana" si existe y está vinculado.

**b) Monitoreo por horas** (línea de tiempo)

- Cada ítem: hora (`HH:mm`, por defecto la actual), qué hice (texto), pensamiento que surgió (opcional), etiqueta **me acerca / me aleja / neutral** (opcional) y área (opcional).
- Ítems ordenados por hora. Edición y borrado con gesto o menú.
- Al pie: **balance del día**, con el conteo de "me acerca" frente a "me aleja" en una barra simple.

**c) Cierre del día** (tarjeta plegable abajo)

- 3 cosas por las que agradezco.
- 1 paso que di hacia mis metas.
- 1 cosa que aprendí.
- Revisión de las acciones comprometidas de la mañana: hecha / mínima / no.
- Satisfacción del día de 1 a 10 (opcional).
- Completar el cierre marca automáticamente el hábito "Rutina de noche" si existe y está vinculado.

**d) Botón flotante "+"** con dos opciones:

- "Algo que hice o pensé" → nuevo ítem de línea de tiempo.
- "Momento de malestar" → nuevo auto-registro funcional (5.2).

### 5.2 Auto-registro funcional

Réplica del formato de la psicóloga, con extras.

| Campo | Pregunta en pantalla | Obligatorio |
| --- | --- | --- |
| `occurred_at` | Fecha y hora | Sí (por defecto: ahora) |
| `context` | ¿Qué pasó? (contexto) | Sí |
| `body` | ¿Cómo me siento? (todo lo que pasa en mi cuerpo) | No |
| `thought` | ¿Qué pienso / pensé? | No |
| `action` | ¿Qué hice para dejar de sentirme así o de pensar en eso? (consecuencia a corto plazo) | No |
| `long_term` | ¿Qué pasó unas horas o días después? (consecuencia a largo plazo) | No, se completa después |
| `intensity_before` | Intensidad del malestar al registrar (0–10) | No |
| `intensity_after` | Intensidad después (0–10) | No, se completa después |
| `area` | Área de vida | No |
| `direction` | ¿Lo que hice me acercó o me alejó? | No |
| `rule_id` | ¿Reconoces una regla verbal? (vincular o crear, ver 5.3) | No |
| `followed_rule` | ¿Le di la razón al pensamiento o hice la acción opuesta? | No |

Comportamiento:

- Guardar con solo `context`. El formulario es un paso a paso corto (una pregunta por pantalla, con "Saltar") o una sola pantalla con secciones plegables; elige lo más rápido de usar con una mano.
- **Pendientes de completar:** los registros con más de 3 horas sin `long_term` o sin `intensity_after` aparecen en una lista "Pendientes" dentro de la pestaña Registro, con un contador. Sin notificaciones para esto.
- La pestaña **Registro** lista los auto-registros por fecha, con filtro por área, por regla vinculada y por rango de intensidad.

### 5.3 Patrones: pensamiento → acción → refuerzo

Biblioteca de reglas verbales para romper ciclos. Es la parte que el usuario considera más útil para dejar hábitos.

Cada **regla** tiene:

- **Pensamiento / regla verbal** (ej. "Debo ir al gym").
- **Acción o conducta típica** (ej. "Me quedo en el celular y no voy").
- **Refuerzo** a corto plazo (ej. "Alivio, descanso inmediato").
- **Consecuencia** a largo plazo (ej. "Pereza acumulada, sensación de insuficiencia").
- **Regla verbal funcional** (ej. "Cada vez que no tenga ganas de ir al gym, voy a ir").
- **Acción opuesta o comprometida** (ej. "Ponerme la ropa del gym apenas suena la alarma").
- **Áreas** donde aparece (selección múltiple).

Pantalla de detalle de una regla:

- Diagrama horizontal simple: pensamiento + acción = refuerzo, igual que en la diapositiva de la psicóloga.
- Estadísticas: veces que apareció en auto-registros, porcentaje de veces que **le di la razón** frente a las que hice la **acción opuesta**, y tendencia de las últimas 4 semanas.
- Lista de auto-registros vinculados.

Reglas especiales:

- Si una regla aparece en 3 o más áreas, muestra la insignia **"Posible pensamiento principal"**.
- Un hábito puede vincularse a una regla (5.4). Cuando el hábito está sin marcar en el día, su tarjeta muestra la regla verbal funcional como recordatorio.

Semilla: crea una sola regla de ejemplo (la del gym, con los textos de arriba), editable y borrable. No siembres otras reglas personales en el código.

### 5.4 Hábitos

Cada **hábito** tiene:

- Nombre, área y valor al que sirve (texto libre).
- Frecuencia: diaria, días específicos de la semana o X veces por semana.
- **Versión mínima** (texto; ej. "una línea de gratitud").
- **Plan si-entonces** (texto; ej. "Si son las 20:00, entonces dejo el celular en la sala").
- Recordatorio opcional: hora + días. El texto de la notificación es el plan si-entonces.
- Regla verbal vinculada (opcional).
- Vínculo automático opcional: `opening` (se marca al completar la apertura) o `closing` (al completar el cierre).
- Fecha de inicio, fase del plan (número, opcional) y estado archivado.

**Check diario** con tres estados: **hecho**, **mínimo** y **no**, más "sin marcar". Nota corta opcional por check. Se puede marcar días pasados.

**Recordatorios por hábito:** programados con expo-notifications. Al crear, editar, archivar o borrar un hábito, reprograma sus notificaciones. Al abrir la app, verifica que todas estén programadas. Deseable: botones "Hecho" y "Mínimo" en la notificación.

**Hábitos sembrados** (editables, del plan de Fase 1 del usuario):

| Hábito | Área | Frecuencia | Versión mínima | Si-entonces | Vínculo |
| --- | --- | --- | --- | --- | --- |
| Acostarme 21:00–21:30 | Salud y bienestar | Diaria | Acostarme antes de las 22:00 | Si son las 21:00, entonces apago la luz | — |
| Levantarme a las 5:00 | Salud y bienestar | Diaria | Levantarme sin volver a la cama | Si apago la alarma, entonces me pongo de pie y voy por agua | — |
| Celular fuera desde las 20:00 | Personal | Diaria | Celular fuera de la cama | Si son las 20:00, entonces conecto el celular en la sala | — |
| Rutina de mañana | Personal | Diaria | Leer mis valores | Si tomo el agua, entonces abro la apertura del día | `opening` |
| Rutina de noche | Personal | Diaria | Una línea de gratitud | Si dejo el celular en la sala, entonces hago el cierre | `closing` |
| Comidas sin pantallas | Salud y bienestar | Diaria | Una comida sin pantalla | Si me siento a comer, entonces dejo el celular en otra mesa | — |
| Ir al gym | Salud y bienestar | 4 veces por semana | Ir aunque sea 20 minutos | Si suena la alarma, entonces me pongo la ropa del gym | Regla del gym |

No siembres recordatorios activos; el usuario los configura.

**Racha flexible** (por hábito):

- Hábitos diarios o de días específicos: la racha cuenta los días programados desde la última vez que hubo **dos días programados seguidos** en estado "no" o sin marcar. Un solo día perdido no la rompe. "Mínimo" cuenta como cumplido. El día de hoy sin marcar no cuenta hasta que termina.
- Hábitos de X veces por semana: la racha se cuenta en semanas (lunes a domingo). Una semana por debajo de la meta no la rompe; dos seguidas sí.
- Cuando los dos últimos periodos programados están sin cumplir, muestra una tarjeta suave: "Dos días seguidos sin regar *[hábito]*. ¿Qué obstáculo apareció? ¿Cuál sería la versión mínima hoy?", con un campo opcional para anotar el obstáculo.
- Muestra también la racha más larga.

### 5.5 Jardín

Vista principal de la pestaña Hábitos (con la lista de checks del día debajo o en una sub-pestaña).

- Una planta por área de vida, en cuadrícula, dibujada con SVG.
- **Crecimiento** (nunca retrocede), según los "días regados" del área, es decir, días con al menos un hábito del área en "hecho" o "mínimo":
  - Semilla: 0–6 días
  - Brote: 7–20
  - Planta joven: 21–44
  - Planta: 45–65
  - Florecida: 66 o más (66 días es la mediana para formar un hábito, Lally 2010)
- **Hidratación** (cambia el color y la postura de las hojas), según el cumplimiento de los últimos 7 días de los hábitos programados del área:
  - 80 % o más: vibrante
  - 50–79 %: normal
  - 1–49 %: mustia
  - 0 %: muy mustia, pero viva
- **Raíz firme:** un hábito con 66 o más días en "hecho" o "mínimo" gana una insignia, y sus días perdidos pesan la mitad en la hidratación de su área.
- Áreas sin hábitos: "terreno sin sembrar", con un botón para crear el primer hábito.
- Tocar una planta abre el detalle del área: sus hábitos, rachas, cumplimiento semanal y un mapa de 8 semanas.
- Pequeña animación al marcar un check (la planta "bebe"). Nada de sonidos.

### 5.6 Exportar PDF semanal y respaldo

**PDF para la psicóloga** (en Ajustes y en la pestaña Registro):

- Rango de fechas; por defecto, la semana anterior de lunes a domingo.
- Hoja A4 horizontal. Título "Auto registro – análisis funcional de conducta". Tabla con las columnas del formato original: Fecha, Hora, ¿Qué pasó?, ¿Cómo me siento? (cuerpo), ¿Qué pienso?, ¿Qué hice? (corto plazo), ¿Qué pasó después? (largo plazo), más Intensidad antes → después y Regla vinculada.
- Secciones opcionales con interruptores: monitoreo diario por horas (con marcas de me acerca / me aleja), resumen de reglas de la semana (apariciones y % de acción opuesta) y cumplimiento semanal de hábitos.
- Se genera con expo-print y se comparte con expo-sharing.

**Respaldo** (los datos solo viven en el celular):

- "Exportar respaldo": un archivo JSON con toda la base de datos y `schema_version`, compartido con el menú del sistema (Drive, correo propio, etc.).
- "Importar respaldo": selector de archivo, validación de versión y confirmación antes de reemplazar los datos.
- En "Hoy", aviso discreto si el último respaldo tiene más de 14 días. Sin notificación.

## 6. Fuera del alcance del MVP

Nube o sincronización, cuentas, bloqueo con PIN o huella (el usuario lo descartó), recordatorios de apertura, cierre o check-ins (solo recordatorios por hábito), selector de emociones, conteo de calorías o peso, funciones de IA, widgets de pantalla de inicio.

## 7. Modelo de datos

Fechas de día como texto `YYYY-MM-DD` y horas como `HH:mm`, en hora de Bogotá. Timestamps como ISO 8601. Todas las tablas tienen `created_at` y `updated_at`.

```
areas            (id TEXT PK, name, sort_order)                      -- 7 filas sembradas
values           (id, text, area_id NULL, sort_order)                -- valores para la apertura
day_entries      (date PK, values_read BOOL, satisfaction INT NULL,
                  gratitude_1, gratitude_2, gratitude_3, step, learning,
                  opening_done_at NULL, closing_done_at NULL)
day_commitments  (id, date FK, text, area_id NULL,
                  status: 'pending'|'done'|'minimal'|'no', sort_order)
timeline_items   (id, date FK, time, activity, thought NULL,
                  direction: 'toward'|'away'|'neutral' NULL, area_id NULL)
functional_records (id, occurred_at, context, body NULL, thought NULL, action NULL,
                  long_term NULL, intensity_before INT NULL, intensity_after INT NULL,
                  area_id NULL, direction NULL, rule_id NULL FK,
                  followed_rule: 'followed'|'opposite' NULL)
verbal_rules     (id, thought, typical_action, reinforcement, consequence,
                  functional_rule, opposite_action, archived BOOL)
rule_areas       (rule_id FK, area_id FK)                            -- muchos a muchos
habits           (id, name, area_id FK, value_text, frequency_type: 'daily'|'weekdays'|'times_per_week',
                  weekdays TEXT NULL,             -- ej. "1,3,5" (lunes=1)
                  times_per_week INT NULL, minimal_version, if_then,
                  reminder_time NULL, reminder_weekdays NULL,
                  rule_id NULL FK, auto_link: 'opening'|'closing' NULL,
                  start_date, phase INT NULL, archived BOOL, sort_order)
habit_checks     (habit_id FK, date, status: 'done'|'minimal'|'no', note NULL,
                  PRIMARY KEY (habit_id, date))
obstacle_notes   (id, habit_id FK, date, text)                       -- de la tarjeta de 2 días seguidos
settings         (key PK, value)                                     -- last_backup_at, schema_version, etc.
```

## 8. Lógica de dominio

Toda la lógica de cálculo vive en `src/domain/` como **funciones puras**, sin acceso a base de datos ni React, con tests en Jest escritos antes de la UI:

- `computeFlexibleStreak(habit, checks, today)` → `{ current, longest, needsAttention }`
- `isScheduled(habit, date)`
- `gardenStage(wateredDays)` y `gardenHydration(area, habits, checks, today)`
- `hasFirmRoots(habit, checks)`
- `dayBalance(timelineItems)` → conteo de me acerca y me aleja
- `ruleStats(rule, records, today)` → apariciones, % acción opuesta, tendencia de 4 semanas
- `isPossibleCoreThought(rule)` → 3 o más áreas
- `pendingRecords(records, now)` → registros a completar

Casos de prueba mínimos: un día perdido no rompe la racha; dos sí; "mínimo" cuenta; hoy sin marcar no rompe; días no programados se ignoran; hábitos de X por semana; cambio de semana; hábito creado hace menos de 7 días; el crecimiento del jardín no retrocede.

## 9. Navegación

Tabs inferiores:

1. **Hoy:** apertura, línea de tiempo, balance, cierre y botón "+".
2. **Hábitos:** jardín + checks del día + detalle de área + crear/editar hábito.
3. **Registro:** auto-registros, pendientes, filtros y exportar PDF.
4. **Patrones:** reglas verbales y su detalle.

Ícono de engranaje en el encabezado → **Ajustes:** valores personales, áreas (solo orden), respaldo, PDF, permisos de notificaciones y "Acerca de".

## 10. Estructura del proyecto

```
app/                    # rutas de expo-router
  (tabs)/
    index.tsx           # Hoy
    habits.tsx
    records.tsx
    patterns.tsx
  record/[id].tsx
  rule/[id].tsx
  habit/[id].tsx
  area/[id].tsx
  settings.tsx
src/
  db/                   # esquema Drizzle, migraciones, semillas, cliente
  domain/               # lógica pura + tests
  features/             # componentes y hooks por sección (today, records, patterns, habits, garden)
  notifications/        # programación y reprogramación
  export/               # plantillas HTML del PDF y respaldo JSON
  ui/                   # componentes compartidos y tema
  copy/es.ts            # todos los textos visibles en un solo lugar
```

## 11. Convenciones

- TypeScript estricto; sin `any`.
- Componentes funcionales y hooks. Acceso a datos solo a través de `src/db`.
- Todos los textos visibles en `src/copy/es.ts`, respetando el tono compasivo de la sección 3.
- Cambios de esquema siempre con migración nueva; nunca editar una migración ya aplicada.
- Commits pequeños por hito, con mensaje en español.
- Después de cada hito: correr los tests, probar en el celular o emulador y actualizar la sección "Estado" de este archivo.

## 12. Plan de desarrollo por hitos

1. **Base:** proyecto Expo con TypeScript, expo-router, development build, Drizzle + SQLite, migración inicial, semillas (áreas, hábitos, regla de ejemplo) y pantalla vacía por tab. *Listo cuando:* la app abre en el celular con las 4 pestañas y los datos sembrados.
2. **Dominio:** funciones de la sección 8 con todos sus tests en verde.
3. **Hoy:** apertura, línea de tiempo con me acerca / me aleja, balance, cierre y navegación entre días. *Listo cuando:* se puede registrar un día completo en menos de 2 minutos.
4. **Auto-registro y Patrones:** formulario rápido, pendientes, lista con filtros, reglas con estadísticas e insignia de pensamiento principal.
5. **Hábitos:** CRUD, checks de tres estados, racha flexible, tarjeta de 2 días, vínculos con apertura, cierre y reglas, y recordatorios por hábito.
6. **Jardín:** plantas SVG por etapa e hidratación, raíz firme y detalle de área.
7. **Exportar:** PDF semanal y respaldo/importación JSON.
8. **Build:** APK con EAS (perfil `preview`, `android.buildType: "apk"`) e instalación en el celular.

## 13. Comandos

```bash
npx expo start --dev-client          # desarrollo
npx jest                             # tests de dominio
npx expo run:android                 # build local en dispositivo/emulador
eas build -p android --profile preview   # APK instalable
```

## 14. Roadmap después del MVP

- Jardín de valores editable y metas SMART por fase, con la regla del 80 % para pasar de fase.
- Malezas en el jardín: las reglas verbales más frecuentes aparecen como maleza en el área donde surgen.
- Revisión semanal guiada (domingo) y revisión del jardín cada 6 meses.
- Módulos de finanzas, familia y amigos, ocio y pareja, siguiendo el orden del plan personal.

## 15. Estado

- [x] Hito 1 — Base
- [x] Hito 2 — Dominio
- [x] Hito 3 — Hoy
- [x] Hito 4 — Auto-registro y Patrones
- [x] Hito 5 — Hábitos
- [x] Hito 6 — Jardín
- [x] Hito 7 — Exportar
- [ ] Hito 8 — Build (configurado: `eas.json` perfil `preview` APK y workflow de GitHub Actions; falta el primer build y probar en el celular)

## 16. Notas de implementación

Decisiones tomadas al construir el MVP (mantenerlas salvo que se decida otra cosa):

- **Versiones:** Expo SDK 58, React Native 0.88 (nueva arquitectura, Hermes), React 19.3, TypeScript 6.
  Rutas en `app/` en la raíz. No crear `src/app/`: expo-router la usaría como raíz de rutas.
- **Abrir la base:** `openDatabase()` (`src/db/client.ts`) se llama una vez en `app/_layout.tsx`, abre SQLite,
  aplica las migraciones y deja listo `db` (un proxy sobre Drizzle). Es una sola promesa: React en modo
  estricto ejecuta los efectos dos veces y dos migraciones simultáneas corrompen la apertura.
- **Reactividad:** las lecturas usan `useDbQuery(() => …, deps)` y cada escritura en `src/db/*` llama a
  `notifyDbChange()` (contador en Zustand). Escrituras de texto mientras se escribe usan `{ silent: true }`.
- **Migraciones:** editar `src/db/schema.ts` → `npm run db:generate` → commit de `src/db/migrations/`.
  `SCHEMA_VERSION` (respaldo JSON) = número de migraciones del journal.
- **Zona horaria:** desplazamiento fijo UTC−5 en `src/domain/dates.ts` (Bogotá no tiene horario de verano),
  sin depender de Intl. `occurred_at` se guarda con `-05:00`; `created_at`/`updated_at` en UTC.
- **Racha flexible:** cuenta los periodos cumplidos (hecho o mínimo) de la racha actual; se rompe con dos
  periodos programados seguidos sin cumplir. Hoy sin marcar, la semana en curso sin completar y la semana
  parcial de inicio no cuentan en contra.
- **Jardín:** el crecimiento usa el máximo histórico por área guardado en `settings` (`garden_max:<área>`),
  así nunca retrocede aunque se borre un hábito. "Terreno sin sembrar" = sin hábitos activos y sin
  crecimiento previo. En hábitos de X veces por semana la hidratación prorratea la meta por los días activos.
- **Borradores:** `useDraftState` los guarda en `settings` con claves `draft:*`, que no viajan en el respaldo.
- **Recordatorios:** `src/notifications/`. Cada notificación semanal tiene id `habit:<id>:<día>` y una firma
  en `data.sig`; `syncHabitReminders()` concilia al abrir la app y después de crear, editar, archivar o borrar.
  Los botones "Hecho"/"Mínimo" marcan el día en que se mostró la notificación.
- **Privacidad:** `android.allowBackup = false` (nada se sube a la copia de Google), permisos de
  almacenamiento y ventana flotante bloqueados, sin expo-updates ni analítica.
- **Web solo para pruebas:** sirve para probar flujos en el navegador (Chromium con
  `--enable-features=SharedArrayBuffer`). En pruebas automatizadas conviene anular `Atomics.pause`, porque
  expo-sqlite web corta muy rápido las operaciones síncronas. Notificaciones, PDF y compartir son solo Android.
- **Docs de Expo:** en la sesión en la nube docs.expo.dev no era accesible; las APIs se verificaron contra los
  tipos instalados en `node_modules`. Antes de cambiar de SDK, revisar la documentación de la versión.

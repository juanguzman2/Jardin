# Jardín

App personal (Android, sin internet, sin cuentas) que acompaña un proceso terapéutico con enfoque ACT:
registro diario, auto-registro funcional, patrones pensamiento → acción → refuerzo, hábitos con racha
flexible y un jardín que crece. El contexto completo del producto está en [`CLAUDE.md`](CLAUDE.md).

> No reemplaza la terapia. Todos los datos viven solo en el celular: haz respaldos (Ajustes → Exportar respaldo).

## Instalar en el celular (APK)

### Opción A — EAS Build (recomendada)

Necesitas Node 22 y una cuenta gratuita de Expo. La llave de firma queda guardada en Expo, así que las
actualizaciones se instalan encima sin perder datos.

```bash
npm install
```

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest init
```

```bash
npx eas-cli@latest build -p android --profile preview
```

El APK se compila solo para `arm64-v8a` (todos los celulares Android de los últimos años), lo que reduce
mucho el tiempo de compilación. Al terminar, EAS muestra un enlace y un código QR: ábrelo en el celular, descarga el APK e instálalo
(Android pedirá permitir "instalar apps de fuentes desconocidas").

### Opción B — GitHub Actions

En la pestaña **Actions → APK de Android → Run workflow** se compila un APK y queda como artefacto
descargable. Sin configurar secretos de firma, cada ejecución usa una llave distinta: sirve para probar,
pero para el celular de uso diario configura los secretos `ANDROID_KEYSTORE_BASE64`,
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` y `ANDROID_KEY_PASSWORD` (ver el workflow).

> Cambiar de una opción a otra implica otra llave de firma: Android obliga a desinstalar. Exporta un
> respaldo antes y luego impórtalo.

## Desarrollo

```bash
npm install
```

```bash
npm test
```

```bash
npm run typecheck
```

Para correr la app en el celular durante el desarrollo se usa un development build
(`eas build --profile development` o `npx expo run:android`) y luego:

```bash
npm start
```

### Base de datos

El esquema está en `src/db/schema.ts`. Cada cambio de esquema necesita una migración nueva:

```bash
npm run db:generate
```

### Probar en el navegador (solo desarrollo)

`npm run web` abre la app en el navegador con SQLite en WebAssembly. Chromium necesita
`--enable-features=SharedArrayBuffer`. Las notificaciones, el PDF y compartir solo funcionan en Android.

## Estructura

```
app/            rutas (expo-router): pestañas Hoy, Hábitos, Registro, Patrones y pantallas de detalle
src/domain/     lógica pura con tests (rachas, jardín, reglas, pendientes, fechas)
src/db/         esquema Drizzle, migraciones, semillas y acceso a datos
src/features/   pantallas y componentes por sección
src/notifications/  recordatorios por hábito
src/export/     PDF para la psicóloga y respaldo JSON
src/ui/         componentes compartidos y tema
src/copy/es.ts  todos los textos visibles
```

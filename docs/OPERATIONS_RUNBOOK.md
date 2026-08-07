# Chetesaí Fitness+ — Runbook de producción

## Arquitectura estable

- Código: GitHub `Raymonchu48/chetesai`
- Producción: rama `main`
- Recuperación v1.0.0: `release/v1.0.0`
- Hosting: Vercel
- Dominio: `chetesaifitness.com`
- Base de datos y autenticación: Supabase
- Correo transaccional: Resend

## Regla de oro

No modificar `main` directamente. Todo cambio debe seguir este flujo:

1. Crear rama `feature/*`, `fix/*` o `chore/*` desde `main`.
2. Hacer el cambio.
3. Abrir Pull Request contra `main`.
4. Esperar a que Vercel Preview quede en verde.
5. Probar la funcionalidad afectada.
6. Fusionar mediante `Squash and merge`.
7. Verificar producción en `chetesaifitness.com`.

## Checklist mensual

- [ ] Abrir la portada en ordenador, tablet y móvil.
- [ ] Probar Reserva tu valoración.
- [ ] Probar Ver tarifas.
- [ ] Probar acceso administrador y acceso cliente.
- [ ] Probar envío de correo.
- [ ] Comprobar eventos y recordatorios.
- [ ] Comprobar informes y exportación Excel.
- [ ] Revisar Vercel por errores de despliegue.
- [ ] Revisar Supabase por errores o límites de uso.
- [ ] Ejecutar un backup manual cifrado.
- [ ] Revisar dependencias antes de actualizar paquetes importantes.

## Variables sensibles

Las claves y secretos deben existir únicamente en variables de entorno de Vercel, Supabase o GitHub Secrets. Nunca deben escribirse en el repositorio.

Revisar especialmente:

- Supabase URL y claves.
- Service role de Supabase.
- Resend API key.
- CRON_SECRET.
- Credenciales de base de datos.

## Recuperación rápida de la aplicación

Si una versión nueva rompe producción:

1. No borrar datos de Supabase.
2. Verificar primero si el problema es de despliegue o de base de datos.
3. Volver temporalmente al código conocido de `release/v1.0.0` si es necesario.
4. Crear una rama de corrección desde `main` o desde el punto estable.
5. Validar en Vercel Preview.
6. Fusionar la corrección mediante PR.

Nunca forzar `main` hacia atrás salvo emergencia extrema y con una copia de seguridad confirmada.

## Punto estable v1.0.0

Commit de aplicación:

`dd4cef265c9cc028e8105dcec9eb8dccf66bc3ed`

Rama:

`release/v1.0.0`

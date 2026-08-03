# Consolidación y salida a producción · Chetesaí Fitness+

## 1. Revisión responsive

Comprobar en el Preview de `feature/payments-memberships`:

| Dispositivo | Resolución de referencia | Validación |
|---|---:|---|
| Móvil compacto | 390 × 844 | Menú hamburguesa, formularios a una columna, botones sin cortes, tablas con desplazamiento horizontal |
| Tablet vertical | 768 × 1024 | Menú lateral accesible, métricas a dos columnas, modales centrados y sin desbordamiento |
| Tablet horizontal | 1024 × 768 | Dashboard, agenda e informes sin superposición del menú |
| Escritorio | 1440 × 900 | Menú colapsable, gráficos y tablas con ancho completo |

Rutas prioritarias: `/`, `/dashboard`, `/clientes`, `/sesiones`, `/pagos`, `/informes`, `/portal`, `/portal/citas`, `/portal/pagos`.

## 2. Exportación Excel

En `/informes`:

1. Seleccionar un periodo con movimientos.
2. Pulsar **Exportar Excel**.
3. Confirmar descarga con extensión `.xlsx`.
4. Abrir en Excel y comprobar las hojas `Resumen` y `Movimientos`.
5. Verificar importes en formato EUR, acentos correctos, filtros y cabeceras.

## 3. Matriz de permisos

### Administrador / profesional

Debe poder acceder a:

- `/dashboard`
- `/clientes`
- `/ejercicios`
- `/rutinas`
- `/progreso`
- `/nutricion`
- `/sesiones`
- `/pagos`
- `/informes`
- APIs profesionales bajo `/api/dashboard`, `/api/clientes`, `/api/ejercicios`, `/api/rutinas`, `/api/progreso`, `/api/nutricion`, `/api/sesiones`, `/api/pagos`, `/api/bonos` y `/api/informes`.

No debe entrar en `/portal`; se redirige a `/dashboard`. Las APIs `/api/portal/*` deben responder `403`.

### Cliente

Debe poder acceder a:

- `/portal`
- `/portal/citas`
- `/portal/progreso`
- `/portal/nutricion`
- `/portal/pagos`
- APIs `/api/portal/*`.

No debe poder acceder a las rutas profesionales. La navegación debe redirigir a `/portal` y las APIs profesionales deben responder `403`.

### Sin sesión

- Las páginas privadas redirigen a `/login`.
- Las APIs privadas responden `401`.
- La portada y `POST /api/reservas` continúan siendo públicos.

## 4. Preparación de producción

Antes de fusionar a `main`:

- Todas las migraciones de `supabase/migrations` ejecutadas en Supabase.
- Variables de Vercel disponibles en **Production** y **Preview**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `BOOKING_FROM_EMAIL`
  - `BOOKING_REPLY_TO`
- Dominio de Resend `chetesaifitness.com` verificado.
- Preview de la rama con estado **Ready**.
- Pruebas de administrador y cliente completadas.

## 5. Despliegue estable

1. Fusionar el PR de `feature/payments-memberships` hacia `main` mediante **squash**.
2. Esperar a que Vercel marque el despliegue de Production como **Ready**.
3. Confirmar los dominios `chetesaifitness.com` y `www.chetesaifitness.com` asociados a Production.
4. Probar portada, acceso profesional, acceso cliente, reserva pública, correo, pago e informe Excel.
5. Mantener el despliegue Preview anterior como referencia temporal hasta completar la comprobación.

## 6. Criterio de rollback

Si falla autenticación, reservas, cobros o acceso a datos, restaurar el despliegue Production anterior desde Vercel y mantener la rama sin eliminar hasta corregir el incidente.

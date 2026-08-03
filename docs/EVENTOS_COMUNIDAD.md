# Eventos y comunidad · Chetesaí Fitness+

## Instalación en Supabase

Ejecutar en **SQL Editor**, por este orden:

1. `supabase/migrations/20260803_create_events_community.sql`
2. `supabase/migrations/20260803_fix_event_registration_rpc.sql`
3. `supabase/migrations/20260803_add_automatic_event_reminders.sql`

La primera migración crea:

- `eventos`
- `inscripciones_eventos`
- `eventos_comunicaciones`
- `preferencias_comunicacion`
- políticas RLS
- funciones de inscripción y cancelación

La segunda migración refuerza la autorización de las funciones RPC y evita duplicidades.

La tercera añade una clave estable a cada recordatorio para impedir que un cliente reciba dos veces el mismo aviso.

## Panel profesional

Ruta: `/eventos`

Funciones:

- crear evento como borrador;
- editar datos, aforo, precio, ubicación e imagen;
- publicar y enviar invitaciones a clientes activos;
- reenviar invitaciones;
- enviar recordatorios manuales a inscritos confirmados;
- consultar confirmados y lista de espera;
- cancelar un evento y notificar a los inscritos.

## Portal cliente

Ruta: `/portal/eventos`

Funciones:

- consultar próximos eventos;
- reservar plaza;
- entrar automáticamente en lista de espera cuando no hay aforo;
- cancelar una inscripción;
- promoción automática de la primera persona en espera cuando se libera una plaza;
- gestionar preferencias de invitaciones y recordatorios.

## Recordatorios automáticos

El sistema revisa los eventos una vez al día y envía:

- un aviso entre cinco y siete días antes, identificado como `recordatorio_7d`;
- un aviso el día anterior, con recuperación el mismo día si fuese necesario, identificado como `recordatorio_1d`.

Solo se envían a clientes con inscripción `confirmada` y con `recordatorios_email` activado.

El cron está configurado en `vercel.json`:

```text
GET /api/cron/eventos-recordatorios
```

Para activarlo en producción, añadir en Vercel:

```text
CRON_SECRET=<cadena aleatoria de al menos 16 caracteres>
```

Vercel ejecuta el cron diariamente a las `07:00 UTC`. En Mallorca será aproximadamente a las 08:00 en invierno y a las 09:00 en verano.

Los cron de Vercel solo funcionan en despliegues Production.

La configuración detallada está en:

```text
docs/EVENTOS_RECORDATORIOS_AUTOMATICOS.md
```

## Correos

Usa las variables ya configuradas:

- `RESEND_API_KEY`
- `BOOKING_FROM_EMAIL`
- `BOOKING_REPLY_TO`

Variable nueva:

- `CRON_SECRET`

Los envíos masivos usan lotes de hasta 100 destinatarios. Cada envío queda registrado en `eventos_comunicaciones`.

## Prueba recomendada

1. Ejecutar las tres migraciones.
2. Crear un evento con aforo 1.
3. Publicarlo y comprobar la invitación por correo.
4. Entrar como cliente y reservar la plaza.
5. Entrar con un segundo cliente y comprobar la lista de espera.
6. Cancelar la primera inscripción.
7. Verificar que el segundo cliente pasa a confirmado y recibe el correo.
8. Crear un evento a siete días o a un día de distancia.
9. Con sesión profesional abierta, ejecutar:

```text
POST /api/cron/eventos-recordatorios
```

10. Confirmar el correo y comprobar `eventos_comunicaciones.clave`.

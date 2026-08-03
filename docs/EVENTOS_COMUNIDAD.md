# Eventos y comunidad · Chetesaí Fitness+

## Instalación en Supabase

Ejecutar en **SQL Editor**, por este orden:

1. `supabase/migrations/20260803_create_events_community.sql`
2. `supabase/migrations/20260803_fix_event_registration_rpc.sql`

La primera migración crea:

- `eventos`
- `inscripciones_eventos`
- `eventos_comunicaciones`
- `preferencias_comunicacion`
- políticas RLS
- funciones de inscripción y cancelación

La segunda migración refuerza la autorización de las funciones RPC y evita duplicidades.

## Panel profesional

Ruta: `/eventos`

Funciones:

- crear evento como borrador;
- editar datos, aforo, precio, ubicación e imagen;
- publicar y enviar invitaciones a clientes activos;
- reenviar invitaciones;
- enviar recordatorios a inscritos confirmados;
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

## Correos

Usa las variables ya configuradas:

- `RESEND_API_KEY`
- `BOOKING_FROM_EMAIL`
- `BOOKING_REPLY_TO`

Los envíos masivos usan lotes de hasta 100 destinatarios. Cada envío queda registrado en `eventos_comunicaciones`.

## Prueba recomendada

1. Crear un evento con aforo 1.
2. Publicarlo y comprobar la invitación por correo.
3. Entrar como cliente y reservar la plaza.
4. Entrar con un segundo cliente y comprobar la lista de espera.
5. Cancelar la primera inscripción.
6. Verificar que el segundo cliente pasa a confirmado y recibe el correo.
7. Enviar un recordatorio desde el panel profesional.
8. Desactivar invitaciones desde el portal y confirmar que las preferencias quedan guardadas.

# Recordatorios automáticos de eventos

## Funcionamiento

El sistema revisa diariamente los eventos publicados o completos y envía correos únicamente a clientes con plaza confirmada y con los recordatorios activados.

Se generan dos avisos independientes:

- `recordatorio_7d`: entre cinco y siete días antes del evento. El margen permite reintentar si el primer envío falla.
- `recordatorio_1d`: el día anterior o, como recuperación, el mismo día si el envío anterior falló.

Cada aviso queda registrado en `eventos_comunicaciones.clave`. La combinación de evento, cliente y clave es única para impedir duplicados permanentes.

## Migración adicional de Supabase

Después de las migraciones principales del módulo, ejecutar:

```text
supabase/migrations/20260803_add_automatic_event_reminders.sql
```

Orden completo:

1. `20260803_create_events_community.sql`
2. `20260803_fix_event_registration_rpc.sql`
3. `20260803_add_automatic_event_reminders.sql`

## Variable de Vercel

Añadir en Vercel, al menos para Production:

```text
CRON_SECRET=<cadena aleatoria de al menos 16 caracteres>
```

Vercel enviará automáticamente este valor en la cabecera:

```text
Authorization: Bearer <CRON_SECRET>
```

No guardar el secreto en GitHub.

## Programación

`vercel.json` registra una ejecución diaria:

```json
{
  "crons": [
    {
      "path": "/api/cron/eventos-recordatorios",
      "schedule": "0 7 * * *"
    }
  ]
}
```

La expresión se interpreta en UTC. El trabajo se ejecutará aproximadamente a las 08:00 en invierno y a las 09:00 en verano en Mallorca. En Hobby, Vercel puede desplazarlo dentro de la hora configurada.

Los cron solo se activan en despliegues Production.

## Comprobación manual

Con una sesión de administrador o profesional abierta, se puede ejecutar el mismo proceso mediante:

```text
POST /api/cron/eventos-recordatorios
```

La respuesta indica:

- eventos revisados;
- eventos que requerían aviso;
- correos enviados;
- errores por evento.

Para probarlo, crear un evento publicado a siete días o a un día de distancia, reservar una plaza con un cliente de prueba y ejecutar la ruta manual.

## Seguridad y duplicados

- El `GET` utilizado por Vercel requiere `CRON_SECRET`.
- El `POST` manual exige rol administrador o profesional.
- Se respetan `preferencias_comunicacion.recordatorios_email`.
- Solo reciben correos las inscripciones con estado `confirmada`.
- Supabase impide registrar dos veces la misma clave para el mismo evento y cliente.
- Resend recibe además una clave de idempotencia por lote.

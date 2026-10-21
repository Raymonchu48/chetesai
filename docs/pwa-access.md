# Chetesaí Fitness+ · Acceso como aplicación instalable

La PWA utiliza la **misma web y base de datos**; no duplica los portales.

- El acceso de la aplicación empieza en `/app`, no en la página pública.
- Una sesión activa de `cliente` abre `/portal`.
- Una sesión activa de `administrador` o `profesional` abre `/dashboard`.
- Si la sesión ha caducado, la aplicación muestra `/login` (selector ya existente de Cliente/Profesional).
- El panel profesional existente es adaptable a tablet; la navegación ofrece menú lateral y modo compacto.
- Las credenciales se verifican en el servidor; el selector visual no otorga permisos.
- El Service Worker no almacena páginas autenticadas ni respuestas de API; la gestión exige conexión.

## Instalación

En Android/Chrome: abrir la web, opción del navegador **Instalar aplicación**. En iOS/iPadOS/Safari: **Compartir → Añadir a pantalla de inicio**. El icono abre `/app`.

## Seguridad antes de dar acceso a otros profesionales

Los roles `administrador` y `profesional` ya existen en el proyecto. **No invitar nuevos profesionales hasta auditar** el acceso a clientes, pagos, informes y el esquema RLS de `profiles`. En particular, confirmar que un usuario autenticado no puede modificar las columnas `role` ni `activo` mediante la API de Supabase; la política de actualización del perfil requiere una restricción de privilegios a nivel columna o una RPC controlada. Implantar permisos por profesional y asignación de clientes antes de operar con varios profesionales independientes.

## Validación pendiente antes de producción

1. Comprobar `/manifest.webmanifest`, ambos PNG y `/sw.js` por HTTPS en producción.
2. Probar instalación en Android, iPhone y iPad; iniciar con sesión abierta y cerrada.
3. Verificar que cliente no accede a `/dashboard` ni `/api/dashboard`.
4. Verificar que profesional no accede a `/portal` ni APIs privadas del cliente.
5. Verificar flujo de recuperación de sesión (token renovado) y cierre de sesión.
6. Ejecutar build y pruebas de responsive en tablet antes de fusionar.

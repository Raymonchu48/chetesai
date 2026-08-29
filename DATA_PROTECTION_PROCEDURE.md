# Procedimiento de protección de datos

## Consentimiento

- Los datos de salud y las fotografías de progreso requieren decisiones separadas, explícitas y sin opciones premarcadas.
- Cada cambio queda registrado de forma inmutable con usuario, fecha, versión de política y huella del texto aceptado.
- El cliente puede retirar cualquiera de los consentimientos desde **Portal > Privacidad**. La retirada bloquea nuevos tratamientos, pero no impide borrar datos ya existentes.

## Acceso y portabilidad

1. El cliente autenticado descarga una exportación JSON desde **Portal > Privacidad**.
2. La exportación incluye cuenta, ficha, mediciones, hábitos, sesiones, pagos, bonos, planes, rutinas, consentimientos, solicitudes y el inventario de fotografías.
3. La descarga se registra como solicitud completada y se entrega sin caché del navegador.

## Supresión

1. El cliente presenta la solicitud autenticada en **Portal > Privacidad**.
2. El equipo la revisa en **Protección de datos** y comprueba si existen obligaciones fiscales, contractuales o de seguridad que exijan conservar parte de la información.
3. El operador elimina primero los objetos del bucket privado `progress-photos`, después los datos personales no sujetos a conservación y finalmente la cuenta de Auth cuando proceda.
4. Los documentos que deban conservarse se bloquean para otros usos y se eliminan al vencer el plazo legal.
5. La resolución se documenta con una nota, se comunica al cliente y se completa en un máximo de un mes, salvo ampliación legal justificada.

## Copias y restauración

- GitHub Actions ejecuta cada domingo a las 02:23 UTC una copia cifrada de PostgreSQL y del bucket privado `progress-photos`.
- El artefacto usa AES-256-CBC con PBKDF2, se valida tras cifrarlo y se conserva 30 días.
- El repositorio debe tener los secretos `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `BACKUP_ENCRYPTION_PASSWORD`.
- Trimestralmente se restaura la copia más reciente en un entorno aislado, se verifica el listado con `pg_restore --list` y se comparan las fotografías con `storage-sha256.txt`.
- Nunca se descargan copias en equipos personales ni se comparten contraseñas de cifrado por correo o mensajería.

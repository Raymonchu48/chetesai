# Backup y recuperación — Chetesaí Fitness+

## Objetivo

Separar dos riesgos distintos:

1. **Código**: protegido por GitHub, historial de commits y la rama `release/v1.0.0`.
2. **Datos**: clientes, reservas, pagos, eventos y demás información almacenada en Supabase.

El código puede reconstruirse desde GitHub. Los datos necesitan copias específicas.

## Backup recomendado

### Frecuencia
- Manual cifrado: al menos 1 vez al mes.
- Adicional: antes de migraciones importantes o cambios de base de datos.

### Dónde guardar
- GitHub Actions puede generar un backup cifrado como artefacto temporal.
- Conservar además una copia externa segura fuera del repositorio.
- No guardar archivos SQL sin cifrar en el repositorio.

## GitHub Secrets necesarios para el backup manual

Configurar en:

`Repository → Settings → Secrets and variables → Actions`

Crear:

- `SUPABASE_DB_URL`: cadena de conexión PostgreSQL de Supabase.
- `BACKUP_ENCRYPTION_PASSWORD`: contraseña larga y exclusiva para cifrar la copia.

No escribir estos valores en archivos del repositorio.

## Ejecución del backup

1. Ir a `Actions` en GitHub.
2. Abrir `Manual encrypted database backup`.
3. Pulsar `Run workflow`.
4. Esperar a que termine en verde.
5. Descargar el artefacto cifrado.
6. Guardarlo en una ubicación externa segura.

## Restauración

La restauración no debe ejecutarse automáticamente.

Antes de restaurar:

- confirmar que el backup corresponde al entorno correcto;
- conservar una copia del estado actual;
- comprobar qué migraciones se han aplicado después del backup;
- restaurar primero en un entorno de prueba cuando sea posible.

Una restauración PostgreSQL puede sobrescribir datos. No ejecutar `psql` o `pg_restore` contra producción sin verificar previamente el archivo y la fecha.

## Prueba de recuperación

Una copia que nunca se ha probado es una esperanza con extensión `.gz`.

Cada 3–6 meses:

1. Descargar un backup cifrado.
2. Descifrarlo localmente en un entorno seguro.
3. Verificar que `pg_restore --list` puede leer el archivo.
4. No subir el archivo descifrado a GitHub ni a servicios públicos.

## Recuperación del código v1.0.0

Punto conocido estable:

- Rama: `release/v1.0.0`
- Commit: `dd4cef265c9cc028e8105dcec9eb8dccf66bc3ed`

Esta rama sirve como referencia de recuperación de la aplicación; no sustituye un backup de Supabase.

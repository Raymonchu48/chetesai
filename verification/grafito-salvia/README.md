# Panel profesional: Grafito y salvia

Cambio limitado a `src/components/professional-panel.css` y `src/app/dashboard/page.tsx`.

## Paleta

| Uso | Color |
| --- | --- |
| Fondo | #E9ECE8 |
| Sidebar y cabecera móvil | #303B36 |
| Tarjetas y ventanas | #F7F8F5 |
| Acento | #78977D |
| Texto | #26342D |
| Secundario decorativo y bordes de campos | #728278 |

El secundario aprobado da 3,80:1 sobre tarjeta, insuficiente para texto pequeño. Por eso el texto secundario usa #53655A (5,83:1 sobre tarjeta y 5,22:1 sobre fondo). Los enlaces y etiquetas salvia usan #46624F para lectura. El texto de los botones salvia usa #15231B (5,06:1). El texto principal sobre fondo da 10,94:1. El menú secundario usa #CAD4CB sobre grafito (7,64:1).

Se elimina el degradado verde brillante. Se mantienen rojos y ámbar de avisos, incluyendo bordes de tarjetas con cobros pendientes. El alcance depende de `.professional-panel`; los portales de diálogos heredan la paleta solo mientras ese panel está montado. No cambian logotipos, textos, datos, navegación, roles ni código del portal cliente.

## Adaptación

El dashboard usa columnas con mínimo cero también en móvil: evita que el contenido de las tarjetas y la anchura mínima del gráfico ensanchen el panel. El gráfico conserva su desplazamiento horizontal interior. El espaciado exterior se reduce a 16 px en móvil, manteniendo los tamaños superiores.

## Verificación

Dependencias instaladas con `npm ci --ignore-scripts --no-audit --no-fund`, respetando package-lock.json. No se modifican dependencias.

- `tsc --noEmit --skipLibCheck`: correcto.
- Construcción Next.js de producción con DISABLE_OPENNEXT=true y NEXT_TELEMETRY_DISABLED=1: correcta, incluido el ajuste responsive (46 páginas estáticas generadas, código de salida 0).
- Revisión Chromium de la página real de producción con una sesión local simulada y respuesta `/api/dashboard` de muestra. No se utilizan credenciales ni datos reales y no se modifican los mecanismos de acceso del producto.

Las capturas y results.json documentan las comprobaciones visuales finales. Los datos mostrados son ficticios. Esta revisión verifica presentación, no constituye una prueba de las integraciones ni de operaciones sobre datos reales.

| Vista | Tamaño | Desbordamiento de página/panel | Resultado |
| --- | --- | --- | --- |
| Móvil | 390 × 844 | No / No | Correcto |
| Tablet | 768 × 1024 | No / No | Correcto |
| Escritorio | 1440 × 1000 | No / No | Correcto |

Se verifican los colores calculados de fondo, tarjetas y sidebar, los 11 enlaces del menú, la ruta del logotipo y la apertura/cierre del menú móvil. No se registraron errores JavaScript de página. Al retirar la clase del panel, sus variables dejan de aplicarse incluso conservando la hoja de estilos cargada.

La compilación emite un aviso de Better Auth porque esta revisión local no tiene un secreto real configurado; no impide la construcción. No se añaden ni cambian credenciales.

- [Escritorio](desktop.png)
- [Tablet](tablet.png)
- [Móvil](mobile.png)
- [Menú móvil](mobile-menu.png)
- [Mediciones automáticas](results.json)
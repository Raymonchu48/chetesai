type FinancialWorkbookData = {
  periodo: { desde: string; hasta: string };
  resumen: {
    facturado: number;
    cobrado: number;
    pendiente: number;
    vencido: number;
    ticket_medio: number;
    tasa_cobro_pct: number;
    operaciones_cobradas: number;
    bonos_vendidos: number;
    renovaciones: number;
    sesiones_consumidas: number;
    sesiones_realizadas: number;
    no_asistencias: number;
  };
  meses: Array<{
    etiqueta: string;
    facturado: number;
    cobrado: number;
    pendiente: number;
    bonos: number;
    sesiones_consumidas: number;
    sesiones_realizadas: number;
  }>;
  metodos_pago: Array<{ metodo: string; operaciones: number; importe: number }>;
  planes: Array<{ nombre: string; modalidad: string; unidades: number; importe: number; renovaciones: number }>;
  clientes: Array<{ nombre: string; operaciones: number; importe: number }>;
  movimientos: Array<{
    fecha_emision: string;
    fecha_vencimiento: string | null;
    fecha_pago: string | null;
    cliente: string;
    email: string | null;
    concepto: string;
    estado: string;
    metodo_pago: string | null;
    importe_eur: number;
    referencia: string | null;
  }>;
};

type ZipEntry = { name: string; data: Uint8Array; crc: number; offset: number };

const encoder = new TextEncoder();

function xml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function bytes(value: string) {
  return encoder.encode(value);
}

function join(parts: Uint8Array[]) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function u16(value: number) {
  return new Uint8Array([value & 255, (value >>> 8) & 255]);
}

function u32(value: number) {
  return new Uint8Array([
    value & 255,
    (value >>> 8) & 255,
    (value >>> 16) & 255,
    (value >>> 24) & 255,
  ]);
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function makeZip(files: Array<{ name: string; content: string }>) {
  const localParts: Uint8Array[] = [];
  const entries: ZipEntry[] = [];
  const stamp = dosDateTime();
  let offset = 0;

  for (const file of files) {
    const name = bytes(file.name);
    const data = bytes(file.content);
    const crc = crc32(data);
    const header = join([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(stamp.time),
      u16(stamp.date),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
    ]);
    localParts.push(header, data);
    entries.push({ name: file.name, data, crc, offset });
    offset += header.length + data.length;
  }

  const centralParts: Uint8Array[] = [];
  for (const entry of entries) {
    const name = bytes(entry.name);
    centralParts.push(join([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(stamp.time),
      u16(stamp.date),
      u32(entry.crc),
      u32(entry.data.length),
      u32(entry.data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(entry.offset),
      name,
    ]));
  }

  const local = join(localParts);
  const central = join(centralParts);
  const end = join([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(central.length),
    u32(local.length),
    u16(0),
  ]);
  return join([local, central, end]);
}

function columnName(index: number) {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function cell(row: number, column: number, value: unknown, style = 0) {
  const reference = `${columnName(column)}${row}`;
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${reference}" s="${style}"><v>${value}</v></c>`;
  }
  const text = xml(value);
  const preserve = /^\s|\s$/.test(String(value ?? "")) ? ' xml:space="preserve"' : "";
  return `<c r="${reference}" t="inlineStr" s="${style}"><is><t${preserve}>${text}</t></is></c>`;
}

function row(index: number, values: Array<{ value: unknown; style?: number }>, startColumn = 0, height?: number) {
  const cells = values.map((item, offset) => cell(index, startColumn + offset, item.value, item.style || 0)).join("");
  return `<row r="${index}"${height ? ` ht="${height}" customHeight="1"` : ""}>${cells}</row>`;
}

function sheetXml(rows: string[], columns: number[], merges: string[] = [], autoFilter?: string, freezeRow?: number) {
  const cols = columns.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("");
  const pane = freezeRow ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${freezeRow}" topLeftCell="A${freezeRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` : `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${pane}
<sheetFormatPr defaultRowHeight="15"/>
<cols>${cols}</cols>
<sheetData>${rows.join("")}</sheetData>
${merges.length ? `<mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>` : ""}
${autoFilter ? `<autoFilter ref="${autoFilter}"/>` : ""}
<pageMargins left="0.35" right="0.35" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
</worksheet>`;
}

const methodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  bizum: "Bizum",
  domiciliacion: "Domiciliación",
  otro: "Otro",
  sin_especificar: "Sin especificar",
};

const stateLabels: Record<string, string> = {
  pagado: "Pagado",
  pendiente: "Pendiente",
  vencido: "Vencido",
  anulado: "Anulado",
};

export function buildFinancialXlsx(data: FinancialWorkbookData) {
  const summaryRows: string[] = [];
  summaryRows.push(row(1, [{ value: "Informe financiero · Chetesaí Fitness+", style: 1 }], 0, 30));
  summaryRows.push(row(2, [
    { value: "Periodo", style: 3 },
    { value: data.periodo.desde },
    { value: data.periodo.hasta },
  ]));
  summaryRows.push(row(4, [{ value: "Resumen del periodo", style: 2 }], 0, 23));
  summaryRows.push(row(5, [
    { value: "Facturado", style: 3 }, { value: data.resumen.facturado, style: 4 },
    { value: "Cobrado", style: 3 }, { value: data.resumen.cobrado, style: 4 },
    { value: "Pendiente", style: 3 }, { value: data.resumen.pendiente, style: 4 },
    { value: "Vencido", style: 3 }, { value: data.resumen.vencido, style: 4 },
    { value: "Ticket medio", style: 3 }, { value: data.resumen.ticket_medio, style: 4 },
  ]));
  summaryRows.push(row(6, [
    { value: "Operaciones cobradas", style: 3 }, { value: data.resumen.operaciones_cobradas, style: 5 },
    { value: "Tasa de cobro", style: 3 }, { value: data.resumen.tasa_cobro_pct / 100, style: 6 },
    { value: "Bonos vendidos", style: 3 }, { value: data.resumen.bonos_vendidos, style: 5 },
    { value: "Renovaciones", style: 3 }, { value: data.resumen.renovaciones, style: 5 },
    { value: "No asistencias", style: 3 }, { value: data.resumen.no_asistencias, style: 5 },
  ]));
  summaryRows.push(row(8, [{ value: "Evolución mensual", style: 2 }], 0, 23));
  summaryRows.push(row(9, [
    { value: "Mes", style: 7 },
    { value: "Facturado", style: 7 },
    { value: "Cobrado", style: 7 },
    { value: "Pendiente", style: 7 },
    { value: "Bonos", style: 7 },
    { value: "Sesiones consumidas", style: 7 },
    { value: "Sesiones realizadas", style: 7 },
  ]));
  let nextRow = 10;
  for (const month of data.meses) {
    summaryRows.push(row(nextRow, [
      { value: month.etiqueta },
      { value: month.facturado, style: 4 },
      { value: month.cobrado, style: 4 },
      { value: month.pendiente, style: 4 },
      { value: month.bonos, style: 5 },
      { value: month.sesiones_consumidas, style: 5 },
      { value: month.sesiones_realizadas, style: 5 },
    ]));
    nextRow += 1;
  }

  nextRow += 1;
  summaryRows.push(row(nextRow, [{ value: "Formas de pago", style: 2 }], 0, 23));
  nextRow += 1;
  summaryRows.push(row(nextRow, [
    { value: "Método", style: 7 },
    { value: "Operaciones", style: 7 },
    { value: "Importe", style: 7 },
  ]));
  for (const method of data.metodos_pago) {
    nextRow += 1;
    summaryRows.push(row(nextRow, [
      { value: methodLabels[method.metodo] || method.metodo },
      { value: method.operaciones, style: 5 },
      { value: method.importe, style: 4 },
    ]));
  }

  nextRow += 2;
  summaryRows.push(row(nextRow, [{ value: "Bonos vendidos", style: 2 }], 0, 23));
  nextRow += 1;
  summaryRows.push(row(nextRow, [
    { value: "Bono", style: 7 },
    { value: "Modalidad", style: 7 },
    { value: "Unidades", style: 7 },
    { value: "Importe", style: 7 },
    { value: "Renovaciones", style: 7 },
  ]));
  for (const plan of data.planes) {
    nextRow += 1;
    summaryRows.push(row(nextRow, [
      { value: plan.nombre },
      { value: plan.modalidad },
      { value: plan.unidades, style: 5 },
      { value: plan.importe, style: 4 },
      { value: plan.renovaciones, style: 5 },
    ]));
  }

  nextRow += 2;
  summaryRows.push(row(nextRow, [{ value: "Clientes por ingresos", style: 2 }], 0, 23));
  nextRow += 1;
  summaryRows.push(row(nextRow, [
    { value: "Cliente", style: 7 },
    { value: "Operaciones", style: 7 },
    { value: "Importe", style: 7 },
  ]));
  for (const client of data.clientes) {
    nextRow += 1;
    summaryRows.push(row(nextRow, [
      { value: client.nombre },
      { value: client.operaciones, style: 5 },
      { value: client.importe, style: 4 },
    ]));
  }

  const movementRows: string[] = [];
  movementRows.push(row(1, [
    { value: "Fecha emisión", style: 7 },
    { value: "Fecha vencimiento", style: 7 },
    { value: "Fecha pago", style: 7 },
    { value: "Cliente", style: 7 },
    { value: "Email", style: 7 },
    { value: "Concepto", style: 7 },
    { value: "Estado", style: 7 },
    { value: "Método", style: 7 },
    { value: "Importe EUR", style: 7 },
    { value: "Referencia", style: 7 },
  ], 0, 24));
  let movementRow = 2;
  for (const movement of data.movimientos) {
    movementRows.push(row(movementRow, [
      { value: movement.fecha_emision },
      { value: movement.fecha_vencimiento || "" },
      { value: movement.fecha_pago || "" },
      { value: movement.cliente },
      { value: movement.email || "" },
      { value: movement.concepto },
      { value: stateLabels[movement.estado] || movement.estado },
      { value: methodLabels[movement.metodo_pago || "sin_especificar"] || movement.metodo_pago || "" },
      { value: movement.importe_eur, style: 4 },
      { value: movement.referencia || "" },
    ]));
    movementRow += 1;
  }

  const summarySheet = sheetXml(
    summaryRows,
    [24, 16, 16, 16, 16, 20, 20, 16, 18, 16],
    ["A1:J1", "A4:J4", "A8:J8"],
    undefined,
    2
  );
  const movementSheet = sheetXml(
    movementRows,
    [16, 18, 16, 24, 30, 34, 14, 18, 16, 24],
    [],
    `A1:J${Math.max(1, movementRow - 1)}`,
    1
  );

  const created = new Date().toISOString();
  return makeZip([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>Informe financiero Chetesaí Fitness+</dc:title><dc:creator>Chetesaí Fitness+</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created>
</cp:coreProperties>`,
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Chetesaí Fitness+</Application></Properties>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Resumen" sheetId="1" r:id="rId1"/><sheet name="Movimientos" sheetId="2" r:id="rId2"/></sheets>
<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="#.##0,00 [$€-es-ES]"/><numFmt numFmtId="165" formatCode="0,00%"/></numFmts>
<fonts count="4"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="18"/><name val="Aptos Display"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FF1F2D28"/><sz val="11"/><name val="Aptos"/></font></fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF173C34"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFC7A254"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF5EF"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD8E1DC"/></left><right style="thin"><color rgb="FFD8E1DC"/></right><top style="thin"><color rgb="FFD8E1DC"/></top><bottom style="thin"><color rgb="FFD8E1DC"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="8">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="1" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`,
    },
    { name: "xl/worksheets/sheet1.xml", content: summarySheet },
    { name: "xl/worksheets/sheet2.xml", content: movementSheet },
  ]);
}

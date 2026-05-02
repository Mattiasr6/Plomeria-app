import ExcelJS from "exceljs";

interface ExportOrder {
  sheet_number: number | null;
  location: string;
  requested_by: string | null;
  received_by: string | null;
  start_date: string | null;
  end_date: string | null;
  upds_responsible: string | null;
  ramper_responsible: string | null;
  total_labor: number;
}

interface ExportItem {
  description: string;
  unit: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
}

export async function generateWorkOrderExcel(
  order: ExportOrder,
  items: ExportItem[]
): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Plomería App";
  wb.created = new Date();

  const ws = wb.addWorksheet("Planilla", {
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  const border: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  const headerFont: Partial<ExcelJS.Font> = {
    bold: true,
    size: 10,
    name: "Calibri",
  };
  const normalFont: Partial<ExcelJS.Font> = {
    size: 10,
    name: "Calibri",
  };

  // Column widths
  ws.getColumn(1).width = 5;
  ws.getColumn(2).width = 50;
  ws.getColumn(3).width = 12;
  ws.getColumn(4).width = 14;
  ws.getColumn(5).width = 14;

  // Title row
  ws.mergeCells("A1:E1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "PLANILLA DE TRABAJOS DE MANTENIMIENTO BANOS";
  titleCell.font = { bold: true, size: 14, name: "Calibri" };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 30;

  // Blank row
  ws.getRow(2).height = 6;

  // Header data: Location, Sheet #
  const headerData = [
    { label: "Ubicación:", value: order.location || "UPDS" },
    { label: "Planilla N°:", value: order.sheet_number ?? "" },
  ];

  headerData.forEach((item, i) => {
    const rowNum = 3 + i;
    const row = ws.getRow(rowNum);
    const cellA = ws.getCell(`A${rowNum}`);
    const cellB = ws.getCell(`B${rowNum}`);
    cellA.value = item.label;
    cellA.font = headerFont;
    cellA.alignment = { horizontal: "right" };
    cellB.value = item.value;
    cellB.font = normalFont;
    ws.mergeCells(`B${rowNum}:E${rowNum}`);
    row.height = 20;
  });

  // Requested by / Received by
  const row5 = ws.getRow(5);
  const cellA5 = ws.getCell("A5");
  cellA5.value = "Solicitado por:";
  cellA5.font = headerFont;
  cellA5.alignment = { horizontal: "right" };
  const cellB5 = ws.getCell("B5");
  cellB5.value = order.requested_by || "";
  cellB5.font = normalFont;
  ws.mergeCells("B5:C5");
  const cellD5 = ws.getCell("D5");
  cellD5.value = "Recibido por:";
  cellD5.font = headerFont;
  const cellE5 = ws.getCell("E5");
  cellE5.value = order.received_by || "";
  cellE5.font = normalFont;
  row5.height = 20;

  // Dates
  const row6 = ws.getRow(6);
  const cellA6 = ws.getCell("A6");
  cellA6.value = "Fecha Inicio:";
  cellA6.font = headerFont;
  cellA6.alignment = { horizontal: "right" };
  const cellB6 = ws.getCell("B6");
  cellB6.value = order.start_date || "";
  cellB6.font = normalFont;
  ws.mergeCells("B6:C6");
  const cellD6 = ws.getCell("D6");
  cellD6.value = "Fecha Terminado:";
  cellD6.font = headerFont;
  const cellE6 = ws.getCell("E6");
  cellE6.value = order.end_date || "";
  cellE6.font = normalFont;
  row6.height = 20;

  // Blank row before table
  ws.getRow(7).height = 6;

  // === ITEMS TABLE ===
  const tableStart = 8;
  const tableHeaderRow = ws.getRow(tableStart);
  tableHeaderRow.height = 22;

  const headers = ["N°", "Detalle", "Unidad", "Cantidad", "Precio"];
  headers.forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    const cell = ws.getCell(`${col}${tableStart}`);
    cell.value = h;
    cell.font = headerFont;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = border;
  });

  // Items
  let currentRow = tableStart + 1;
  items.forEach((item, idx) => {
    const row = ws.getRow(currentRow);
    row.height = 20;
    const cols = [
      { col: "A", value: idx + 1 },
      { col: "B", value: item.description },
      { col: "C", value: item.unit || "" },
      { col: "D", value: item.quantity },
      { col: "E", value: item.unit_price },
    ];
    cols.forEach(({ col, value }) => {
      const cell = ws.getCell(`${col}${currentRow}`);
      cell.value = value;
      cell.font = normalFont;
      cell.border = border;
      if (col === "D" || col === "E") {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: "right" };
      } else if (col === "A" || col === "C") {
        cell.alignment = { horizontal: "center" };
      }
    });
    // Total in separate column
    const totalCell = ws.getCell(`F${currentRow}`);
    totalCell.value = item.total;
    totalCell.font = normalFont;
    totalCell.numFmt = '#,##0.00';
    totalCell.alignment = { horizontal: "right" };
    totalCell.border = border;
    currentRow++;
  });

  // Total row
  const totalRow = ws.getRow(currentRow);
  totalRow.height = 22;
  ws.mergeCells(`A${currentRow}:D${currentRow}`);
  const totalLabel = ws.getCell(`A${currentRow}`);
  totalLabel.value = "TOTAL MANO DE OBRA";
  totalLabel.font = { bold: true, size: 10, name: "Calibri" };
  totalLabel.alignment = { horizontal: "right", vertical: "middle" };
  totalLabel.border = border;

  const totalValue = ws.getCell(`E${currentRow}`);
  totalValue.value = order.total_labor;
  totalValue.font = { bold: true, size: 10, name: "Calibri" };
  totalValue.numFmt = '#,##0.00';
  totalValue.alignment = { horizontal: "right", vertical: "middle" };
  totalValue.border = border;

  const totalValueF = ws.getCell(`F${currentRow}`);
  totalValueF.value = order.total_labor;
  totalValueF.font = { bold: true, size: 10, name: "Calibri" };
  totalValueF.numFmt = '#,##0.00';
  totalValueF.alignment = { horizontal: "right", vertical: "middle" };
  totalValueF.border = border;

  currentRow += 3;

  // Signature section
  const sigRow1 = ws.getRow(currentRow);
  sigRow1.height = 30;
  const cellD_sig = ws.getCell(`D${currentRow}`);
  cellD_sig.value = "RESPONSABLE UPDS";
  cellD_sig.font = { bold: true, size: 10, name: "Calibri" };
  cellD_sig.alignment = { horizontal: "center", vertical: "bottom" };
  ws.mergeCells(`D${currentRow}:E${currentRow}`);

  const cellA_sig1 = ws.getCell(`A${currentRow}`);
  cellA_sig1.value = "RESPONSABLE RAMPER";
  cellA_sig1.font = { bold: true, size: 10, name: "Calibri" };
  cellA_sig1.alignment = { horizontal: "center", vertical: "bottom" };
  ws.mergeCells(`A${currentRow}:C${currentRow}`);

  currentRow++;
  const sigRow2 = ws.getRow(currentRow);
  sigRow2.height = 6;

  currentRow++;
  const sigRow3 = ws.getRow(currentRow);
  sigRow3.height = 30;
  const cellD_name = ws.getCell(`D${currentRow}`);
  cellD_name.value = order.upds_responsible || "________________________";
  cellD_name.font = normalFont;
  cellD_name.alignment = { horizontal: "center", vertical: "top" };
  ws.mergeCells(`D${currentRow}:E${currentRow}`);
  const cellA_name = ws.getCell(`A${currentRow}`);
  cellA_name.value = order.ramper_responsible || "________________________";
  cellA_name.font = normalFont;
  cellA_name.alignment = { horizontal: "center", vertical: "top" };
  ws.mergeCells(`A${currentRow}:C${currentRow}`);

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

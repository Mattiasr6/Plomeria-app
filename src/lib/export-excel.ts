import ExcelJS from "exceljs";

// --- Types ---

export interface ExportOrder {
  sheet_number: number | null;
  location: string;
  requested_by: string | null;
  received_by: string | null;
  request_date: string | null;
  start_date: string | null;
  end_date: string | null;
  remit_number: string | null;
  description: string;
  total_labor: number;
  total_materials: number;
  grand_total: number;
  observations: string | null;
  upds_responsible: string | null;
  ramper_responsible: string | null;
}

export interface ExportItem {
  description: string;
  unit: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
  item_type?: string;
}

// --- Font helpers ---

const fontCalibri = (size: number, bold = false): Partial<ExcelJS.Font> => ({
  name: "Calibri",
  size,
  bold,
});

const mediumBorderOuter = {
  top: { style: "medium" as const },
  left: { style: "medium" as const },
  bottom: { style: "medium" as const },
  right: { style: "medium" as const },
};

// --- Main function ---

export async function generateWorkOrderExcel(
  order: ExportOrder,
  items: ExportItem[]
): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Plomería App";
  wb.created = new Date();

  const ws = wb.addWorksheet("Hoja1", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      scale: 70,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.71,
        right: 0.71,
        top: 0.75,
        bottom: 0.75,
        header: 0.31,
        footer: 0.31,
      },
    },
  });

  // -- 7 columns: widths match template --
  ws.getColumn(1).width = 15.33; // A
  // B — default width (not set in template)
  ws.getColumn(3).width = 20.98; // C
  ws.getColumn(4).width = 7.93; // D
  ws.getColumn(5).width = 20.45; // E
  ws.getColumn(6).width = 26.1; // F
  ws.getColumn(7).width = 21.12; // G

  // Split items by type
  const laborItems = items.filter((i) => i.item_type === "labor");
  const materialItems = items.filter((i) => i.item_type === "material");

  // Pre-compute totals from actual items (before padding)
  const toNum = (v: string | number | null | undefined): number => Number(v) || 0;
  const itemTotal = (q: string | number | null | undefined, p: string | number | null | undefined): number =>
    toNum(q) * toNum(p);

  const laborTotalValue = laborItems.reduce((sum, i) => sum + itemTotal(i.quantity, i.unit_price), 0);
  const materialTotalValue = materialItems.reduce((sum, i) => sum + itemTotal(i.quantity, i.unit_price), 0);
  const grandTotalValue = laborTotalValue + materialTotalValue;

  // Pad to 6 rows each
  while (laborItems.length < 6) {
    laborItems.push({
      description: "",
      unit: null,
      quantity: null,
      unit_price: null,
      total: null,
    });
  }
  while (materialItems.length < 6) {
    materialItems.push({
      description: "",
      unit: null,
      quantity: null,
      unit_price: null,
      total: null,
    });
  }

  // ──────────────────────────────────────────────────
  // ROW 1: blank (no cells, default height)
  // ──────────────────────────────────────────────────

  // ──────────────────────────────────────────────────
  // ROW 2: Title — merged A2:G2
  // ──────────────────────────────────────────────────
  ws.mergeCells("A2:G2");
  const c2 = ws.getCell("A2");
  c2.value = "PLANILLA DE TRABAJOS DE MANTENIMIENTO BANOS";
  c2.font = fontCalibri(14, true);
  c2.alignment = { horizontal: "left", vertical: "middle" };
  c2.border = mediumBorderOuter;
  ws.getRow(2).height = 19.5;

  // ──────────────────────────────────────────────────
  // ROW 3: Ubicación + Planilla #
  // ──────────────────────────────────────────────────
  const cA3 = ws.getCell("A3");
  cA3.value = "Ubicación :";
  cA3.font = fontCalibri(12);
  cA3.border = {
    left: { style: "medium" },
    right: { style: "thin" },
    top: { style: "medium" },
    bottom: { style: "thin" },
  };

  ws.mergeCells("B3:E3");
  const cB3 = ws.getCell("B3");
  cB3.value = order.location;
  cB3.font = fontCalibri(12);
  cB3.alignment = { horizontal: "left" };
  cB3.border = {
    left: { style: "thin" },
    top: { style: "medium" },
    bottom: { style: "thin" },
  };
  // E3 right thin border (from merge end)
  const cE3 = ws.getCell("E3");
  cE3.border = {
    right: { style: "thin" },
    top: { style: "medium" },
    bottom: { style: "thin" },
  };

  const cF3 = ws.getCell("F3");
  cF3.value = "Planilla #";
  cF3.font = fontCalibri(12);
  cF3.border = {
    left: { style: "thin" },
    right: { style: "thin" },
    top: { style: "medium" },
    bottom: { style: "thin" },
  };

  const cG3 = ws.getCell("G3");
  cG3.value = order.sheet_number ?? "";
  cG3.font = fontCalibri(12);
  cG3.border = {
    left: { style: "thin" },
    right: { style: "medium" },
    top: { style: "medium" },
    bottom: { style: "thin" },
  };

  // ──────────────────────────────────────────────────
  // ROW 4: Solicitado por + Fecha solicitud
  // ──────────────────────────────────────────────────
  const cA4 = ws.getCell("A4");
  cA4.value = "Solicitado por  :";
  cA4.font = fontCalibri(12);
  cA4.border = {
    left: { style: "medium" },
    right: { style: "thin" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };

  ws.mergeCells("B4:C4");
  const cB4 = ws.getCell("B4");
  cB4.value = order.requested_by ?? "";
  cB4.font = fontCalibri(12);
  cB4.alignment = { horizontal: "left" };
  cB4.border = {
    left: { style: "thin" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };
  const cC4 = ws.getCell("C4");
  cC4.border = {
    right: { style: "thin" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };

  ws.mergeCells("D4:G4");
  const d4Text = order.request_date
    ? `Fecha solicitud de trabajo ${order.request_date}`
    : "Fecha solicitud de trabajo";
  const cD4 = ws.getCell("D4");
  cD4.value = d4Text;
  cD4.font = fontCalibri(12);
  cD4.alignment = { horizontal: "center" };
  cD4.border = {
    left: { style: "thin" },
    top: { style: "thin" },
  };
  // G4 right medium, bottom thin
  const cG4 = ws.getCell("G4");
  cG4.border = {
    right: { style: "medium" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };

  // ──────────────────────────────────────────────────
  // ROW 5: Recibido por + Fechas Inicio/Terminado
  // ──────────────────────────────────────────────────
  const cA5 = ws.getCell("A5");
  cA5.value = "Recibido por :";
  cA5.font = fontCalibri(12);
  cA5.border = {
    left: { style: "medium" },
    right: { style: "thin" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };

  ws.mergeCells("B5:C5");
  const cB5 = ws.getCell("B5");
  cB5.value = order.received_by ?? "";
  cB5.font = fontCalibri(12);
  cB5.alignment = { horizontal: "left" };
  cB5.border = {
    left: { style: "thin" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };
  const cC5 = ws.getCell("C5");
  cC5.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
  };

  ws.mergeCells("D5:E5");
  const d5Text = order.start_date
    ? `Fecha Inicio ${order.start_date}`
    : "Fecha Inicio";
  const cD5 = ws.getCell("D5");
  cD5.value = d5Text;
  cD5.font = fontCalibri(12);
  cD5.alignment = { horizontal: "center" };
  cD5.border = {
    left: { style: "thin" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };
  const cE5 = ws.getCell("E5");
  cE5.border = {
    right: { style: "thin" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };

  ws.mergeCells("F5:G5");
  const f5Text = order.end_date
    ? `Fecha terminado : ${order.end_date}`
    : "Fecha terminado :";
  const cF5 = ws.getCell("F5");
  cF5.value = f5Text;
  cF5.font = fontCalibri(12);
  cF5.alignment = { horizontal: "center" };
  cF5.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
  };
  const cG5 = ws.getCell("G5");
  cG5.border = {
    right: { style: "medium" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };

  // ──────────────────────────────────────────────────
  // ROW 6: Remito — merged A6:G6
  // ──────────────────────────────────────────────────
  ws.mergeCells("A6:G6");
  const c6 = ws.getCell("A6");
  const remitText =
    order.remit_number != null
      ? `Corresponde al remito N° ${order.remit_number}`
      : "Corresponde al remito N°";
  c6.value = remitText;
  c6.font = fontCalibri(12);
  c6.border = {
    left: { style: "medium" },
    right: { style: "medium" },
    top: { style: "thin" },
    bottom: { style: "medium" },
  };
  ws.getRow(6).height = 15.75;

  // ──────────────────────────────────────────────────
  // ROW 7: blank spacer
  // ──────────────────────────────────────────────────
  ws.getRow(7).height = 6;

  // ──────────────────────────────────────────────────
  // ROW 8: Descripción header — merged A8:G8
  // ──────────────────────────────────────────────────
  ws.mergeCells("A8:G8");
  const c8 = ws.getCell("A8");
  c8.value = "Descripción del trabajo a realizar";
  c8.font = fontCalibri(14, true);
  c8.alignment = { horizontal: "center", vertical: "middle" };
  // Template has no border on this cell
  ws.getRow(8).height = 19.5;

  // ──────────────────────────────────────────────────
  // ROW 9: Descripción content — merged A9:G9
  // ──────────────────────────────────────────────────
  ws.mergeCells("A9:G9");
  const c9 = ws.getCell("A9");
  c9.value = order.description;
  c9.font = fontCalibri(12);
  c9.alignment = { horizontal: "left", vertical: "middle" };
  c9.border = {
    left: { style: "medium" },
    right: { style: "medium" },
    top: { style: "medium" },
    bottom: { style: "thin" },
  };

  // ──────────────────────────────────────────────────
  // ROWS 10-11: blank merged spacers with thin borders
  // ──────────────────────────────────────────────────
  for (let r of [10, 11]) {
    ws.mergeCells(`A${r}:G${r}`);
    const cell = ws.getCell(`A${r}`);
    cell.font = fontCalibri(12);
    cell.alignment = { horizontal: "left" };
    cell.border = {
      left: { style: "medium" },
      right: { style: "medium" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
  }

  // ──────────────────────────────────────────────────
  // ROWS 12-13: blank cells, thin borders, no merge
  // ──────────────────────────────────────────────────
  for (let r of [12, 13]) {
    for (let c = 1; c <= 7; c++) {
      const letter = String.fromCharCode(64 + c);
      const cell = ws.getCell(`${letter}${r}`);
      if (c === 1) {
        cell.border = {
          left: { style: "medium" },
          top: { style: "thin" },
          bottom: { style: "thin" },
        };
      } else if (c === 7) {
        cell.border = {
          right: { style: "medium" },
          top: { style: "thin" },
        };
      } else {
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
        };
      }
    }
  }

  // ══════════════════════════════════════════════════
  // LABOR SECTION (rows 14-21)
  // ══════════════════════════════════════════════════

  // ─── ROW 14: Labor headers ───
  ws.mergeCells("A14:C14");
  const cA14 = ws.getCell("A14");
  cA14.value = "Detalle Mano de Obra";
  cA14.font = fontCalibri(12, true);
  cA14.alignment = { horizontal: "center" };
  cA14.border = {
    left: { style: "medium" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };
  const cC14 = ws.getCell("C14");
  cC14.border = {
    right: { style: "thin" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };

  const laborHeaderDefs: [string, string][] = [
    ["D14", "Unidad"],
    ["E14", "Cantidad"],
    ["F14", "Precio Unitario"],
    ["G14", "Total (Bs.)"],
  ];
  for (const [addr, label] of laborHeaderDefs) {
    const cell = ws.getCell(addr);
    cell.value = label;
    cell.font = fontCalibri(12, true);
    cell.alignment = { horizontal: "center" };
    if (addr === "D14") {
      cell.border = {
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
    } else if (addr === "G14") {
      cell.border = {
        left: { style: "thin" },
        right: { style: "medium" },
        top: { style: "thin" },
        bottom: { style: "thin" },
      };
    } else if (addr === "F14") {
      cell.border = {
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
    } else {
      cell.border = {
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
    }
  }

  // ─── ROWS 15-20: Labor items ───
  for (let idx = 0; idx < 6; idx++) {
    const r = 15 + idx;
    const item = laborItems[idx];

    ws.mergeCells(`A${r}:C${r}`);
    const cA = ws.getCell(`A${r}`);
    cA.value = item.description || null;
    cA.font = fontCalibri(12);
    cA.alignment = { horizontal: "left", vertical: "middle" };
    cA.border = {
      left: idx === 0 ? { style: "thin" } : { style: "medium" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };

    const cC = ws.getCell(`C${r}`);
    cC.border = {
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };

    const cD = ws.getCell(`D${r}`);
    cD.value = item.unit || null;
    cD.font = fontCalibri(12);
    cD.border = {
      left: { style: "thin" },
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };

    const cE = ws.getCell(`E${r}`);
    cE.value = item.quantity != null ? Number(item.quantity) : null;
    cE.font = fontCalibri(12);
    cE.numFmt = "#,##0.00";
    cE.border = {
      left: { style: "thin" },
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };

    const cF = ws.getCell(`F${r}`);
    cF.value = item.unit_price != null ? Number(item.unit_price) : null;
    cF.font = fontCalibri(12);
    cF.numFmt = "#,##0.00";
    cF.border = {
      left: { style: "thin" },
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };

    const cG = ws.getCell(`G${r}`);
    if (item.quantity != null && item.unit_price != null) {
      cG.value = { formula: `E${r}*F${r}`, result: Number(item.quantity) * Number(item.unit_price) };
    }
    cG.font = fontCalibri(12);
    cG.numFmt = "#,##0.00";
    cG.border = {
      left: { style: "thin" },
      right: { style: "medium" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
  }

  // ─── ROW 21: TOTAL MANO DE OBRA ───
  ws.mergeCells("A21:F21");
  const cA21 = ws.getCell("A21");
  cA21.value = "TOTAL MANO  DE OBRA";
  cA21.font = fontCalibri(12, true);
  cA21.alignment = { horizontal: "right" };
  cA21.border = {
    left: { style: "medium" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };
  // cells B-F merged
  const cG21 = ws.getCell("G21");
  cG21.value = laborTotalValue;
  cG21.font = fontCalibri(12);
  cG21.numFmt = "#,##0.00";
  cG21.border = {
    left: { style: "thin" },
    right: { style: "medium" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };

  // ══════════════════════════════════════════════════
  // MATERIAL SECTION (rows 22-29)
  // ══════════════════════════════════════════════════

  // ─── ROW 22: Material headers ───
  ws.mergeCells("A22:C22");
  const cA22 = ws.getCell("A22");
  cA22.value = "Detalle Materiales";
  cA22.font = fontCalibri(12, true);
  cA22.alignment = { horizontal: "center" };
  cA22.border = {
    left: { style: "medium" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };
  const cC22 = ws.getCell("C22");
  cC22.border = {
    right: { style: "thin" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };

  const matHeaderDefs: [string, string][] = [
    ["D22", "Unidad"],
    ["E22", "Cantidad"],
    ["F22", "Precio Unitario"],
    ["G22", "Total (Bs.)"],
  ];
  for (const [addr, label] of matHeaderDefs) {
    const cell = ws.getCell(addr);
    cell.value = label;
    cell.font = fontCalibri(12, true);
    cell.alignment = { horizontal: "center" };
    cell.border = {
      left: { style: "thin" },
      right: addr === "G22" ? { style: "medium" } : { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
  }

  // ─── ROWS 23-28: Material items ───
  for (let idx = 0; idx < 6; idx++) {
    const r = 23 + idx;
    const item = materialItems[idx];

    ws.mergeCells(`A${r}:C${r}`);
    const cA = ws.getCell(`A${r}`);
    cA.value = item.description || null;
    cA.font = fontCalibri(11);
    cA.alignment = { horizontal: "left" };
    cA.border = {
      left: { style: "medium" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };

    const cC = ws.getCell(`C${r}`);
    cC.border = {
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };

    const cD = ws.getCell(`D${r}`);
    cD.value = item.unit || null;
    cD.font = fontCalibri(12);
    cD.border = {
      left: { style: "thin" },
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };

    const cE = ws.getCell(`E${r}`);
    cE.value = item.quantity != null ? Number(item.quantity) : null;
    cE.font = fontCalibri(12);
    cE.numFmt = "#,##0.00";
    cE.border = {
      left: { style: "thin" },
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };

    const cF = ws.getCell(`F${r}`);
    cF.value = item.unit_price != null ? Number(item.unit_price) : null;
    cF.font = fontCalibri(12);
    cF.numFmt = "#,##0.00";
    cF.border = {
      left: { style: "thin" },
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };

    const cG = ws.getCell(`G${r}`);
    if (item.quantity != null && item.unit_price != null) {
      cG.value = { formula: `E${r}*F${r}`, result: Number(item.quantity) * Number(item.unit_price) };
    }
    cG.font = fontCalibri(12);
    cG.numFmt = "#,##0.00";
    cG.border = {
      left: { style: "thin" },
      right: { style: "medium" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
  }

  // ─── ROW 29: TOTAL MATERIAL ───
  ws.mergeCells("A29:F29");
  const cA29 = ws.getCell("A29");
  cA29.value = "TOTAL MATERIAL";
  cA29.font = fontCalibri(12, true);
  cA29.alignment = { horizontal: "right" };
  cA29.border = {
    left: { style: "medium" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };

  const cG29 = ws.getCell("G29");
  cG29.value = materialTotalValue;
  cG29.font = fontCalibri(12);
  cG29.numFmt = "#,##0.00";
  cG29.border = {
    left: { style: "thin" },
    right: { style: "medium" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };

  // ─── ROW 30: Total Global ───
  ws.mergeCells("A30:F30");
  const cA30 = ws.getCell("A30");
  cA30.value = "Total Global (Bs.)";
  cA30.font = fontCalibri(12, true);
  cA30.alignment = { horizontal: "right" };
  cA30.border = {
    left: { style: "medium" },
    top: { style: "thin" },
    bottom: { style: "medium" },
  };

  const cG30 = ws.getCell("G30");
  cG30.value = grandTotalValue;
  cG30.font = fontCalibri(12, true);
  cG30.numFmt = "#,##0.00";
  cG30.border = {
    left: { style: "thin" },
    right: { style: "medium" },
    top: { style: "thin" },
    bottom: { style: "medium" },
  };
  ws.getRow(30).height = 15.75;

  // ══════════════════════════════════════════════════
  // OBSERVATIONS (rows 31-35)
  // ══════════════════════════════════════════════════

  // ROW 31: spacer with medium top border
  for (let c = 1; c <= 7; c++) {
    const letter = String.fromCharCode(64 + c);
    const cell = ws.getCell(`${letter}31`);
    cell.border = { top: { style: "medium" } };
  }

  // ROW 32: Observaciones header
  ws.mergeCells("A32:G32");
  const c32 = ws.getCell("A32");
  c32.value = "Observaciones :";
  c32.font = fontCalibri(14, true);
  c32.alignment = { horizontal: "left" };
  c32.border = { bottom: { style: "medium" } };
  ws.getRow(32).height = 19.5;

  // ROWS 33-35: observations text area
  for (let r = 33; r <= 35; r++) {
    ws.mergeCells(`A${r}:G${r}`);
    const cell = ws.getCell(`A${r}`);
    if (r === 33 && order.observations) {
      cell.value = order.observations;
    }
    cell.font = fontCalibri(12);
    cell.alignment = { wrapText: true };

    if (r === 33) {
      cell.border = {
        left: { style: "medium" },
        right: { style: "medium" },
        top: { style: "medium" },
        bottom: { style: "thin" },
      };
    } else {
      cell.border = {
        left: { style: "medium" },
        right: { style: "medium" },
        top: { style: "thin" },
        bottom: { style: "thin" },
      };
    }
  }

  // ══════════════════════════════════════════════════
  // SIGNATURE SECTION (rows 36-44)
  // ══════════════════════════════════════════════════

  if (order.upds_responsible || order.ramper_responsible) {
    // ROW 36: "Personal" header
    const cA36 = ws.getCell("A36");
    cA36.value = "Personal";
    cA36.font = fontCalibri(12, true);
    cA36.border = {
      left: { style: "medium" },
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
    ws.mergeCells("B36:G36");
    // Apply thin inner borders to merged B-G area
    for (let c = 2; c <= 7; c++) {
      const letter = String.fromCharCode(64 + c);
      const cell = ws.getCell(`${letter}36`);
      if (c === 2) {
        cell.border = {
          left: { style: "thin" },
          top: { style: "thin" },
          bottom: { style: "thin" },
        };
      } else if (c === 7) {
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "medium" },
        };
      } else {
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
        };
      }
    }

    // ROW 37: signature row with grid
    for (let c = 1; c <= 7; c++) {
      const letter = String.fromCharCode(64 + c);
      const cell = ws.getCell(`${letter}37`);
      cell.font = fontCalibri(12);
      if (c === 1) {
        cell.border = {
          left: { style: "medium" },
          right: { style: "thin" },
          top: { style: "thin" },
          bottom: { style: "thin" },
        };
      } else if (c === 7) {
        cell.border = {
          left: { style: "thin" },
          right: { style: "medium" },
          top: { style: "thin" },
          bottom: { style: "thin" },
        };
      } else if (c === 2) {
        cell.border = {
          left: { style: "thin" },
          right: { style: "thin" },
          top: { style: "thin" },
          bottom: { style: "thin" },
        };
      } else if (c === 4) {
        cell.border = {
          right: { style: "thin" },
          top: { style: "thin" },
          bottom: { style: "thin" },
        };
      } else {
        cell.border = {
          left: { style: "thin" },
          right: { style: "thin" },
          top: { style: "thin" },
          bottom: { style: "thin" },
        };
      }
    }

    // ROW 38: signature bottom border
    for (let c = 1; c <= 7; c++) {
      const letter = String.fromCharCode(64 + c);
      const cell = ws.getCell(`${letter}38`);
      cell.font = fontCalibri(12);
      if (c === 1) {
        cell.border = {
          left: { style: "medium" },
          right: { style: "thin" },
          top: { style: "thin" },
          bottom: { style: "medium" },
        };
      } else if (c === 7) {
        cell.border = {
          left: { style: "thin" },
          right: { style: "medium" },
          top: { style: "thin" },
          bottom: { style: "medium" },
        };
      } else if (c === 2) {
        cell.border = {
          left: { style: "thin" },
          right: { style: "thin" },
          top: { style: "thin" },
          bottom: { style: "medium" },
        };
      } else {
        cell.border = {
          left: { style: "thin" },
          right: { style: "thin" },
          top: { style: "thin" },
          bottom: { style: "medium" },
        };
      }
    }
    ws.getRow(38).height = 15.75;

    // ROWS 39-42: completely blank (no borders)
    // Nothing to set — cells are default

    // ROW 43: Names
    ws.mergeCells("A43:B43");
    const cA43 = ws.getCell("A43");
    cA43.value = order.upds_responsible || "";
    cA43.font = fontCalibri(14);
    cA43.alignment = { horizontal: "center" };
    cA43.border = { bottom: { style: "thin" } };

    const cB43 = ws.getCell("B43");
    cB43.border = { bottom: { style: "thin" } };

    ws.mergeCells("D43:F43");
    const cD43 = ws.getCell("D43");
    cD43.value = order.ramper_responsible || "";
    cD43.font = fontCalibri(14);
    cD43.alignment = { horizontal: "center" };
    cD43.border = { bottom: { style: "thin" } };

    const cE43 = ws.getCell("E43");
    cE43.border = { bottom: { style: "thin" } };
    const cF43 = ws.getCell("F43");
    cF43.border = { bottom: { style: "thin" } };
    ws.getRow(43).height = 18.75;

    // ROW 44: Labels
    ws.mergeCells("A44:B44");
    const cA44 = ws.getCell("A44");
    cA44.value = "Responsable UPDS";
    cA44.font = fontCalibri(12, true);
    cA44.alignment = { horizontal: "center" };
    cA44.border = {
      left: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
    const cB44 = ws.getCell("B44");
    cB44.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
    const cC44 = ws.getCell("C44");
    cC44.border = {
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };

    ws.mergeCells("D44:F44");
    const cD44 = ws.getCell("D44");
    cD44.value = "Responsable RAMPER";
    cD44.font = fontCalibri(12, true);
    cD44.alignment = { horizontal: "center" };
    cD44.border = {
      left: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
    const cE44 = ws.getCell("E44");
    cE44.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
    const cF44 = ws.getCell("F44");
    cF44.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
    const cG44 = ws.getCell("G44");
    cG44.border = {
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
  }

  // ── Write buffer ──
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ExcelJS from "exceljs";
import { PassThrough } from "stream";

type ItemRow = {
  id: string;
  work_order_id: string;
  item_type: string;
  description: string;
  unit: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
};

type OrderRow = {
  id: string;
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
  status: string;
  created_at: string;
  plumber_id: string;
};

type OrderWithProfile = OrderRow & {
  work_order_items: ItemRow[];
  profile: { full_name: string; role: string };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: order, error } = await supabase
    .from("work_orders")
    .select("*, profile:plumber_id(*), work_order_items(*)")
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const typed = order as unknown as OrderWithProfile;

  const isOwner = typed.plumber_id === user.id;
  const isAdmin = typed.profile?.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "No tienes permiso" }, { status: 403 });
  }

  const laborItems = typed.work_order_items.filter(
    (i: ItemRow) => i.item_type === "labor"
  );
  const materialItems = typed.work_order_items.filter(
    (i: ItemRow) => i.item_type === "material"
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = user.email ?? "Plomería App";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Planilla");

  // Column widths
  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 38;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 12;
  sheet.getColumn(5).width = 14;
  sheet.getColumn(6).width = 14;

  // Styles
  const titleFont: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 16,
    bold: true,
    color: { argb: "FF1E3A5F" },
  };
  const sectionFont: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  const sectionFill = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FF1E3A5F" },
  };
  const headerFont: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 10,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  const headerFill = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FF2563EB" },
  };
  const cellFont: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 10,
  };
  const currencyFormat = '#,##0.00" Bs"';

  // ── Title ──
  sheet.mergeCells("A1:F1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "PLANILLA DE TRABAJOS DE MANTENIMIENTO";
  titleCell.font = titleFont;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 36;

  // ── Sheet number ──
  sheet.mergeCells("A2:F2");
  const sheetNumCell = sheet.getCell("A2");
  sheetNumCell.value = typed.sheet_number
    ? `Planilla N° ${typed.sheet_number}`
    : "Planilla N° —";
  sheetNumCell.font = { name: "Calibri", size: 12, bold: true };
  sheetNumCell.alignment = { horizontal: "center" };
  sheet.getRow(2).height = 24;

  // ── General Data section ──
  const dataStart = 4;
  sheet.mergeCells(`A${dataStart}:F${dataStart}`);
  const dataHeader = sheet.getCell(`A${dataStart}`);
  dataHeader.value = "DATOS GENERALES";
  dataHeader.font = sectionFont;
  dataHeader.fill = sectionFill;
  dataHeader.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(dataStart).height = 24;

  const generalData: [string, string | null][] = [
    ["Ubicación", typed.location],
    ["Descripción", typed.description],
    ["Solicitado por", typed.requested_by],
    ["Recibido por", typed.received_by],
    ["Fecha de solicitud", typed.request_date],
    ["Fecha de inicio", typed.start_date],
    ["Fecha de fin", typed.end_date],
    ["N° de Remito", typed.remit_number],
  ];

  generalData.forEach(([label, value], i) => {
    const rowNum = dataStart + 1 + i;
    const labelCell = sheet.getCell(`A${rowNum}`);
    labelCell.value = label;
    labelCell.font = { ...cellFont, bold: true };
    labelCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
    };

    sheet.mergeCells(`B${rowNum}:F${rowNum}`);
    const valCell = sheet.getCell(`B${rowNum}`);
    valCell.value = value ?? "—";
    valCell.font = cellFont;
    valCell.border = {
      top: { style: "thin" },
      right: { style: "thin" },
      bottom: { style: "thin" },
    };
  });

  // ── Labor Items section ──
  const laborStart = dataStart + 1 + generalData.length + 1;
  sheet.mergeCells(`A${laborStart}:F${laborStart}`);
  const laborHeader = sheet.getCell(`A${laborStart}`);
  laborHeader.value = "MANO DE OBRA";
  laborHeader.font = sectionFont;
  laborHeader.fill = sectionFill;
  laborHeader.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(laborStart).height = 24;

  const laborHeaderRow = laborStart + 1;
  const laborCols = ["N°", "Descripción", "Unidad", "Cantidad", "P. Unit.", "Total"];
  laborCols.forEach((col, i) => {
    const colLetter = String.fromCharCode(65 + i);
    const cell = sheet.getCell(`${colLetter}${laborHeaderRow}`);
    cell.value = col;
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  if (laborItems.length === 0) {
    sheet.mergeCells(
      `A${laborHeaderRow + 1}:F${laborHeaderRow + 1}`
    );
    const emptyCell = sheet.getCell(`A${laborHeaderRow + 1}`);
    emptyCell.value = "Sin items de mano de obra";
    emptyCell.font = { ...cellFont, italic: true, color: { argb: "FF9CA3AF" } };
    emptyCell.alignment = { horizontal: "center" };
  } else {
    laborItems.forEach((item: ItemRow, i: number) => {
      const rowNum = laborHeaderRow + 1 + i;
      sheet.getCell(`A${rowNum}`).value = i + 1;
      sheet.getCell(`A${rowNum}`).alignment = { horizontal: "center" };
      sheet.getCell(`B${rowNum}`).value = item.description;
      sheet.getCell(`C${rowNum}`).value = item.unit ?? "—";
      sheet.getCell(`C${rowNum}`).alignment = { horizontal: "center" };
      sheet.getCell(`D${rowNum}`).value = item.quantity;
      sheet.getCell(`D${rowNum}`).alignment = { horizontal: "center" };
      const upCell = sheet.getCell(`E${rowNum}`);
      upCell.value = item.unit_price;
      upCell.numFmt = "#,##0.00";
      upCell.alignment = { horizontal: "right" };
      const totalCell = sheet.getCell(`F${rowNum}`);
      totalCell.value = item.total;
      totalCell.numFmt = currencyFormat;
      totalCell.alignment = { horizontal: "right" };

      for (let c = 0; c < 6; c++) {
        const colLetter = String.fromCharCode(65 + c);
        const cell = sheet.getCell(`${colLetter}${rowNum}`);
        cell.font = cellFont;
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
    });
  }

  const laborTotalRow = laborHeaderRow + 1 + Math.max(laborItems.length, 1);
  sheet.mergeCells(`A${laborTotalRow}:E${laborTotalRow}`);
  const laborTotalLabel = sheet.getCell(`A${laborTotalRow}`);
  laborTotalLabel.value = "TOTAL MANO DE OBRA";
  laborTotalLabel.font = { ...cellFont, bold: true };
  laborTotalLabel.alignment = { horizontal: "right", vertical: "middle" };
  laborTotalLabel.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  const laborTotalVal = sheet.getCell(`F${laborTotalRow}`);
  laborTotalVal.value = typed.total_labor;
  laborTotalVal.numFmt = currencyFormat;
  laborTotalVal.font = { ...cellFont, bold: true };
  laborTotalVal.alignment = { horizontal: "right", vertical: "middle" };
  laborTotalVal.border = {
    top: { style: "thin" },
    right: { style: "thin" },
    bottom: { style: "thin" },
  };

  // ── Material Items section ──
  const materialStart = laborTotalRow + 2;
  sheet.mergeCells(`A${materialStart}:F${materialStart}`);
  const matHeader = sheet.getCell(`A${materialStart}`);
  matHeader.value = "MATERIALES";
  matHeader.font = sectionFont;
  matHeader.fill = sectionFill;
  matHeader.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(materialStart).height = 24;

  const matHeaderRow = materialStart + 1;
  laborCols.forEach((col, i) => {
    const colLetter = String.fromCharCode(65 + i);
    const cell = sheet.getCell(`${colLetter}${matHeaderRow}`);
    cell.value = col;
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  if (materialItems.length === 0) {
    sheet.mergeCells(
      `A${matHeaderRow + 1}:F${matHeaderRow + 1}`
    );
    const emptyCell = sheet.getCell(`A${matHeaderRow + 1}`);
    emptyCell.value = "Sin materiales registrados";
    emptyCell.font = { ...cellFont, italic: true, color: { argb: "FF9CA3AF" } };
    emptyCell.alignment = { horizontal: "center" };
  } else {
    materialItems.forEach((item: ItemRow, i: number) => {
      const rowNum = matHeaderRow + 1 + i;
      sheet.getCell(`A${rowNum}`).value = i + 1;
      sheet.getCell(`A${rowNum}`).alignment = { horizontal: "center" };
      sheet.getCell(`B${rowNum}`).value = item.description;
      sheet.getCell(`C${rowNum}`).value = item.unit ?? "—";
      sheet.getCell(`C${rowNum}`).alignment = { horizontal: "center" };
      sheet.getCell(`D${rowNum}`).value = item.quantity;
      sheet.getCell(`D${rowNum}`).alignment = { horizontal: "center" };
      const upCell = sheet.getCell(`E${rowNum}`);
      upCell.value = item.unit_price;
      upCell.numFmt = "#,##0.00";
      upCell.alignment = { horizontal: "right" };
      const totalCell = sheet.getCell(`F${rowNum}`);
      totalCell.value = item.total;
      totalCell.numFmt = currencyFormat;
      totalCell.alignment = { horizontal: "right" };

      for (let c = 0; c < 6; c++) {
        const colLetter = String.fromCharCode(65 + c);
        const cell = sheet.getCell(`${colLetter}${rowNum}`);
        cell.font = cellFont;
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
    });
  }

  const matTotalRow = matHeaderRow + 1 + Math.max(materialItems.length, 1);
  sheet.mergeCells(`A${matTotalRow}:E${matTotalRow}`);
  const matTotalLabel = sheet.getCell(`A${matTotalRow}`);
  matTotalLabel.value = "TOTAL MATERIALES";
  matTotalLabel.font = { ...cellFont, bold: true };
  matTotalLabel.alignment = { horizontal: "right", vertical: "middle" };
  matTotalLabel.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  const matTotalVal = sheet.getCell(`F${matTotalRow}`);
  matTotalVal.value = typed.total_materials;
  matTotalVal.numFmt = currencyFormat;
  matTotalVal.font = { ...cellFont, bold: true };
  matTotalVal.alignment = { horizontal: "right", vertical: "middle" };
  matTotalVal.border = {
    top: { style: "thin" },
    right: { style: "thin" },
    bottom: { style: "thin" },
  };

  // ── Grand Total ──
  const grandTotalRow = matTotalRow + 2;
  sheet.mergeCells(`A${grandTotalRow}:E${grandTotalRow}`);
  const grandLabel = sheet.getCell(`A${grandTotalRow}`);
  grandLabel.value = "TOTAL GLOBAL";
  grandLabel.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF1E3A5F" } };
  grandLabel.alignment = { horizontal: "right", vertical: "middle" };
  grandLabel.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFDBEAFE" },
  };
  grandLabel.border = {
    top: { style: "medium" },
    left: { style: "medium" },
    bottom: { style: "medium" },
  };
  const grandVal = sheet.getCell(`F${grandTotalRow}`);
  grandVal.value = typed.grand_total;
  grandVal.numFmt = currencyFormat;
  grandVal.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF1E3A5F" } };
  grandVal.alignment = { horizontal: "right", vertical: "middle" };
  grandVal.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFDBEAFE" },
  };
  grandVal.border = {
    top: { style: "medium" },
    right: { style: "medium" },
    bottom: { style: "medium" },
  };

  // ── Observations ──
  if (typed.observations) {
    const obsRow = grandTotalRow + 2;
    sheet.mergeCells(`A${obsRow}:F${obsRow}`);
    const obsHeader = sheet.getCell(`A${obsRow}`);
    obsHeader.value = "OBSERVACIONES";
    obsHeader.font = sectionFont;
    obsHeader.fill = sectionFill;
    obsHeader.alignment = { horizontal: "center", vertical: "middle" };

    const obsValRow = obsRow + 1;
    sheet.mergeCells(`A${obsValRow}:F${obsValRow}`);
    const obsVal = sheet.getCell(`A${obsValRow}`);
    obsVal.value = typed.observations;
    obsVal.font = cellFont;
    obsVal.alignment = { wrapText: true };
    sheet.getRow(obsValRow).height = 48;
  }

  // ── Signatures ──
  const sigRow = typed.observations
    ? grandTotalRow + 5
    : grandTotalRow + 3;

  if (typed.upds_responsible) {
    sheet.mergeCells(`A${sigRow}:C${sigRow}`);
    const sig1 = sheet.getCell(`A${sigRow}`);
    sig1.value = `Responsable UPDS: ${typed.upds_responsible}`;
    sig1.font = { ...cellFont, italic: true };
    sheet.mergeCells(`D${sigRow}:F${sigRow}`);
  }
  if (typed.ramper_responsible) {
    const sig2Row = sigRow + 1;
    sheet.mergeCells(`A${sig2Row}:C${sig2Row}`);
    const sig2 = sheet.getCell(`A${sig2Row}`);
    sig2.value = `Responsable RAMPER: ${typed.ramper_responsible}`;
    sig2.font = { ...cellFont, italic: true };
    sheet.mergeCells(`D${sig2Row}:F${sig2Row}`);
  }

  // ── Created date ──
  const dateRow = (typed.ramper_responsible ? sigRow + 2 : sigRow + 1) + 1;
  sheet.mergeCells(`A${dateRow}:F${dateRow}`);
  const dateCell = sheet.getCell(`A${dateRow}`);
  dateCell.value = `Generado el ${new Date(typed.created_at).toLocaleDateString("es-BO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`;
  dateCell.font = { ...cellFont, color: { argb: "FF9CA3AF" } };
  dateCell.alignment = { horizontal: "center" };

  // ── Print setup ──
  sheet.pageSetup.orientation = "landscape";
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.paperSize = 9; // A4

  // ── Stream response ──
  const passThrough = new PassThrough();
  workbook.xlsx.write(passThrough).then(() => passThrough.end());

  const webStream = new ReadableStream({
    start(controller) {
      passThrough.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      passThrough.on("end", () => controller.close());
      passThrough.on("error", (err: Error) => controller.error(err));
    },
  });

  const filename = typed.sheet_number
    ? `planilla-${typed.sheet_number}.xlsx`
    : `orden-${typed.id.slice(0, 8)}.xlsx`;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

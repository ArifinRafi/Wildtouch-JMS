import { formatCurrency } from "@/lib/currency";
import { serializeCreditNote } from "@/lib/models/CreditNote";

type CreditNoteExport = ReturnType<typeof serializeCreditNote>;

const REASONS: Record<CreditNoteExport["reason"], string> = {
  return: "Returned goods",
  not_delivered: "Not delivered",
  other: "Other",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

function escapeXml(value: unknown): string {
  return escapeHtml(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/&#39;/g, "&apos;");
}

function dateLabel(value: string | Date | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-GB", { timeZone: "UTC" });
}

function dateTimeLabel(value: Date | string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" });
}

function appliedAmount(note: CreditNoteExport): number {
  return note.applications.reduce((sum, application) => sum + Math.round(application.amount * 100), 0) / 100;
}

/** Printable credit note; the browser's Save as PDF flow matches invoice downloads. */
export function buildCreditNotePrintHtml(note: CreditNoteExport): string {
  const used = appliedAmount(note);
  const available = note.status === "void" ? 0 : note.remaining;
  const voided = note.status === "void" ? Math.round((note.amount - used) * 100) / 100 : 0;
  const applicationRows = note.applications.map((application) => `<tr>
    <td>${escapeHtml(application.invoiceNumber)}</td><td>${escapeHtml(application.orderNumber)}</td>
    <td>${escapeHtml(dateTimeLabel(application.appliedAt))}</td>
    <td class="number">${escapeHtml(formatCurrency(application.amount, note.currency))}</td>
  </tr>`).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Credit Note ${escapeHtml(note.creditNoteNumber)}</title>
<style>
  @page { size: A4; margin: 17mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #172033; font: 11pt Arial, sans-serif; }
  header { display: flex; justify-content: space-between; gap: 25px; border-bottom: 3px solid #6d28d9; padding-bottom: 15px; }
  h1 { margin: 0 0 6px; color: #4c1d95; font-size: 23pt; letter-spacing: .03em; }
  h2 { margin: 26px 0 9px; color: #4c1d95; font-size: 11pt; }
  p { margin: 4px 0; }
  .muted { color: #64748b; }
  .right { text-align: right; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 22px; }
  .card { background: #f8f7fc; border: 1px solid #e6e0f2; padding: 14px; border-radius: 5px; }
  .label { color: #64748b; font-size: 9pt; text-transform: uppercase; letter-spacing: .04em; }
  .value { font-weight: 700; margin: 3px 0 11px; }
  .amount { font-size: 20pt; color: #4c1d95; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
  th { background: #f3effb; font-size: 9pt; }
  .number { text-align: right; white-space: nowrap; }
  .note { white-space: pre-wrap; overflow-wrap: anywhere; }
  .totals { margin-left: auto; width: 260px; margin-top: 18px; }
  .totals div { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #e2e8f0; }
  .totals strong { color: #4c1d95; }
  footer { margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 10px; color: #64748b; font-size: 9pt; }
  .void { display: inline-block; margin-top: 7px; color: #b91c1c; font-weight: 700; }
  @media print { .no-print { display: none; } }
</style></head><body>
<header><div><h1>CREDIT NOTE</h1><p>Wildtouch</p><p class="muted">${escapeHtml(note.creditNoteNumber)}</p></div>
<div class="right"><p><strong>Date:</strong> ${escapeHtml(dateLabel(note.date))}</p><p><strong>Status:</strong> ${note.status === "void" ? "Voided" : available === 0 ? "Fully used" : "Available"}</p><p><strong>Currency:</strong> ${escapeHtml(note.currency)}</p>${note.status === "void" ? '<span class="void">VOID — NOT AVAILABLE FOR USE</span>' : ""}</div></header>
<div class="grid"><section class="card"><div class="label">Issued to</div><p class="value">${escapeHtml(note.clientName)}</p><p>Client ID: ${escapeHtml(note.clientId)}</p></section>
<section class="card"><div class="label">Credit amount</div><p class="amount">${escapeHtml(formatCurrency(note.amount, note.currency))}</p><p>Reason: ${escapeHtml(REASONS[note.reason])}</p></section></div>
<h2>Credit details</h2><p class="note">${escapeHtml(note.note || "No additional note.")}</p>
<div class="totals"><div><span>Issued</span><span>${escapeHtml(formatCurrency(note.amount, note.currency))}</span></div><div><span>Applied to invoices</span><span>${escapeHtml(formatCurrency(used, note.currency))}</span></div>${voided ? `<div><span>Voided</span><span>${escapeHtml(formatCurrency(voided, note.currency))}</span></div>` : ""}<div><strong>Available credit</strong><strong>${escapeHtml(formatCurrency(available, note.currency))}</strong></div></div>
<h2>Invoice applications</h2>${applicationRows ? `<table><thead><tr><th>Invoice</th><th>Order</th><th>Applied at (UTC)</th><th class="number">Amount</th></tr></thead><tbody>${applicationRows}</tbody></table>` : '<p class="muted">No invoice applications yet.</p>'}
<footer><p>Created by: ${escapeHtml(note.createdBy || "—")} · Created at: ${escapeHtml(dateTimeLabel(note.createdAt))} UTC</p><p>This credit note is an account credit record, not a payment receipt.</p></footer>
<script>window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 250); });</script>
</body></html>`;
}

type Cell = { value: string | number; type?: "String" | "Number" | "DateTime"; style?: "Date" | "DateTime" };

function cell({ value, type = "String", style }: Cell): string {
  return `<Cell ss:StyleID="${style ?? (type === "Number" ? "Number" : "Text")}"><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
}

function excelDateTime(date: Date | null): string {
  return date ? date.toISOString().replace(/Z$/, "") : "";
}

function sheet(name: string, title: string, exportedAt: Date, headers: string[], rows: Cell[][]): string {
  return `<Worksheet ss:Name="${escapeXml(name)}"><Table>
    ${headers.map((header) => `<Column ss:AutoFitWidth="0" ss:Width="${header === "Note" ? 250 : Math.max(95, Math.min(175, header.length * 8))}"/>`).join("")}
    <Row><Cell ss:StyleID="Title"><Data ss:Type="String">${escapeXml(title)}</Data></Cell></Row>
    <Row><Cell ss:StyleID="Meta"><Data ss:Type="String">Exported ${escapeXml(exportedAt.toISOString())} UTC</Data></Cell></Row>
    <Row>${headers.map((header) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`).join("")}</Row>
    ${rows.map((row) => `<Row>${row.map(cell).join("")}</Row>`).join("")}
  </Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>3</SplitHorizontal><TopRowBottomPane>3</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions></Worksheet>`;
}

/** All credit notes and their invoice uses in separate Excel-compatible worksheets. */
export function buildCreditNotesExcel(notes: CreditNoteExport[], exportedAt: Date): string {
  const noteRows: Cell[][] = notes.map((note) => [
    { value: note.creditNoteNumber }, { value: `${note.date}T00:00:00.000`, type: "DateTime", style: "Date" }, { value: note.clientId }, { value: note.clientName },
    { value: REASONS[note.reason] }, { value: note.note }, { value: note.currency },
    { value: note.amount, type: "Number" },
    { value: appliedAmount(note), type: "Number" },
    { value: note.status === "void" ? Math.round((note.amount - appliedAmount(note)) * 100) / 100 : 0, type: "Number" },
    { value: note.status === "void" ? 0 : note.remaining, type: "Number" },
    { value: note.status === "void" ? "Voided" : note.remaining === 0 ? "Fully used" : "Available" },
    { value: note.createdBy },
    note.createdAt ? { value: excelDateTime(note.createdAt), type: "DateTime", style: "DateTime" } : { value: "" },
    note.updatedAt ? { value: excelDateTime(note.updatedAt), type: "DateTime", style: "DateTime" } : { value: "" },
  ]);
  const applicationRows = notes.flatMap((note) => note.applications.map((application): Cell[] => [
    { value: note.creditNoteNumber }, { value: note.clientId }, { value: note.clientName },
    { value: application.invoiceNumber }, { value: application.orderNumber },
    { value: note.currency }, { value: application.amount, type: "Number" },
    { value: excelDateTime(new Date(application.appliedAt)), type: "DateTime", style: "DateTime" },
  ]));

  return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Author>Wildtouch JMS</Author></DocumentProperties>
<Styles><Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Top"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
<Style ss:ID="Title"><Font ss:FontName="Arial" ss:Size="14" ss:Bold="1" ss:Color="#4C1D95"/></Style>
<Style ss:ID="Meta"><Font ss:FontName="Arial" ss:Size="9" ss:Color="#64748B"/></Style>
<Style ss:ID="Header"><Alignment ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#6D28D9" ss:Pattern="Solid"/></Style>
<Style ss:ID="Text"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
<Style ss:ID="Number"><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="0.00"/></Style>
<Style ss:ID="Date"><NumberFormat ss:Format="dd/mm/yyyy"/></Style>
<Style ss:ID="DateTime"><NumberFormat ss:Format="dd/mm/yyyy hh:mm"/></Style></Styles>
${sheet("Credit Notes", "All Credit Notes", exportedAt, ["Credit Note", "Date", "Client ID", "Client Name", "Reason", "Note", "Currency", "Issued Amount", "Applied Amount", "Voided Amount", "Available Amount", "Status", "Created By", "Created At (UTC)", "Updated At (UTC)"], noteRows)}
${sheet("Invoice Applications", "Credit Applied to Invoices", exportedAt, ["Credit Note", "Client ID", "Client Name", "Invoice Number", "Order Number", "Currency", "Applied Amount", "Applied At (UTC)"], applicationRows)}
</Workbook>`;
}

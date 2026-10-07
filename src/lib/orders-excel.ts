import type { Order } from "@/lib/store/orders-store";
import { normalizeCurrency } from "@/lib/currency";
import { orderSourceLabel } from "@/lib/order-source";

interface OrdersExcelFilters {
  startDate: string;
  endDate: string;
  search: string;
  agentSearch: string;
}

function xml(value: unknown): string {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cell(value: unknown, type: "String" | "Number" | "DateTime" = "String", style = "Text"): string {
  return `<Cell ss:StyleID="${style}"><Data ss:Type="${type}">${xml(value)}</Data></Cell>`;
}

function orderDateCell(value: string | null): string {
  if (!value) return cell("");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cell("");
  // Match the local calendar date used by the Orders page's date-range filter.
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return cell(`${key}T00:00:00.000`, "DateTime", "Date");
}

/** Export the exact (already filtered) Orders list as an Excel-compatible workbook. */
export function buildOrdersExcel(
  orders: Order[],
  filters: OrdersExcelFilters,
  exportedAt: Date,
  includePricing: boolean,
): string {
  const columns = [
    ["#", 40], ["Order", 100], ["Planogram", 170], ["Client", 170],
    ["Agent", 130], ["Agent ID", 90], ["Source of Order", 110],
    ["Date", 95], ["Items", 55],
    ...(includePricing ? [["Currency", 70], ["Total", 90], ["Invoiced", 90], ["Outstanding", 95]] : []),
    ["Status", 125],
  ] as const;
  const header = columns.map(([label]) => cell(label, "String", "Header")).join("");
  const rows = orders.map((order, index) => {
    const total = order.total || 0;
    const invoiced = order.amountInvoiced || 0;
    const values = [
      cell(index + 1, "Number", "Count"),
      cell(order.orderNumber),
      cell(order.planogram?.name || ""),
      cell(order.client?.name || ""),
      cell(order.agent?.name || ""),
      cell(order.agent?.agentId || ""),
      cell(orderSourceLabel(order.orderSource)),
      orderDateCell(order.createdAt),
      cell(order.lineItems?.length ?? 0, "Number", "Count"),
      ...(includePricing ? [
        cell(normalizeCurrency(order.currency)),
        cell(total, "Number", "Money"),
        cell(invoiced, "Number", "Money"),
        cell(invoiced > 0 ? Math.max(0, total - invoiced) : 0, "Number", "Money"),
      ] : []),
      cell(order.status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())),
    ];
    return `<Row>${values.join("")}</Row>`;
  }).join("");
  const range = filters.startDate || filters.endDate
    ? `${filters.startDate || "Any"} to ${filters.endDate || "Any"}`
    : "All dates";

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Author>Wildtouch JMS</Author><Created>${exportedAt.toISOString()}</Created></DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="Title"><Font ss:FontName="Arial" ss:Size="14" ss:Bold="1" ss:Color="#1E3A8A"/></Style>
  <Style ss:ID="Meta"><Font ss:FontName="Arial" ss:Size="10" ss:Color="#64748B"/></Style>
  <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2563EB" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Text"><Alignment ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="Count"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><NumberFormat ss:Format="0"/></Style>
  <Style ss:ID="Money"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><NumberFormat ss:Format="#,##0.00"/></Style>
  <Style ss:ID="Date"><NumberFormat ss:Format="dd mmm yyyy"/></Style>
 </Styles>
 <Worksheet ss:Name="Orders">
  <Table>${columns.map(([, width]) => `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`).join("")}
   <Row ss:Height="24">${cell("Wildtouch Orders", "String", "Title")}</Row>
   <Row>${cell(`Date range: ${range}`, "String", "Meta")}</Row>
   <Row>${cell(`Exported: ${exportedAt.toISOString()}`, "String", "Meta")}</Row>
   <Row>${cell(`Orders: ${orders.length}`, "String", "Meta")}</Row>
   ${filters.search.trim() ? `<Row>${cell(`Order search: ${filters.search.trim()}`, "String", "Meta")}</Row>` : ""}
   ${filters.agentSearch.trim() ? `<Row>${cell(`Agent search: ${filters.agentSearch.trim()}`, "String", "Meta")}</Row>` : ""}
   <Row ss:Height="26">${header}</Row>
   ${rows}
  </Table>
 </Worksheet>
</Workbook>`;
}

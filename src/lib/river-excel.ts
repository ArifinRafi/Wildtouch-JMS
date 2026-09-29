interface ExportRiverOrder {
  [key: string]: unknown;
  notesLog?: { date?: string; note?: string }[];
}

interface Column {
  label: string;
  key: string;
  width: number;
  type?: "Number" | "String";
}

const COLUMNS: Column[] = [
  { label: "Order Number", key: "orderNumber", width: 90 },
  { label: "Order Date", key: "date", width: 90 },
  { label: "Component", key: "product", width: 150 },
  { label: "Description", key: "description", width: 220 },
  { label: "Order Quantity", key: "quantity", width: 90, type: "Number" },
  { label: "Quantity Received", key: "quantityReceived", width: 100, type: "Number" },
  { label: "Quantity Outstanding", key: "outstanding", width: 110, type: "Number" },
  { label: "Order Status", key: "status", width: 85 },
  { label: "Value GBP", key: "valueGbp", width: 85, type: "Number" },
  { label: "Value RMB", key: "valueRmb", width: 85, type: "Number" },
  { label: "Priority", key: "priority", width: 80 },
  { label: "Shipment Method", key: "shipmentMethod", width: 100 },
  { label: "Shipment Quantity", key: "shipmentQuantity", width: 105, type: "Number" },
  { label: "Shipment Date", key: "shipmentDate", width: 90 },
  { label: "Requested Date", key: "dateRequested", width: 90 },
  { label: "Paid", key: "paid", width: 70 },
  { label: "Paid Date", key: "datePaid", width: 90 },
  { label: "Progress Notes", key: "notesLog", width: 280 },
  { label: "Component ID", key: "componentId", width: 140 },
  { label: "Component Code", key: "componentCode", width: 110 },
  { label: "Component Label", key: "componentLabel", width: 160 },
  { label: "Created At", key: "createdAt", width: 145 },
  { label: "Updated At", key: "updatedAt", width: 145 },
];

function xml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function displayValue(order: ExportRiverOrder, key: string): string | number {
  const value = order[key];
  if (key === "paid") return value ? "Paid" : "Unpaid";
  if (key === "notesLog") {
    return (order.notesLog ?? [])
      .map((entry) => [entry.date, entry.note].filter(Boolean).join(" — "))
      .filter(Boolean)
      .join("\n");
  }
  if ((key === "createdAt" || key === "updatedAt") && value) {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
  }
  if (typeof value === "number") return value;
  return String(value ?? "");
}

/** Build an Excel 2003 SpreadsheetML workbook without a runtime dependency. */
export function buildRiverExcel(orders: ExportRiverOrder[], exportedAt: Date): string {
  const columns = COLUMNS.map((column) => `<Column ss:AutoFitWidth="0" ss:Width="${column.width}"/>`).join("");
  const header = COLUMNS.map((column) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${xml(column.label)}</Data></Cell>`).join("");
  const rows = orders.map((order) => {
    const cells = COLUMNS.map((column) => {
      const value = displayValue(order, column.key);
      const type = column.type === "Number" && typeof value === "number" ? "Number" : "String";
      return `<Cell ss:StyleID="${type === "Number" ? "Number" : "Text"}"><Data ss:Type="${type}">${xml(value)}</Data></Cell>`;
    }).join("");
    return `<Row>${cells}</Row>`;
  }).join("");
  const iso = exportedAt.toISOString();
  const [exportDate, exportTimeWithZone] = iso.split("T");
  const exportTime = exportTimeWithZone.replace("Z", " UTC");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Author>Wildtouch JMS</Author><Created>${iso}</Created></DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Top"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="Title"><Font ss:FontName="Arial" ss:Size="15" ss:Bold="1" ss:Color="#1E3A8A"/></Style>
  <Style ss:ID="Meta"><Font ss:FontName="Arial" ss:Size="10" ss:Italic="1" ss:Color="#64748B"/></Style>
  <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2563EB" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Text"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="Number"><Alignment ss:Horizontal="Right" ss:Vertical="Top"/><Font ss:FontName="Arial" ss:Size="10"/><NumberFormat ss:Format="0.00"/></Style>
 </Styles>
 <Worksheet ss:Name="River Data">
  <Table>${columns}
   <Row ss:Height="25"><Cell ss:StyleID="Title"><Data ss:Type="String">Wildtouch River Orders</Data></Cell></Row>
   <Row><Cell ss:StyleID="Meta"><Data ss:Type="String">Download date: ${xml(exportDate)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="Meta"><Data ss:Type="String">Download time: ${xml(exportTime)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="Meta"><Data ss:Type="String">Total rows: ${orders.length}</Data></Cell></Row>
   <Row ss:Height="30">${header}</Row>
   ${rows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/><FrozenNoSplit/><SplitHorizontal>5</SplitHorizontal><TopRowBottomPane>5</TopRowBottomPane><ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
}

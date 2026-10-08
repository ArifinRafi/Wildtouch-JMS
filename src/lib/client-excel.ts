import { accountStatusLabel } from "@/lib/client-status";

interface ExportClient {
  [key: string]: unknown;
  id?: string;
  name?: string;
  additionalContacts?: unknown;
  categoryPrices?: unknown;
  pricingCurrency?: unknown;
}

interface Column {
  label: string;
  key: string;
  width: number;
  type?: "Number" | "String";
}

const COLUMNS: Column[] = [
  { label: "Client ID", key: "id", width: 80 },
  { label: "Client Name", key: "name", width: 180 },
  { label: "Mother Company", key: "motherCompany", width: 150 },
  { label: "Company Number", key: "companyNumber", width: 120 },
  { label: "Client Source", key: "clientSource", width: 160 },
  { label: "Theme", key: "theme", width: 160 },
  { label: "Agent ID", key: "agentId", width: 90 },
  { label: "Agent Name", key: "agentName", width: 150 },
  { label: "Main Buyer Names", key: "mainBuyerNames", width: 150 },
  { label: "Primary Contact", key: "primaryContactName", width: 150 },
  { label: "Primary Contact Position", key: "primaryContactPosition", width: 150 },
  { label: "Further Contact Name", key: "furtherContactName", width: 150 },
  { label: "Further Contact Position", key: "furtherContactPosition", width: 150 },
  { label: "Further Contact Number", key: "furtherContactNumber", width: 120 },
  { label: "Mobile", key: "contactNumber", width: 115 },
  { label: "Other Mobile", key: "mobOther", width: 115 },
  { label: "Email", key: "email", width: 180 },
  { label: "Other Email", key: "emailOther", width: 180 },
  { label: "Shop Manager", key: "shopManagerName", width: 140 },
  { label: "Gift Shop Contact", key: "giftShopContactNo", width: 120 },
  { label: "Website", key: "webAddress", width: 170 },
  { label: "History", key: "history", width: 80 },
  { label: "Account Status", key: "accountStatus", width: 100 },
  { label: "Address Line 1", key: "address", width: 200 },
  { label: "City", key: "city", width: 110 },
  { label: "Postcode", key: "postcode", width: 90 },
  { label: "Region", key: "region", width: 120 },
  { label: "Full Invoice Address", key: "invoiceAddressFull", width: 230 },
  { label: "Delivery Address", key: "deliveryAddress", width: 230 },
  { label: "Delivery Instructions", key: "deliveryInstructions", width: 220 },
  { label: "Invoice Procedure", key: "invoiceProcedure", width: 150 },
  { label: "Require PO", key: "requirePO", width: 80 },
  { label: "Email Invoice To", key: "emailInvoiceTo", width: 180 },
  { label: "VAT Rate (%)", key: "vatRate", width: 80, type: "Number" },
  { label: "Substitute Designs", key: "substituteDesigns", width: 100 },
  { label: "Substitute Design Notes", key: "substituteDesignNotes", width: 220 },
  { label: "Sample", key: "sample", width: 80 },
  { label: "Sample Notes", key: "sampleNotes", width: 220 },
  { label: "Slat Board", key: "slatBoard", width: 90 },
  { label: "Off Stand", key: "offStand", width: 90 },
  { label: "Stands Info", key: "standsInfo", width: 180 },
  { label: "Upsell Info", key: "upsellInfo", width: 180 },
  { label: "Cards Used", key: "cardsUsed", width: 120 },
  { label: "Boxes Used", key: "boxesUsed", width: 120 },
  { label: "Pricing Currency", key: "pricingCurrency", width: 100 },
  { label: "Category Prices", key: "categoryPrices", width: 240 },
  { label: "Additional Contacts", key: "additionalContacts", width: 280 },
  { label: "Complaints & Issues", key: "complaintsIssues", width: 320 },
  { label: "Client Notes", key: "clientNotes", width: 320 },
  { label: "Special Information", key: "specialInformation", width: 240 },
  { label: "Special Information Date", key: "specialInformationDate", width: 120 },
  { label: "Last Order", key: "lastOrder", width: 100 },
  { label: "Total Orders", key: "totalOrders", width: 80, type: "Number" },
  { label: "Brand Card URL", key: "brandCardImage", width: 220 },
  { label: "Barcode URL", key: "barcodeImage", width: 220 },
  { label: "All Barcode URLs", key: "barcodeImages", width: 280 },
];

function xml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function displayValue(client: ExportClient, key: string): string | number {
  const value = client[key];
  if (key === "primaryContactName") {
    return String(value || client.otherContactAndPosition || "");
  }
  if (key === "accountStatus") return accountStatusLabel(value);
  if (key === "requirePO" || key === "substituteDesigns" || key === "sample" || key === "slatBoard" || key === "offStand") {
    return value === true ? "Yes" : value === false ? "No" : "";
  }
  if (key === "barcodeImages") return Array.isArray(value) ? value.join("\n") : "";
  if (key === "categoryPrices") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "";
    const symbol = client.pricingCurrency === "EUR" ? "€" : "£";
    return Object.entries(value as Record<string, unknown>)
      .map(([category, price]) => `${category}: ${symbol}${Number(price || 0).toFixed(2)}`)
      .join("\n");
  }
  if (key === "additionalContacts") {
    if (!Array.isArray(value)) return "";
    return value
      .map((entry) => {
        if (!entry || typeof entry !== "object") return "";
        const c = entry as Record<string, unknown>;
        return [c.name, c.contactNumber, c.address].filter(Boolean).join(" | ");
      })
      .filter(Boolean)
      .join("\n");
  }
  if (key === "complaintsIssues") {
    if (!Array.isArray(value)) return "";
    return value
      .map((entry) => {
        if (!entry || typeof entry !== "object") return "";
        const item = entry as Record<string, unknown>;
        return [item.date, item.type, item.note].filter(Boolean).join(" | ");
      })
      .filter(Boolean)
      .join("\n");
  }
  if (key === "clientNotes") {
    if (!Array.isArray(value)) return "";
    return value
      .map((entry) => {
        if (!entry || typeof entry !== "object") return "";
        const item = entry as Record<string, unknown>;
        return [item.date, item.note].filter(Boolean).join(" | ");
      })
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "number") return value;
  return String(value ?? "");
}

/** Build an Excel 2003 SpreadsheetML workbook without a runtime dependency. */
export function buildClientsExcel(clients: ExportClient[], title: string): string {
  const columns = COLUMNS.map((column) => `<Column ss:AutoFitWidth="0" ss:Width="${column.width}"/>`).join("");
  const header = COLUMNS.map((column) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${xml(column.label)}</Data></Cell>`).join("");
  const rows = clients.map((client) => {
    const cells = COLUMNS.map((column) => {
      const value = displayValue(client, column.key);
      const type = column.type === "Number" && typeof value === "number" ? "Number" : "String";
      const style = type === "Number" ? "Number" : "Text";
      return `<Cell ss:StyleID="${style}"><Data ss:Type="${type}">${xml(value)}</Data></Cell>`;
    }).join("");
    return `<Row>${cells}</Row>`;
  }).join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Author>Wildtouch JMS</Author></DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Top"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="Title"><Font ss:FontName="Arial" ss:Size="14" ss:Bold="1" ss:Color="#3B2F6B"/></Style>
  <Style ss:ID="Meta"><Font ss:FontName="Arial" ss:Size="9" ss:Italic="1" ss:Color="#64748B"/></Style>
  <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#6D28D9" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Text"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="Number"><Alignment ss:Horizontal="Right" ss:Vertical="Top"/><Font ss:FontName="Arial" ss:Size="10"/><NumberFormat ss:Format="0.00"/></Style>
 </Styles>
 <Worksheet ss:Name="Clients">
  <Table>${columns}
   <Row ss:Height="24"><Cell ss:StyleID="Title"><Data ss:Type="String">${xml(title)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="Meta"><Data ss:Type="String">Exported ${xml(new Date().toISOString())}</Data></Cell></Row>
   <Row ss:Height="30">${header}</Row>
   ${rows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/><FrozenNoSplit/><SplitHorizontal>3</SplitHorizontal><TopRowBottomPane>3</TopRowBottomPane><ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
}

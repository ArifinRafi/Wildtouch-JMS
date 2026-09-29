export const WHITEBOARD_STATUSES = [
  "Orders To take out",
  "Orders to be made in the office",
  "Orders to send out",
  "Orders for handler",
  "Get ready for next week",
] as const;

export type WhiteboardStatus = (typeof WHITEBOARD_STATUSES)[number];

const LEGACY_STATUS_MAP: Record<string, WhiteboardStatus> = {
  "TTO - To Take Out": "Orders To take out",
  "OIP - Order In Process": "Orders to be made in the office",
  "TBC - To Be Checked": "Orders to send out",
  "TBM - To Be Made": "Orders to be made in the office",
  "In Transit": "Orders for handler",
  "Order Made - Await Delivery": "Get ready for next week",
};

/** Keep existing whiteboard records usable after the workflow status update. */
export function normalizeWhiteboardStatus(value: unknown): WhiteboardStatus {
  const status = String(value ?? "").trim();
  const current = WHITEBOARD_STATUSES.find((candidate) => candidate === status);
  return current ?? LEGACY_STATUS_MAP[status] ?? "Orders to be made in the office";
}

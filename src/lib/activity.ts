import { sessionUser } from "@/lib/authz";
import { Activity } from "@/lib/models/Activity";

export interface ActivityEntry {
  action: "added" | "updated" | "deleted" | "received" | "completed" | "confirmed";
  entityType: string;
  entityName?: string;
  entityId?: string;
  quantity?: number | null;
  details?: string;
}

/**
 * Record an audit-trail entry for the current session user.
 * Never throws — a failed log must not break the actual operation.
 * Call AFTER the operation succeeds (no await needed if you don't care).
 */
export async function logActivity(entry: ActivityEntry): Promise<void> {
  try {
    const user = await sessionUser();
    await Activity.create({
      actorName: user?.name || user?.email || "unknown",
      actorRole: user?.role || "unknown",
      action: entry.action,
      entityType: entry.entityType,
      entityName: entry.entityName ?? "",
      entityId: entry.entityId ? String(entry.entityId) : "",
      quantity: entry.quantity ?? null,
      details: entry.details ?? "",
    });
  } catch (err) {
    console.error("[activity] failed to log:", err);
  }
}

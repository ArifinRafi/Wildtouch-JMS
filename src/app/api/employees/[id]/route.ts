import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Employee, serializeEmployee } from "@/lib/models/Employee";
import { Shift } from "@/lib/models/Shift";
import { logActivity } from "@/lib/activity";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/employees/[id]">) {
  const { id } = await ctx.params;
  await connectDB();
  const body = await request.json();
  const patch: Record<string, string> = {};
  for (const field of ["name", "address", "city", "contactNumber", "email"]) {
    if (body[field] !== undefined) patch[field] = String(body[field]).trim();
  }
  if (patch.name === "") return NextResponse.json({ error: "name is required" }, { status: 400 });

  const updated = await Employee.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).lean();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (patch.name) await Shift.updateMany({ employeeId: id }, { employeeName: patch.name });
  await logActivity({
    action: "updated",
    entityType: "employee",
    entityName: String(updated.name ?? id),
    entityId: id,
    details: `changed ${Object.keys(patch).join(", ")}`,
  });
  return NextResponse.json(serializeEmployee(updated));
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/employees/[id]">) {
  const { id } = await ctx.params;
  await connectDB();
  if (await Shift.exists({ employeeId: id })) {
    return NextResponse.json(
      { error: "This employee has shift history. Delete those shifts before deleting the employee." },
      { status: 409 },
    );
  }
  const deleted = await Employee.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({ action: "deleted", entityType: "employee", entityName: String(deleted.name ?? id), entityId: id });
  return NextResponse.json({ ok: true });
}

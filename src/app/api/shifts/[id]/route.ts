import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { Employee } from "@/lib/models/Employee";
import { Shift, calculateShiftHours, serializeShift, SHIFT_ATTENDANCE } from "@/lib/models/Shift";
import { logActivity } from "@/lib/activity";

function numeric(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/shifts/[id]">) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();
  const existing = await Shift.findById(id).lean();
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await request.json();

  const employeeId = body.employeeId === undefined ? existing.employeeId : String(body.employeeId).trim();
  const employee = await Employee.findById(employeeId).lean();
  if (!employee) return NextResponse.json({ error: "a valid employee is required" }, { status: 400 });
  const date = body.date === undefined ? existing.date : String(body.date).trim();
  const startTime = body.startTime === undefined ? existing.startTime : String(body.startTime).trim();
  const finishTime = body.finishTime === undefined ? existing.finishTime : String(body.finishTime).trim();
  const lunchMinutes = body.lunchMinutes === undefined ? existing.lunchMinutes : numeric(body.lunchMinutes);
  const extraHours = body.extraHours === undefined ? existing.extraHours : numeric(body.extraHours);
  const calculated = calculateShiftHours(startTime, finishTime, lunchMinutes);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "a valid date is required" }, { status: 400 });
  if (!calculated) return NextResponse.json({ error: "valid start and finish times are required" }, { status: 400 });

  const attendance = body.attendance === undefined
    ? existing.attendance
    : SHIFT_ATTENDANCE.includes(body.attendance) ? body.attendance : "unmarked";
  try {
    const updated = await Shift.findByIdAndUpdate(id, {
      employeeId,
      employeeName: String(employee.name ?? "").trim(),
      date,
      startTime,
      finishTime,
      lunchMinutes,
      extraHours,
      hours: calculated.hours,
      chargeableHours: calculated.chargeableHours,
      notes: body.notes === undefined ? existing.notes : String(body.notes).trim(),
      attendance,
    }, { new: true, runValidators: true }).lean();
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    await logActivity({
      action: "updated",
      entityType: "shift",
      entityName: String(employee.name ?? employeeId),
      entityId: id,
      details: `${date} · ${startTime}–${finishTime}`,
    });
    return NextResponse.json(serializeShift(updated as never));
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "This employee already has a shift on that date." }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/shifts/[id]">) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();
  const deleted = await Shift.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "deleted",
    entityType: "shift",
    entityName: deleted.employeeName,
    entityId: id,
    details: deleted.date,
  });
  return NextResponse.json({ ok: true });
}

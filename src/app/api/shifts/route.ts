import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Employee } from "@/lib/models/Employee";
import { Shift, calculateShiftHours, serializeShift, SHIFT_ATTENDANCE } from "@/lib/models/Shift";
import { logActivity } from "@/lib/activity";

function numeric(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

export async function GET(request: NextRequest) {
  await connectDB();
  const query: Record<string, unknown> = {};
  const employeeId = request.nextUrl.searchParams.get("employeeId");
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  if (employeeId) query.employeeId = employeeId;
  if (from || to) {
    query.date = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {}),
    };
  }
  const shifts = await Shift.find(query).sort({ date: 1, employeeName: 1 }).lean();
  return NextResponse.json(shifts.map((shift) => serializeShift(shift as never)));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const employeeId = String(body.employeeId ?? "").trim();
  const employee = employeeId ? await Employee.findById(employeeId).lean() : null;
  if (!employee) return NextResponse.json({ error: "a valid employee is required" }, { status: 400 });

  const date = String(body.date ?? "").trim();
  const startTime = String(body.startTime ?? "").trim();
  const finishTime = String(body.finishTime ?? "").trim();
  const lunchMinutes = numeric(body.lunchMinutes);
  const extraHours = numeric(body.extraHours);
  const calculated = calculateShiftHours(startTime, finishTime, lunchMinutes);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "a valid date is required" }, { status: 400 });
  if (!calculated) return NextResponse.json({ error: "valid start and finish times are required" }, { status: 400 });

  try {
    const created = await Shift.create({
      employeeId,
      employeeName: String(employee.name ?? "").trim(),
      date,
      startTime,
      finishTime,
      lunchMinutes,
      extraHours,
      hours: calculated.hours,
      chargeableHours: calculated.chargeableHours,
      notes: String(body.notes ?? "").trim(),
      attendance: SHIFT_ATTENDANCE.includes(body.attendance) ? body.attendance : "unmarked",
    });
    await logActivity({
      action: "added",
      entityType: "shift",
      entityName: String(employee.name ?? employeeId),
      entityId: String(created._id),
      details: `${date} · ${startTime}–${finishTime}`,
    });
    return NextResponse.json(serializeShift(created.toObject() as never), { status: 201 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "This employee already has a shift on that date." }, { status: 409 });
    }
    throw error;
  }
}

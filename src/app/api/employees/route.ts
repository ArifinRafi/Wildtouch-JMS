import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Employee, nextEmployeeId, serializeEmployee } from "@/lib/models/Employee";
import { EMPLOYEES_SEED } from "@/lib/data/employees";
import { logActivity } from "@/lib/activity";

export async function GET() {
  await connectDB();
  if (await Employee.countDocuments({}) === 0) {
    await Employee.insertMany(EMPLOYEES_SEED.map(({ id, ...employee }) => ({ _id: id, ...employee })));
  }
  const employees = await Employee.find({}).sort({ name: 1 }).lean();
  return NextResponse.json(employees.map(serializeEmployee));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const _id = await nextEmployeeId();
  const created = await Employee.create({
    _id,
    name,
    address: String(body.address ?? "").trim(),
    city: String(body.city ?? "").trim(),
    contactNumber: String(body.contactNumber ?? "").trim(),
    email: String(body.email ?? "").trim(),
  });
  await logActivity({ action: "added", entityType: "employee", entityName: name, entityId: _id });
  return NextResponse.json(serializeEmployee(created.toObject()), { status: 201 });
}

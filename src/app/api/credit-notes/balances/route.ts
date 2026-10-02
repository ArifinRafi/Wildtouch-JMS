import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { sessionUser } from "@/lib/authz";
import { getCreditBalances } from "@/lib/credit-notes";

export async function GET(request: NextRequest) {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "manager") {
    return NextResponse.json({ error: "credit balances require admin or manager" }, { status: 403 });
  }
  await connectDB();
  const clientId = request.nextUrl.searchParams.get("clientId")?.trim() || undefined;
  return NextResponse.json(await getCreditBalances(clientId));
}

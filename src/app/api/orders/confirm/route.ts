import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { createConfirmedOrder, type ConfirmedOrderInput } from "@/lib/orders/create-confirmed-order";

export async function POST(request: NextRequest) {
  await connectDB();
  const body = (await request.json()) as ConfirmedOrderInput;
  try {
    const result = await createConfirmedOrder(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "could not confirm order";
    const status = message === "no line items" || message === "client is required" ? 400 : 500;
    console.error("Could not confirm order", error);
    return NextResponse.json({ error: message }, { status });
  }
}

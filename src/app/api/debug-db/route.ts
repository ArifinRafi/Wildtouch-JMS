import { NextResponse } from "next/server";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

/** Strip any credential blob (//user:pass@) from a string before returning it. */
function redact(str: string, uri?: string): string {
  let out = str.replace(/mongodb(\+srv)?:\/\/[^\s'"]*@/gi, "mongodb$1://****:****@");
  if (uri) {
    const m = uri.match(/\/\/[^:@/]+:([^@]+)@/);
    if (m?.[1]) out = out.split(m[1]).join("****");
  }
  return out;
}

export async function GET() {
  const uri = process.env.MONGODB_URI;
  const info: Record<string, unknown> = {
    present: !!uri,
    length: uri?.length ?? 0,
    startsWithSrv: uri?.startsWith("mongodb+srv://") ?? false,
    startsWithStd: uri?.startsWith("mongodb://") ?? false,
    containsEncodedAt: uri?.includes("%40") ?? false,
  };

  if (uri) {
    const afterScheme = uri.replace(/^mongodb(\+srv)?:\/\//, "");
    const totalAt = (afterScheme.match(/@/g) || []).length;
    info.totalAtCount = totalAt; // >1 means an unencoded @ is inside the password
    const at = afterScheme.indexOf("@");
    const rest = at >= 0 ? afterScheme.slice(at + 1) : afterScheme;
    const slash = rest.indexOf("/");
    const hostPart = slash >= 0 ? rest.slice(0, slash) : rest;
    info.host = hostPart; // if this contains "@", the password has a raw @
    info.dbName = (slash >= 0 ? rest.slice(slash + 1) : "").split("?")[0] || "(none)";
  }

  try {
    const conn = await mongoose
      .createConnection(uri || "", { serverSelectionTimeoutMS: 8000 })
      .asPromise();
    const count = await conn.db!.collection("components").estimatedDocumentCount();
    await conn.close();
    info.connect = "ok";
    info.componentsCount = count;
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };
    info.connect = "failed";
    info.errorName = err?.name ?? "Unknown";
    info.errorMessage = redact(String(err?.message ?? e), uri);
  }

  return NextResponse.json(info);
}

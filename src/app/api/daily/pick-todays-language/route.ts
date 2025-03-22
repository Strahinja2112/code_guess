import { db } from "@/server/db";
import { NextResponse } from "next/server";

export async function GET() {
  // const todaysLanguagePick = await db.

  return new NextResponse(
    JSON.stringify({ langugage: "TypeScript" }, null, 2),
    { status: 200 },
  );
}

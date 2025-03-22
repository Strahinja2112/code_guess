import { createTodaysLanguagePick } from "@/server/lang-actions";
import { NextResponse } from "next/server";

export async function GET() {
  const { alreadyPicked, langugage, status } = await createTodaysLanguagePick();

  return new NextResponse(JSON.stringify({ alreadyPicked, langugage }), {
    status,
  });
}

import { languages } from "@/lib/config";
import { db } from "@/server/db";
import { type Language } from "@/types";
import { isSameDay } from "date-fns";
import { NextResponse } from "next/server";

export async function GET() {
  const allPicks = await db.languagePick.findMany();

  const todaysPick = allPicks.find((pick) =>
    isSameDay(pick.createdAt, new Date()),
  );

  if (!!todaysPick) {
    return new NextResponse(
      JSON.stringify(
        { alreadyPicked: true, langugage: todaysPick.languageName },
        null,
        2,
      ),
      { status: 200 },
    );
  }

  let randomLanguage: Language | undefined = undefined;

  while (!randomLanguage) {
    randomLanguage = languages[Math.floor(Math.random() * languages.length)];
  }

  let success = false;

  while (!success) {
    try {
      const { id } = await db.languagePick.create({
        data: {
          languageName: randomLanguage.name,
        },
      });

      if (!id) {
        throw new Error("Something went wrong.");
      }

      success = true;
    } catch (error) {
      console.error(error);
    }
  }

  return new NextResponse(
    JSON.stringify(
      { alreadyPicked: false, langugage: randomLanguage.name },
      null,
      2,
    ),
    { status: 200 },
  );
}

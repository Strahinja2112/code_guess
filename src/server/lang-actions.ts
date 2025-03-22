"use server";

import { isSameDay } from "date-fns";
import { db } from "./db";

export async function getTodaysLanguagePick(): Promise<string | null> {
  const allPicks = await db.languagePick.findMany();

  const todaysPick = allPicks.find((pick) =>
    isSameDay(pick.createdAt, new Date()),
  );

  if (!todaysPick) {
    return null;
  }

  return todaysPick.languageName;
}

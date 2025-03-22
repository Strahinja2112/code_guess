"use server";

import { languages } from "@/lib/config";
import { type Language } from "@/types";
import { isSameDay } from "date-fns";
import { db } from "./db";

export async function getTodaysLanguagePick(): Promise<string> {
  const allPicks = await db.languagePick.findMany();

  const todaysPick = allPicks.find((pick) =>
    isSameDay(pick.createdAt, new Date()),
  );

  if (!todaysPick) {
    return (await createTodaysLanguagePick()).langugage;
  }

  return todaysPick.languageName;
}

export async function createTodaysLanguagePick(): Promise<{
  alreadyPicked: boolean;
  langugage: string;
  status: number;
}> {
  const allPicks = await db.languagePick.findMany();

  const todaysPick = allPicks.find((pick) =>
    isSameDay(pick.createdAt, new Date()),
  );

  if (!!todaysPick) {
    return {
      alreadyPicked: true,
      langugage: todaysPick.languageName,
      status: 200,
    };
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

  return {
    alreadyPicked: false,
    langugage: randomLanguage.name,
    status: 200,
  };
}

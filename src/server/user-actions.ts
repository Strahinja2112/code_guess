"use server";

import { type Prisma } from "@prisma/client";
import { isSameDay } from "date-fns";
import { db } from "./db";

export async function createDailyTry(data: Prisma.DailyTryCreateArgs["data"]) {
  const allUserTries = await db.dailyTry.findMany({
    where: {
      userId: data.userId,
    },
  });

  // nije bas najbrze ali ne znam kako drugacije da napravim isto samo koristeci
  // prizmu
  const alreadyExisting = allUserTries.some((tryItem) =>
    isSameDay(tryItem.createdAt, new Date()),
  );

  if (alreadyExisting) {
    throw new Error("Daily try already exists! Can't create another.");
  }

  await db.dailyTry.create({
    data,
  });
}

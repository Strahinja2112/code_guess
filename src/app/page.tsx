import { MainGame } from "@/components/main-game";
import { getTodaysLanguagePick } from "@/server/lang-actions";
import { checkIfUserTriedToday } from "@/server/user-actions";

export default async function MainPage() {
  const userDailyTry = await checkIfUserTriedToday();
  const todaysLanguage = await getTodaysLanguagePick();

  return (
    <MainGame userDailyTry={userDailyTry} todaysLanguage={todaysLanguage} />
  );
}

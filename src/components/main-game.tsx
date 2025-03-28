"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { languages, MAX_TRIES, siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { createDailyTry } from "@/server/user-actions";
import {
  type AttributeMatch,
  type AttributeState,
  type Command,
  type Direction,
} from "@/types";
import { type DailyTry } from "@prisma/client";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Check,
  LogIn,
  LogOut,
  Terminal,
  X,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

const DEFAULT_ATTRIBUTES: Record<string, AttributeState> = {
  paradigm: { value: [], match: "hidden" },
  typing: { value: "", match: "hidden" },
  garbageCollection: { value: false, match: "hidden" },
  designedBy: { value: "", match: "hidden" },
  firstAppeared: { value: 0, match: "hidden" },
  mainUseCase: { value: "", match: "hidden" },
};

type Props = {
  todaysLanguage: string;
  userDailyTry?: DailyTry;
};

export function MainGame({ userDailyTry, todaysLanguage }: Props) {
  const { data: session, status } = useSession();

  const [guess, setGuess] = useState("");
  const [gameState, setGameState] = useState<"WON" | "LOST" | "PLAYING">(
    "PLAYING",
  );
  const [attempts, setAttempts] = useState(0);

  const [commandHistory, setCommandHistory] = useState<Command[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const [attributes, setAttributes] = useState(DEFAULT_ATTRIBUTES);

  const targetLanguage = languages.find((lang) => lang.name === todaysLanguage);

  const lastMessageRef = useRef<HTMLDivElement>(null);

  const canUserPlay = !userDailyTry && session?.user && gameState === "PLAYING";

  useEffect(() => {
    async function create() {
      if (!session?.user) return;

      try {
        await createDailyTry({
          userId: session.user.id,
          success: gameState === "WON",
        });

        console.log("Daily try created!");
      } catch (error) {
        console.error(error);
      }
    }

    if (gameState === "PLAYING") {
      return;
    }

    void create();

    return () => {
      void create();
    };
  }, [gameState, session?.user]);

  useEffect(() => {
    if (attempts >= MAX_TRIES) {
      setGameState("LOST");
    }
  }, [attempts]);

  useEffect(() => {
    startNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [commandHistory]);

  function startNewGame(): void {
    if (status === "loading") {
      return;
    }

    setGameState("PLAYING");
    setGuess("");
    setAttempts(0);
    setAttributes(DEFAULT_ATTRIBUTES);

    const newHistory: Command[] = [
      { text: "$ ./language-guesser", type: "command" },
      { text: "Checking your identity...", type: "info" },
    ];

    debugger;

    if (status === "authenticated") {
      newHistory.push({
        text: `Identity check success. Welcome, ${session.user.name?.split(" ")[0] ?? "User"}!`,
        type: "success",
      });

      if (!!userDailyTry) {
        newHistory.push({
          text: userDailyTry.success
            ? "You have already WON today! Congratulations! See you tomorrow."
            : "You have already played today. Please try again tomorrow.",
          type: userDailyTry.success ? "info" : "error",
        });
      } else {
        newHistory.push(
          { text: "Initializing language database...", type: "info" },
          { text: "Loading game module...", type: "info" },
          {
            text: "All systems ready. Type a language name and press Enter to execute.",
            type: "success",
          },
        );
      }
    } else if (status === "unauthenticated") {
      newHistory.push({
        text: "Identity check failure. Please log in to continue.",
        type: "error",
      });
    }

    setCommandHistory(newHistory);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  function handleGuess(): void {
    if (!guess.trim()) return;

    const isLastTry = attempts === MAX_TRIES - 1;
    const lastTryErrorCommand: Command = {
      text: "This was your last attempt. You lost todays game. Please try again tomorrow.",
      type: "error",
    };

    const currentGuess = guess.trim();
    setAttempts((attempts) => attempts + 1);
    setCommandHistory((prev) => [
      ...prev,
      { text: "", type: "command" },
      { text: `$ execute --lang="${currentGuess}"`, type: "command" },
    ]);

    if (currentGuess.toLowerCase() === targetLanguage?.name?.toLowerCase()) {
      setGameState("WON");

      const newAttributes = { ...attributes };
      Object.keys(newAttributes).forEach((key) => {
        newAttributes[key] = {
          value: targetLanguage[key as keyof typeof targetLanguage],
          match: "exact",
          direction: null,
        };
      });
      setAttributes(newAttributes);

      setCommandHistory((prev) => [
        ...prev,
        {
          text: `Match found! Language identified: ${targetLanguage.name}`,
          type: "success",
        },
        { text: "SUCCESS: All properties verified ✓", type: "success" },
      ]);

      return;
    }

    const guessedLanguage = languages.find(
      (lang) => lang.name.toLowerCase() === currentGuess.toLowerCase(),
    );

    if (!guessedLanguage) {
      const newCommands: Command[] = [
        {
          text: `ERROR: Language "${currentGuess}" not found in database.`,
          type: "error",
        },
      ];

      if (isLastTry) {
        setGameState("LOST");
        setCommandHistory((prev) => [
          ...prev,
          ...newCommands,
          lastTryErrorCommand,
        ]);
      } else {
        setCommandHistory((prev) => [
          ...prev,
          {
            text: `ERROR: Language "${currentGuess}" not found in database.`,
            type: "error",
          },
          { text: "Try another language identifier.", type: "warning" },
        ]);
      }

      setGuess("");

      return;
    }

    type MatchResultType = "success" | "warning" | "error" | "info";

    const newAttributes = { ...attributes };
    const matchResults: {
      text: string;
      type: MatchResultType;
    }[] = [];

    Object.keys(newAttributes).forEach((key) => {
      const targetValue = targetLanguage?.[key as keyof typeof targetLanguage];
      const guessedValue = guessedLanguage[key as keyof typeof guessedLanguage];

      let matchState: AttributeMatch = "wrong";
      let direction: Direction | null = null;

      if (Array.isArray(targetValue) && Array.isArray(guessedValue)) {
        const hasOverlap = targetValue.some((v) => guessedValue.includes(v));

        matchState = hasOverlap
          ? JSON.stringify(targetValue) === JSON.stringify(guessedValue)
            ? "exact"
            : "close"
          : "wrong";
      } else if (key === "firstAppeared") {
        const diff = Math.abs(Number(targetValue) - Number(guessedValue));

        matchState =
          targetValue === guessedValue
            ? "exact"
            : diff <= 5
              ? "close"
              : "wrong";

        if (Number(guessedValue) < Number(targetValue)) {
          direction = "up";
        } else if (Number(guessedValue) > Number(targetValue)) {
          direction = "down";
        }
      } else {
        matchState = targetValue === guessedValue ? "exact" : "wrong";
      }

      newAttributes[key] = {
        value: targetValue ?? "",
        match: matchState,
        direction,
      };

      const formattedKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      let matchSymbol =
        matchState === "exact" ? "✓" : matchState === "close" ? "≈" : "✗";

      if (key === "firstAppeared" && direction) {
        matchSymbol += direction === "up" ? " ↑" : " ↓";
      }

      let resultType: MatchResultType = "info";
      if (matchState === "exact") resultType = "success";
      else if (matchState === "close") resultType = "warning";
      else if (matchState === "wrong") resultType = "error";

      matchResults.push({
        text: `${formattedKey}: ${matchSymbol}`,
        type: resultType,
      });
    });

    setAttributes(newAttributes);
    const newCommands: Command[] = [
      {
        text: `Comparing properties of "${currentGuess}" with target language:`,
        type: "info",
      },
      ...matchResults,
    ];
    if (isLastTry) {
      setGameState("LOST");
      setCommandHistory((prev) => [
        ...prev,
        ...newCommands,
        lastTryErrorCommand,
      ]);
    } else {
      setCommandHistory((prev) => [
        ...prev,
        ...newCommands,
        { text: "Analysis complete. Try another language.", type: "info" },
      ]);
    }

    setGuess("");
  }

  function getMatchColor(match: AttributeMatch): string {
    switch (match) {
      case "exact":
        return "text-green-500";
      case "close":
        return "text-yellow-500";
      case "wrong":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  }

  function getTerminalTextColor(
    type: "command" | "error" | "success" | "info" | "warning",
  ): string {
    switch (type) {
      case "command":
        return "text-green-500 drop-shadow-[0_0_7px_rgba(34,197,94)]";
      case "error":
        return "text-red-500";
      case "success":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "info":
      default:
        return "text-gray-300";
    }
  }

  function formatValue(value: string | number | boolean | string[]) {
    if (Array.isArray(value)) return `[${value.join(", ")}]`;

    if (typeof value === "boolean") return value ? "true" : "false";

    if (typeof value === "string") return `"${value}"`;

    return value.toString();
  }

  if (status === "loading") {
    return null;
  }

  return (
    <div className="container relative z-10 mx-auto min-h-screen max-w-4xl px-5 py-8 font-mono text-green-400">
      <header className="mb-5 flex items-center justify-between border-b border-green-900 pb-3">
        <div className="flex items-center">
          <Terminal className="mr-2 size-8 text-green-500" />
          <h1 className="text-3xl font-bold text-green-500 drop-shadow-[0_0_5px_rgba(44,197,94,0.5)]">
            {siteConfig.name}.sh
          </h1>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={async () => {
              if (status === "unauthenticated") {
                await signIn("google");
              } else {
                await signOut();
              }
            }}
            className="border-green-900 text-green-400 hover:bg-green-900/30 hover:text-green-300"
          >
            {status === "authenticated" ? (
              <>
                <LogOut className="h-4 w-4" />
                Sign Out
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
        </div>
      </header>

      {process.env.NODE_ENV === "development" && gameState === "PLAYING" && (
        <div className="mb-5">Chosen language is: {todaysLanguage}</div>
      )}

      {gameState === "WON" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="my-5 rounded-md border border-green-800 bg-green-900/20 p-4 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
        >
          <div className="flex items-center">
            <Check className="mr-2 h-5 w-5 text-green-500" />
            <span>
              Success! Target language identified:{" "}
              <span className="font-bold text-green-300 drop-shadow-[0_0_2px_rgba(134,239,172,0.5)]">
                {todaysLanguage}
              </span>
            </span>
          </div>
        </motion.div>
      )}

      {/* Terminal output area */}
      <section className="mb-5 overflow-hidden rounded-md border border-green-900 bg-[#0f0f0f] shadow-[0_0_10px_rgba(34,197,94,0.2)]">
        <div className="flex items-center justify-between border-b border-green-900/50 bg-[#111111] px-4 py-1.5 text-sm">
          <span className="text-green-500">TERMINAL</span>
          <div className="flex gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-red-800"></span>
            <span className="h-3.5 w-3.5 rounded-full bg-yellow-800"></span>
            <span className="h-3.5 w-3.5 rounded-full bg-green-800"></span>
          </div>
        </div>
        <div
          ref={terminalRef}
          className="hide-scrollbar h-72 overflow-y-scroll bg-[#0a0a0a] p-5 font-mono text-sm"
        >
          {commandHistory.map((line, index) => (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              key={index}
              ref={index === commandHistory.length - 1 ? lastMessageRef : null}
              className={`mb-1.5 ${getTerminalTextColor(line.type)}`}
            >
              {line.text === "" ? <br /> : line.text}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Input area */}
      <div
        className={cn(
          "mb-6 overflow-hidden rounded-md border border-green-900 bg-[#0f0f0f] shadow-[0_0_10px_rgba(34,197,94,0.2)]",
          !session?.user && "pointer-events-none select-none",
        )}
      >
        <div className="flex items-center justify-between border-b border-green-900/50 bg-[#111111] px-4 py-1.5 text-sm">
          <span className="text-green-500">INPUT</span>
          <span
            className={cn(
              "text-green-500",
              attempts >= MAX_TRIES - 4 && "text-yellow-500",
              attempts >= MAX_TRIES - 2 && "text-red-500",
            )}
          >
            {attempts}/{MAX_TRIES} tries
          </span>
        </div>
        <div className="flex items-center bg-[#0a0a0a] p-3">
          <span className="mr-2 text-base text-green-500 drop-shadow-[0_0_2px_rgba(34,197,94,0.5)]">
            $
          </span>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Enter language name..."
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleGuess();
              }
            }}
            className="flex-1 border-0 bg-transparent py-4 text-xs text-green-400 placeholder:text-green-900 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={!canUserPlay}
          />
          <Button
            onClick={handleGuess}
            className="ml-3 border border-green-800 bg-green-900/50 px-5 text-green-400 hover:bg-green-800 hover:text-green-300"
            disabled={!canUserPlay}
          >
            Execute
          </Button>
        </div>
      </div>

      {/* Code-like attribute display */}
      <div
        className={cn(
          "overflow-hidden rounded-md border border-green-900 bg-[#0f0f0f] shadow-[0_0_10px_rgba(34,197,94,0.2)]",
          !canUserPlay ? "pointer-events-none select-none" : "",
        )}
      >
        <div className="flex items-center justify-between border-b border-green-900/50 bg-[#111111] px-4 py-1.5 text-sm">
          <span className="text-green-500">LANGUAGE_PROPERTIES.json</span>
          <span className="text-green-900">Read-only</span>
        </div>
        <div className="bg-[#0a0a0a] p-5 font-mono text-base">
          <div className="flex">
            <div className="mr-5 select-none text-right text-green-900">
              {Array.from({ length: Object.keys(attributes).length + 2 }).map(
                (_, i) => (
                  <div key={i} className="leading-relaxed">
                    {i + 1}
                  </div>
                ),
              )}
            </div>
            <div className="flex-1">
              <div className="leading-relaxed text-green-600">{"{"}</div>
              {Object.entries(attributes).map(
                ([key, { value, match, direction }], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="ml-6 flex items-center leading-relaxed"
                  >
                    <span className="text-cyan-500">{`"${key}"`}</span>
                    <span className="mr-1.5 text-green-400">:</span>
                    <span className={`${getMatchColor(match)}`}>
                      {match !== "hidden" ? formatValue(value) : '"???"'}
                    </span>
                    {index < Object.keys(attributes).length - 1 && (
                      <span className="text-green-400">,</span>
                    )}
                    <div className="ml-3 flex items-center">
                      {match === "exact" && (
                        <Check className="inline h-5 w-5 text-green-500 drop-shadow-[0_0_3px_rgba(34,197,94,0.7)]" />
                      )}
                      {match === "wrong" && (
                        <X className="inline h-5 w-5 text-red-500 drop-shadow-[0_0_3px_rgba(239,68,68,0.7)]" />
                      )}

                      {/* Direction indicators for numeric values */}
                      {key === "firstAppeared" &&
                        direction === "up" &&
                        match !== "exact" && (
                          <ArrowUp className="ml-1 h-4 w-4 text-blue-400" />
                        )}
                      {key === "firstAppeared" &&
                        direction === "down" &&
                        match !== "exact" && (
                          <ArrowDown className="ml-1 h-4 w-4 text-blue-400" />
                        )}
                    </div>
                  </motion.div>
                ),
              )}
              <div className="leading-relaxed text-green-600">{"}"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

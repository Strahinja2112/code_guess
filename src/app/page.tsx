"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Check,
  RefreshCw,
  Terminal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Sample data - in a real app, this would come from a database or API
const languages = [
  {
    name: "JavaScript",
    year: 1995,
    paradigm: ["Object-oriented", "Functional", "Event-driven"],
    typing: "Dynamic",
    garbageCollection: true,
    designedBy: "Brendan Eich",
    firstAppeared: 1995,
    mainUseCase: "Web",
  },
  {
    name: "Python",
    year: 1991,
    paradigm: ["Object-oriented", "Functional", "Imperative"],
    typing: "Dynamic",
    garbageCollection: true,
    designedBy: "Guido van Rossum",
    firstAppeared: 1991,
    mainUseCase: "General-purpose",
  },
  {
    name: "Rust",
    year: 2010,
    paradigm: ["Multi-paradigm", "Concurrent"],
    typing: "Static",
    garbageCollection: false,
    designedBy: "Graydon Hoare",
    firstAppeared: 2010,
    mainUseCase: "Systems",
  },
  {
    name: "Go",
    year: 2009,
    paradigm: ["Concurrent", "Imperative", "Structured"],
    typing: "Static",
    garbageCollection: true,
    designedBy: "Robert Griesemer, Rob Pike, Ken Thompson",
    firstAppeared: 2009,
    mainUseCase: "Systems",
  },
  {
    name: "TypeScript",
    year: 2012,
    paradigm: ["Object-oriented", "Functional"],
    typing: "Static",
    garbageCollection: true,
    designedBy: "Anders Hejlsberg",
    firstAppeared: 2012,
    mainUseCase: "Web",
  },
];

type AttributeMatch = "exact" | "close" | "wrong" | "hidden";

interface AttributeState {
  value: string | number | boolean | string[];
  match: AttributeMatch;
  direction?: "up" | "down" | null;
}

interface Command {
  text: string;
  type: "command" | "error" | "success" | "info" | "warning";
}

const DEFAULT_ATTRIBUTES: Record<string, AttributeState> = {
  paradigm: { value: [], match: "hidden" },
  typing: { value: "", match: "hidden" },
  garbageCollection: { value: false, match: "hidden" },
  designedBy: { value: "", match: "hidden" },
  firstAppeared: { value: 0, match: "hidden" },
  mainUseCase: { value: "", match: "hidden" },
};

export default function ProgrammingLanguageGame() {
  const [guess, setGuess] = useState("");
  const [targetLanguage, setTargetLanguage] = useState(languages[0]);
  const [gameWon, setGameWon] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const [commandHistory, setCommandHistory] = useState<Command[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const [attributes, setAttributes] = useState(DEFAULT_ATTRIBUTES);

  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startNewGame();
    setCommandHistory([
      { text: "$ ./language-guesser", type: "command" },
      { text: "Initializing language database...", type: "info" },
      { text: "Loading game module...", type: "info" },
      {
        text: "Ready. Type a language name and press Enter to execute.",
        type: "success",
      },
    ]);

    // Adding class to body element
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [commandHistory]);

  function startNewGame(): void {
    const randomIndex = Math.floor(Math.random() * languages.length);
    setTargetLanguage(languages[randomIndex]);
    setGameWon(false);
    setGuess("");
    setAttempts(0);
    setAttributes(DEFAULT_ATTRIBUTES);
    setCommandHistory(() => [
      { text: "$ ./reset.sh", type: "command" },
      { text: "Resetting game state...", type: "info" },
      { text: "Selecting new random language...", type: "info" },
      { text: "Game reset complete. Ready for new input.", type: "success" },
    ]);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  function handleGuess(): void {
    if (!guess.trim()) return;

    const currentGuess = guess.trim();
    setAttempts(attempts + 1);
    setCommandHistory((prev) => [
      ...prev,
      { text: "", type: "command" },
      { text: `$ execute --lang="${currentGuess}"`, type: "command" },
    ]);

    if (currentGuess.toLowerCase() === targetLanguage?.name.toLowerCase()) {
      setGameWon(true);

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
      setCommandHistory((prev) => [
        ...prev,
        {
          text: `ERROR: Language "${currentGuess}" not found in database.`,
          type: "error",
        },
        { text: "Try another language identifier.", type: "warning" },
      ]);

      setGuess("");

      return;
    }

    // Update attributes based on the guess
    const newAttributes = { ...attributes };
    const matchResults: {
      text: string;
      type: "success" | "warning" | "error" | "info";
    }[] = [];

    // Always reveal attributes, but with different match states
    Object.keys(newAttributes).forEach((key) => {
      const targetValue = targetLanguage?.[key as keyof typeof targetLanguage];
      const guessedValue = guessedLanguage[key as keyof typeof guessedLanguage];
      let matchState: AttributeMatch = "wrong";
      let direction: "up" | "down" | null = null;

      if (Array.isArray(targetValue) && Array.isArray(guessedValue)) {
        // For arrays like paradigm, check for any overlapping values
        const hasOverlap = targetValue.some((v) => guessedValue.includes(v));
        matchState = hasOverlap
          ? JSON.stringify(targetValue) === JSON.stringify(guessedValue)
            ? "exact"
            : "close"
          : "wrong";
      } else if (key === "firstAppeared") {
        // For years, consider "close" if within 5 years
        const diff = Math.abs(Number(targetValue) - Number(guessedValue));
        matchState =
          targetValue === guessedValue
            ? "exact"
            : diff <= 5
              ? "close"
              : "wrong";

        // Add direction for years
        if (Number(guessedValue) < Number(targetValue)) {
          direction = "up"; // Guessed too low, need to go up
        } else if (Number(guessedValue) > Number(targetValue)) {
          direction = "down"; // Guessed too high, need to go down
        }
      } else {
        // For simple values
        matchState = targetValue === guessedValue ? "exact" : "wrong";
      }

      newAttributes[key] = {
        value: targetValue ?? "",
        match: matchState,
        direction,
      };

      // Add to match results for terminal output
      const formattedKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      let matchSymbol =
        matchState === "exact" ? "✓" : matchState === "close" ? "≈" : "✗";

      // Add direction indicators to terminal output for years
      if (key === "firstAppeared" && direction) {
        matchSymbol += direction === "up" ? " ↑" : " ↓";
      }

      let resultType: "success" | "warning" | "error" | "info" = "info";
      if (matchState === "exact") resultType = "success";
      else if (matchState === "close") resultType = "warning";
      else if (matchState === "wrong") resultType = "error";

      matchResults.push({
        text: `${formattedKey}: ${matchSymbol}`,
        type: resultType,
      });
    });

    setAttributes(newAttributes);
    setCommandHistory((prev) => [
      ...prev,
      {
        text: `Comparing properties of "${currentGuess}" with target language:`,
        type: "info",
      },
      ...matchResults,
      { text: "Analysis complete. Try another language.", type: "info" },
    ]);
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
        return "text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94)]";
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

  return (
    <div className="relative min-h-screen bg-[#090909] font-mono text-green-400">
      {/* <MatrixRain /> */}
      <div className="container relative z-10 mx-auto max-w-4xl px-5 py-8">
        <div className="mb-5 flex items-center justify-between border-b border-green-900 pb-3">
          <div className="flex items-center">
            <Terminal className="mr-2 size-8 text-green-500" />
            <h1 className="text-3xl font-bold text-green-500 drop-shadow-[0_0_5px_rgba(44,197,94,0.5)]">
              language_guesser.sh
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={startNewGame}
            className="border-green-900 text-green-400 hover:bg-green-900/30 hover:text-green-300"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Terminal output area */}
        <div className="mb-5 overflow-hidden rounded-md border border-green-900 bg-[#0f0f0f] shadow-[0_0_10px_rgba(34,197,94,0.2)]">
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
              <div
                key={index}
                ref={
                  index === commandHistory.length - 1 ? lastMessageRef : null
                }
                className={`mb-1.5 ${getTerminalTextColor(line.type)}`}
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="mb-6 overflow-hidden rounded-md border border-green-900 bg-[#0f0f0f] shadow-[0_0_10px_rgba(34,197,94,0.2)]">
          <div className="border-b border-green-900/50 bg-[#111111] px-4 py-1.5 text-sm">
            <span className="text-green-500">INPUT</span>
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
              onKeyDown={(e) => e.key === "Enter" && handleGuess()}
              className="flex-1 border-0 bg-transparent py-4 text-xs text-green-400 placeholder:text-green-900 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={gameWon}
            />
            <Button
              onClick={handleGuess}
              className="ml-3 border border-green-800 bg-green-900/50 px-5 text-green-400 hover:bg-green-800 hover:text-green-300"
              disabled={gameWon}
            >
              Execute
            </Button>
          </div>
        </div>

        {/* Code-like attribute display */}
        <div className="overflow-hidden rounded-md border border-green-900 bg-[#0f0f0f] shadow-[0_0_10px_rgba(34,197,94,0.2)]">
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
                      <span className="mx-1.5 text-green-400">:</span>
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
                        {match === "close" && (
                          <Badge className="ml-1.5 bg-yellow-700 px-[5px]">
                            <span className="translate-y-[2px] text-xs">≈</span>
                          </Badge>
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

        {gameWon && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-md border border-green-800 bg-green-900/20 p-4 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
          >
            <div className="flex items-center">
              <Check className="mr-2 h-5 w-5 text-green-500" />
              <span>
                Success! Target language identified:{" "}
                <span className="font-bold text-green-300 drop-shadow-[0_0_2px_rgba(134,239,172,0.5)]">
                  {targetLanguage?.name}
                </span>
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Matrix Rain Effect Component
// function MatrixRain() {
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     // Set canvas dimensions
//     const resizeCanvas = () => {
//       canvas.width = window.innerWidth;
//       canvas.height = window.innerHeight;
//     };

//     resizeCanvas();
//     window.addEventListener("resize", resizeCanvas);

//     // Matrix characters (using a mix of katakana, latin and digits)
//     const chars =
//       "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//     const charArray = chars.split("");

//     // Create drops
//     const fontSize = 14;
//     const columns = Math.floor(canvas.width / fontSize);
//     const drops: number[] = [];

//     // Initialize drops
//     for (let i = 0; i < columns; i++) {
//       drops[i] = Math.floor(Math.random() * -canvas.height);
//     }

//     // Drawing function
//     const draw = () => {
//       // Add semi-transparent black rectangle on top of previous frame
//       ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       // Set text color and font
//       ctx.fillStyle = "#0F0"; // Bright green
//       ctx.font = `${fontSize}px monospace`;

//       // Draw characters
//       for (let i = 0; i < drops.length; i++) {
//         // Random character
//         const char = charArray[Math.floor(Math.random() * charArray.length)];

//         // Draw character
//         const x = i * fontSize;
//         const y = drops[i] * fontSize;

//         // Add glow effect
//         ctx.shadowColor = "#0F0";
//         ctx.shadowBlur = 10;
//         ctx.fillText(char, x, y);
//         ctx.shadowBlur = 0;

//         // Move drop down
//         drops[i]++;

//         // Reset drop if it reaches bottom or randomly
//         if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
//           drops[i] = Math.floor(Math.random() * -20);
//         }
//       }
//     };

//     // Animation loop
//     const interval = setInterval(draw, 50);

//     return () => {
//       clearInterval(interval);
//       window.removeEventListener("resize", resizeCanvas);
//     };
//   }, []);

//   return (
//     <canvas
//       ref={canvasRef}
//       className="fixed left-0 top-0 -z-10 h-full w-full opacity-20"
//     />
//   );
// }

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Check, RefreshCw, Terminal, X } from "lucide-react";
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
}

export default function ProgrammingLanguageGame() {
  const [darkMode, setDarkMode] = useState(true);
  const [guess, setGuess] = useState("");
  const [targetLanguage, setTargetLanguage] = useState(languages[0]);
  const [gameWon, setGameWon] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [attributes, setAttributes] = useState<Record<string, AttributeState>>({
    paradigm: { value: [], match: "hidden" },
    typing: { value: "", match: "hidden" },
    garbageCollection: { value: false, match: "hidden" },
    designedBy: { value: "", match: "hidden" },
    firstAppeared: { value: 0, match: "hidden" },
    mainUseCase: { value: "", match: "hidden" },
  });

  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Initialize a new game
  useEffect(() => {
    startNewGame();
    // Add initial terminal messages
    setCommandHistory([
      "$ ./language-guesser",
      "Initializing language database...",
      "Loading game module...",
      "Ready. Type a language name and press Enter to execute.",
    ]);
  }, []);

  // Toggle dark mode class on body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    // Smooth scroll to the bottom when command history changes
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [commandHistory]);

  const startNewGame = () => {
    const randomIndex = Math.floor(Math.random() * languages.length);
    setTargetLanguage(languages[randomIndex]);
    setGameWon(false);
    setGuess("");
    setAttempts(0);
    setAttributes({
      paradigm: { value: [], match: "hidden" },
      typing: { value: "", match: "hidden" },
      garbageCollection: { value: false, match: "hidden" },
      designedBy: { value: "", match: "hidden" },
      firstAppeared: { value: 0, match: "hidden" },
      mainUseCase: { value: "", match: "hidden" },
    });
    setCommandHistory((prev) => [
      ...prev,
      "$ ./reset.sh",
      "Resetting game state...",
      "Selecting new random language...",
      "Game reset complete. Ready for new input.",
    ]);

    // Focus the input after reset
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleGuess = () => {
    if (!guess.trim()) return;

    const currentGuess = guess.trim();
    setAttempts(attempts + 1);
    setCommandHistory((prev) => [
      ...prev,
      `$ execute --lang="${currentGuess}"`,
    ]);

    // Check if guess is correct
    if (currentGuess.toLowerCase() === targetLanguage.name.toLowerCase()) {
      setGameWon(true);
      // Reveal all attributes as exact matches
      const newAttributes = { ...attributes };
      Object.keys(newAttributes).forEach((key) => {
        newAttributes[key] = {
          value: targetLanguage[key as keyof typeof targetLanguage],
          match: "exact",
        };
      });
      setAttributes(newAttributes);
      setCommandHistory((prev) => [
        ...prev,
        `Match found! Language identified: ${targetLanguage.name}`,
        "SUCCESS: All properties verified ✓",
      ]);
      return;
    }

    // Find the guessed language
    const guessedLanguage = languages.find(
      (lang) => lang.name.toLowerCase() === currentGuess.toLowerCase(),
    );

    if (!guessedLanguage) {
      setCommandHistory((prev) => [
        ...prev,
        `ERROR: Language "${currentGuess}" not found in database.`,
        "Try another language identifier.",
      ]);
      setGuess("");
      return;
    }

    // Update attributes based on the guess
    const newAttributes = { ...attributes };
    const matchResults: string[] = [];

    // Always reveal attributes, but with different match states
    Object.keys(newAttributes).forEach((key) => {
      const targetValue = targetLanguage[key as keyof typeof targetLanguage];
      const guessedValue = guessedLanguage[key as keyof typeof guessedLanguage];
      let matchState: AttributeMatch = "wrong";

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
      } else {
        // For simple values
        matchState = targetValue === guessedValue ? "exact" : "wrong";
      }

      newAttributes[key] = { value: targetValue, match: matchState };

      // Add to match results for terminal output
      const formattedKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      const matchSymbol =
        matchState === "exact" ? "✓" : matchState === "close" ? "≈" : "✗";
      matchResults.push(`${formattedKey}: ${matchSymbol}`);
    });

    setAttributes(newAttributes);
    setCommandHistory((prev) => [
      ...prev,
      `Comparing properties of "${currentGuess}" with target language:`,
      ...matchResults,
      "Analysis complete. Try another language.",
    ]);
    setGuess("");
  };

  const getMatchColor = (match: AttributeMatch) => {
    switch (match) {
      case "exact":
        return "text-green-500 dark:text-green-400";
      case "close":
        return "text-yellow-500 dark:text-yellow-400";
      case "wrong":
        return "text-red-500 dark:text-red-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  const formatValue = (value: string | number | boolean | string[]) => {
    if (Array.isArray(value)) return `[${value.join(", ")}]`;
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "string") return `"${value}"`;
    return value.toString();
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] font-mono text-gray-300 dark:bg-[#1e1e1e]">
      <div className="container mx-auto max-w-4xl px-5 py-8">
        <div className="mb-5 flex items-center justify-between border-b border-gray-700 pb-3">
          <div className="flex items-center">
            <Terminal className="mr-2 h-6 w-6 text-green-500" />
            <h1 className="text-xl font-bold text-green-500">
              language_guesser.sh
            </h1>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={startNewGame}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={() => setDarkMode(!darkMode)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {darkMode ? "Light Theme" : "Dark Theme"}
            </Button>
          </div>
        </div>

        {/* Terminal output area */}
        <div className="mb-5 overflow-hidden rounded-md border border-gray-700 bg-[#252526] shadow-md">
          <div className="flex items-center justify-between bg-[#333333] px-4 py-1.5 text-sm">
            <span>TERMINAL</span>
            <div className="flex gap-1.5">
              <span className="h-3.5 w-3.5 rounded-full bg-red-500"></span>
              <span className="h-3.5 w-3.5 rounded-full bg-yellow-500"></span>
              <span className="h-3.5 w-3.5 rounded-full bg-green-500"></span>
            </div>
          </div>
          <div
            ref={terminalRef}
            className="hide-scrollbar h-56 overflow-y-scroll p-5 font-mono text-sm"
          >
            {commandHistory.map((line, index) => (
              <div
                key={index}
                ref={
                  index === commandHistory.length - 1 ? lastMessageRef : null
                }
                className={`mb-1.5 ${line.startsWith("$") ? "text-green-400" : ""}`}
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="mb-6 overflow-hidden rounded-md border border-gray-700 bg-[#252526] shadow-md">
          <div className="bg-[#333333] px-4 py-1.5 text-sm">
            <span>INPUT</span>
          </div>
          <div className="flex items-center p-3">
            <span className="mr-2 text-base text-green-500">$</span>
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter language name..."
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGuess()}
              className="flex-1 border-0 bg-transparent py-4 text-xs text-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={gameWon}
            />
            <Button
              onClick={handleGuess}
              className="ml-3 bg-green-700 px-5 text-white hover:bg-green-800"
              disabled={gameWon}
            >
              Execute
            </Button>
          </div>
        </div>

        {/* Code-like attribute display */}
        <div className="overflow-hidden rounded-md border border-gray-700 bg-[#252526] shadow-md">
          <div className="flex items-center justify-between bg-[#333333] px-4 py-1.5 text-sm">
            <span>LANGUAGE_PROPERTIES.json</span>
            <span className="text-gray-500">Read-only</span>
          </div>
          <div className="p-5 font-mono text-base">
            <div className="flex">
              <div className="mr-5 select-none text-right text-gray-500">
                {Array.from({ length: Object.keys(attributes).length + 2 }).map(
                  (_, i) => (
                    <div key={i} className="leading-relaxed">
                      {i + 1}
                    </div>
                  ),
                )}
              </div>
              <div className="flex-1">
                <div className="leading-relaxed text-blue-400">{"{"}</div>
                {Object.entries(attributes).map(
                  ([key, { value, match }], index) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="ml-6 flex items-center leading-relaxed"
                    >
                      <span className="text-cyan-400">{`"${key}"`}</span>
                      <span className="mx-1.5 text-white">:</span>
                      <span className={`${getMatchColor(match)}`}>
                        {match !== "hidden" ? formatValue(value) : '"???"'}
                      </span>
                      {index < Object.keys(attributes).length - 1 && (
                        <span className="text-white">,</span>
                      )}
                      <div className="ml-3">
                        {match === "exact" && (
                          <Check className="inline h-5 w-5 text-green-500" />
                        )}
                        {match === "close" && (
                          <Badge className="ml-1.5 bg-yellow-700 px-1.5 text-xs">
                            ≈
                          </Badge>
                        )}
                        {match === "wrong" && (
                          <X className="inline h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </motion.div>
                  ),
                )}
                <div className="leading-relaxed text-blue-400">{"}"}</div>
              </div>
            </div>
          </div>
        </div>

        {gameWon && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-md border border-green-700 bg-green-900/30 p-4 text-green-400"
          >
            <div className="flex items-center">
              <Check className="mr-2 h-5 w-5" />
              <span>
                Success! Target language identified:{" "}
                <span className="font-bold">{targetLanguage.name}</span>
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

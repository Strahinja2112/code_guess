export type Direction = "up" | "down";

export type AttributeMatch = "exact" | "close" | "wrong" | "hidden";

export type AttributeState = {
  value: string | number | boolean | string[];
  match: AttributeMatch;
  direction?: Direction | null;
};

export type Command = {
  text: string;
  type: "command" | "error" | "success" | "info" | "warning";
};

export type Language = {
  name: string;
  paradigm: string[];
  typing: string;
  garbageCollection: boolean;
  designedBy: string;
  firstAppeared: number;
  mainUseCase: string;
};

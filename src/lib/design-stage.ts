export const DESIGN_STAGES = [
  "New concept idea",
  "Research",
  "Template",
  "Feedback to client",
  "Feedback from client",
  "Feedback to river",
  "Feedback from river",
  "CAD",
  "Metal Cut",
  "Sample",
] as const;

export type DesignStage = (typeof DESIGN_STAGES)[number];

export const DESIGN_DEFAULT_STAGE: DesignStage = "New concept idea";
export const DESIGN_RIVER_STAGE: DesignStage = "Template";
export const DESIGN_FINAL_STAGE: DesignStage = "Sample";

const LEGACY_STAGE_MAP: Record<string, DesignStage> = {
  "New Design Request": "New concept idea",
  Research: "Research",
  Feedback: "Feedback from client",
  "New Design Template": "Template",
};

export function isDesignStage(value: unknown): value is DesignStage {
  return typeof value === "string" && (DESIGN_STAGES as readonly string[]).includes(value);
}

/** Keeps older tracker rows readable after the stage workflow changes. */
export function normalizeDesignStage(value: unknown, wasCompleted = false): DesignStage {
  if (isDesignStage(value)) return value;
  if (typeof value === "string" && LEGACY_STAGE_MAP[value]) return LEGACY_STAGE_MAP[value];
  return wasCompleted ? DESIGN_RIVER_STAGE : DESIGN_DEFAULT_STAGE;
}

/** A design remains available in River after it first reaches Template. */
export function isRiverReadyStage(value: unknown): boolean {
  if (!isDesignStage(value)) return false;
  return DESIGN_STAGES.indexOf(value) >= DESIGN_STAGES.indexOf(DESIGN_RIVER_STAGE);
}

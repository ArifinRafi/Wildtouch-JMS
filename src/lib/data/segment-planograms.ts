// Shared registry for the segment-grid planograms (All Designs Keyrings / Magnets):
// segments × rows × 3 product columns. Used by the planogram pages AND the order wizard.

import { KEYRING_SEGMENTS } from "./large-keyrings";
import { MAGNET_SEGMENTS } from "./magnets";

export interface SegProduct {
  name: string;
  image: string | null;
}
export interface SegmentDef {
  id: string;
  title: string;
  shortTitle: string;
  color: string;
  bgTint: string;
  rows: (SegProduct | null)[][];
}
export interface SegmentPlanogram {
  id: string;
  name: string;
  columns: number;
  segments: SegmentDef[];
}

export const SEGMENT_PLANOGRAMS: SegmentPlanogram[] = [
  {
    id: "all-designs-large-keyrings",
    name: "All Designs Large Keyrings",
    columns: 3,
    segments: KEYRING_SEGMENTS as unknown as SegmentDef[],
  },
  {
    id: "all-designs-magnets",
    name: "All Designs Magnets",
    columns: 3,
    segments: MAGNET_SEGMENTS as unknown as SegmentDef[],
  },
];

export function getSegmentPlanogram(id: string): SegmentPlanogram | null {
  return SEGMENT_PLANOGRAMS.find((p) => p.id === id) ?? null;
}

export function isSegmentPlanogram(id: string): boolean {
  return SEGMENT_PLANOGRAMS.some((p) => p.id === id);
}

/** Initial quantities: [segIdx][rowIdx][colIdx] = 0. */
export function buildInitialSegQty(pg: SegmentPlanogram): number[][][] {
  return pg.segments.map((seg) => seg.rows.map((row) => row.map(() => 0)));
}

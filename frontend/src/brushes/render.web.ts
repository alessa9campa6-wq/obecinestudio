// Web: no Skia offscreen rendering, callers fall back to SVG.
import type { Stroke } from "../strokes";

export type RenderOpts = { width: number; format?: "png" | "jpeg"; quality?: number };
export const peekDataUri = (_s: Stroke[], _a: string | undefined, _o: RenderOpts): string | null => null;
export const strokesToDataUri = (_s: Stroke[], _a: string | undefined, _o: RenderOpts): string | null => null;
export const enqueueRender = (job: () => void) => job();

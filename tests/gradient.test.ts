import { describe, it, expect } from "vitest";
import { sampleGradient, scaleBrightness, lighten, rgbString } from "@/lib/gradient";

describe("sunset gradient", () => {
  it("returns valid RGB channels across the range", () => {
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const c = sampleGradient(t);
      for (const ch of [c.r, c.g, c.b]) {
        expect(ch).toBeGreaterThanOrEqual(0);
        expect(ch).toBeLessThanOrEqual(255);
      }
    }
  });

  it("is deterministic for the same position", () => {
    expect(sampleGradient(0.5)).toEqual(sampleGradient(0.5));
  });

  it("clamps out-of-range inputs to the end stops", () => {
    expect(sampleGradient(-1)).toEqual(sampleGradient(0));
    expect(sampleGradient(2)).toEqual(sampleGradient(1));
  });

  it("changes colour from top to bottom (continuous, not flat)", () => {
    expect(sampleGradient(0)).not.toEqual(sampleGradient(1));
  });

  it("scaleBrightness darkens and lighten brightens", () => {
    const base = { r: 100, g: 100, b: 100 };
    expect(scaleBrightness(base, 0.5)).toEqual({ r: 50, g: 50, b: 50 });
    const lit = lighten(base, 0.5);
    expect(lit.r).toBeGreaterThan(100);
  });

  it("formats rgb/rgba strings", () => {
    expect(rgbString({ r: 1, g: 2, b: 3 })).toBe("rgb(1,2,3)");
    expect(rgbString({ r: 1, g: 2, b: 3 }, 0.5)).toBe("rgba(1,2,3,0.5)");
  });
});

/**
 * Smooth pan-and-zoom interpolation (van Wijk & Nuij, "Smooth and efficient
 * zooming and panning", 2003) — the same model as d3.interpolateZoom.
 *
 * Views are [cx, cy, w]: the world point at the screen center and the visible
 * world width. Long moves ease out a little before easing back in, which keeps
 * the destination in view and makes travel between distant stars legible.
 */
export type ZoomView = [number, number, number];

const EPS2 = 1e-12;
const cosh = (x: number) => ((x = Math.exp(x)) + 1 / x) / 2;
const sinh = (x: number) => ((x = Math.exp(x)) - 1 / x) / 2;
const tanh = (x: number) => ((x = Math.exp(2 * x)) - 1) / (x + 1);

export function interpolateZoom(p0: ZoomView, p1: ZoomView, rho = 1.1) {
  const rho2 = rho * rho;
  const rho4 = rho2 * rho2;
  const [ux0, uy0, w0] = p0;
  const [ux1, uy1, w1] = p1;
  const dx = ux1 - ux0;
  const dy = uy1 - uy0;
  const d2 = dx * dx + dy * dy;
  let S: number;
  let fn: (t: number) => ZoomView;

  if (d2 < EPS2) {
    S = Math.log(w1 / w0) / rho;
    fn = (t) => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)];
  } else {
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    S = (r1 - r0) / rho;
    fn = (t) => {
      const s = t * S;
      const coshr0 = cosh(r0);
      const u = (w0 / (rho2 * d1)) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
      return [ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / cosh(rho * s + r0)];
    };
  }
  return { at: fn, length: Math.abs(S) };
}

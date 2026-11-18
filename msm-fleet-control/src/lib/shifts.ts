import { span } from "./logic";
export const SHIFTS: Record<string, { start: string; end: string }> = {
  "Shift 1": { start: "06:00", end: "13:59" }, "Shift 2": { start: "14:00", end: "21:59" },
};
/** Jam kerja dalam jam; pulang <= masuk dianggap keesokan harinya (shift melewati tengah malam). */
export function hours(inT: string, outT: string) { const [a, b] = span({ start: inT, end: outT }); return Math.round((b - a) / 6) / 10; }

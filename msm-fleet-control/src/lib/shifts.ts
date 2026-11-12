import { span } from "./logic";
export const SHIFTS: Record<string, { start: string; end: string }> = {
  "Shift 1": { start: "06:00", end: "13:59" }, "Shift 2": { start: "14:00", end: "21:59" }, "Shift 3": { start: "22:00", end: "05:59" },
  Pagi: { start: "07:00", end: "19:00" }, Malam: { start: "19:00", end: "07:00" },
};
/** Jam kerja dalam jam; pulang <= masuk dianggap keesokan harinya (shift melewati tengah malam). */
export function hours(inT: string, outT: string) { const [a, b] = span({ start: inT, end: outT }); return Math.round((b - a) / 6) / 10; }

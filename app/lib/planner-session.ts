import { z } from "zod";

const weight = z.number().min(0).max(10);
export const plannerSessionSchema = z.object({
  location: z.object({
    name: z.string(), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180),
    farmId: z.string().optional(), areaHectares: z.number().nonnegative().optional(),
    boundary: z.array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])).optional(),
  }).nullable(),
  profile: z.object({ rotation: z.array(z.string()).length(3), soil: z.string(), water: z.string(), equipment: z.string(), market: z.string() }),
  priorities: z.object({ water: weight, soil: weight, income: weight, erosion: weight, nitrogen: weight, practicality: weight }),
  scenario: z.enum(["typical", "dry", "wet", "hotter"]),
  selectionMode: z.enum(["boundary", "pin"]),
});
export const PLANNER_SESSION_KEY = "musim-planner-v1";

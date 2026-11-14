import { climatePeriod, summariseClimate } from "../../../lib/climate";
import { fetchPowerRange } from "../../../lib/power";

// GET /api/nasa/power?lat=..&lng=..
// Five complete calendar years of NASA POWER daily data for the point, summarised into a
// climate profile. If NASA can't answer, this returns an error: there is no stand-in data.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return Response.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
  }

  const { startYear, endYear } = climatePeriod(new Date());
  try {
    const data = await fetchPowerRange(lng, lat, `${startYear}-01-01`, `${endYear}-12-31`, {
      init: { next: { revalidate: 86_400 } },
    });
    return Response.json(summariseClimate(data));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "NASA POWER is unavailable." },
      { status: 502 },
    );
  }
}

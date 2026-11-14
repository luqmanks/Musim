const CAPABILITIES_URL =
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml";

const LAYERS = {
  "true-color": "MODIS_Terra_CorrectedReflectance_TrueColor",
  "ground-heat": "MODIS_Terra_Land_Surface_Temp_Day",
  "soil-moisture": "SMAP_L3_Passive_Enhanced_Day_Soil_Moisture",
} as const;

function extractLayerDate(xml: string, identifier: string): string | null {
  const layer = xml
    .match(/<Layer>[\s\S]*?<\/Layer>/g)
    ?.find((entry) => entry.includes(`<ows:Identifier>${identifier}</ows:Identifier>`));
  return layer?.match(/<Default>(\d{4}-\d{2}-\d{2})<\/Default>/)?.[1] ?? null;
}

export async function GET() {
  try {
    const response = await fetch(CAPABILITIES_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`NASA GIBS returned ${response.status}`);
    const xml = await response.text();
    const dates = Object.fromEntries(
      Object.entries(LAYERS).map(([key, identifier]) => [
        key,
        extractLayerDate(xml, identifier),
      ]),
    );
    if (Object.values(dates).some((date) => !date)) {
      throw new Error("NASA GIBS capability dates were incomplete");
    }

    return Response.json(
      {
        source: "NASA EOSDIS GIBS",
        sourceUrl: CAPABILITIES_URL,
        retrievedAt: new Date().toISOString(),
        dates,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "NASA GIBS unavailable",
      },
      { status: 503 },
    );
  }
}

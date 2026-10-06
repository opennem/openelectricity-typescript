/**
 * Splice AEMO's rooftop solar forecast onto rooftop solar actuals
 *
 * Rooftop actuals land 30 to 60 minutes behind the 5 minute feed. The
 * forecast fills the gap from the last actual interval forward.
 *
 * Point at another API with OPENELECTRICITY_API_URL, e.g.
 * OPENELECTRICITY_API_URL=https://api.oedev.org/v4 bun run examples/rooftop_forecast.ts
 */

import { OpenElectricityClient, stripTimezone } from "../src"

async function main(): Promise<void> {
  const client = new OpenElectricityClient()

  const { response: actual } = await client.getNetworkData("NEM", ["power"], {
    interval: "5m",
    fueltech: ["solar_rooftop"],
  })
  const actualPoints = (actual.data[0]?.results[0]?.data ?? []).filter(
    ([, value]) => value !== null,
  )
  const lastActual = actualPoints[actualPoints.length - 1]?.[0]
  if (!lastActual) throw new Error("No rooftop actuals returned")

  // date_end defaults to the end of the latest forecast run
  const { response: forecast } = await client.getMarket(
    "NEM",
    ["solar_rooftop_forecast"],
    { interval: "5m", dateStart: stripTimezone(lastActual) },
  )
  const forecastSeries = forecast.data[0]
  console.log(`Forecast run: ${forecastSeries?.forecast_run_time}`)

  // Actual wins where present, forecast fills the rest
  const spliced = new Map<number, { value: number | null; source: string }>()
  for (const [ts, value] of forecastSeries?.results[0]?.data ?? []) {
    spliced.set(Date.parse(ts), { value, source: "forecast" })
  }
  for (const [ts, value] of actualPoints) {
    spliced.set(Date.parse(ts), { value, source: "actual" })
  }

  const rows = [...spliced.entries()]
    .sort(([a], [b]) => a - b)
    .map(([ts, point]) => ({ interval: new Date(ts).toISOString(), ...point }))
  console.table(rows.slice(-48))
}

main().catch(console.error)

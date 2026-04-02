import { OpenElectricityClient } from "../src";

const client = new OpenElectricityClient({
  baseUrl: "https://api.openelectricity.org.au/v4",
  apiKey: "oe_3ZZVEtEQ16HsQ5uPccDLDToU",
});

const { response, datatable } = await client.getMarket(
  "NEM",
  ["flow_imports", "flow_exports"],
  {
    interval: "5m",
    primaryGrouping: "network_region",
  }
);

if (datatable) {
  // Find latest interval with actual data
  const withData = datatable.filter((r) => r.flow_imports !== null || r.flow_exports !== null);
  const latest = new Date(withData.getLatestTimestamp());
  const rows = withData.filter((r) => r.interval.getTime() === latest.getTime());
  console.log(`Latest interval: ${latest.toISOString()}`);
  console.table(rows.toConsole());
}

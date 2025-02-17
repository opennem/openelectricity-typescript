// test the limit of the auth token

import { OpenElectricityClient } from "@openelectricity/client"

async function main(): Promise<void> {
  const client = new OpenElectricityClient()

  const { datatable } = await client.getMarket("NEM", ["price"], {
    dateStart: "2024-01-01",
    dateEnd: "2024-01-02",
    interval: "1h",
    primaryGrouping: "network",
  })
  console.log(datatable)
}

main()

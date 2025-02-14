import OpenElectricityClient from '@openelectricity/client'
import { useEffect, useState } from 'react'

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const client = new OpenElectricityClient({
          apiKey: import.meta.env.VITE_OPENELECTRICITY_API_KEY
        })

        const response = await client.getNetworkPower('NEM', {
          interval: '5m',
          primaryGrouping: 'network_region'
        })

        setData(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Current Power Generation</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

export default App
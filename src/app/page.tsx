import Client from "./client"

export default async function Home() {
  const initialHeartbeat = await fetch('https://health.nobu.sh/').then(res => res.json())
  
  return <Client initialHeartbeat={initialHeartbeat} />
}


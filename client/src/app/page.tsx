import Client from "./client"
import { SocketProvider } from "./socket-provider"

export default async function Home() {
  const initialHeartbeat = await fetch('https://health.nobu.sh/', {
    cache: 'no-cache',
  }).then(res => res.json())
  
  return <SocketProvider initialHeartbeat={initialHeartbeat}>
    <Client />
  </SocketProvider>
}


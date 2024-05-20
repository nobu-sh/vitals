"use client";

import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

export interface Heartbeat {
  bpm: number
  timestamp: number
}

export interface SocketContextProps {
  socket: WebSocket | null
  latestHeartbeat: Heartbeat
}
const SocketContext = createContext<SocketContextProps>({
  latestHeartbeat: {
    bpm: 69,
    timestamp: 69
  },
  socket: null
});

export const SocketProvider = ({ children, initialHeartbeat }: PropsWithChildren<{
  initialHeartbeat: Heartbeat
}>) => {
  const [heartbeart, setHeartbeat] = useState<Heartbeat>(initialHeartbeat);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    const socket = new WebSocket('wss://gateway.nobu.sh');
    setSocket(socket);
    
    socket.onopen = () => {
      socket.send("sub:nobu_health")
      console.debug('[s]', 'connected!')
    }
    socket.onclose = () => {
      console.debug('[s]', 'disconnected!')
    }
    socket.onerror = (error) => {
      console.error('[s] error:', error)
    }
    socket.onmessage = (event) => {
      const data = String(event.data)
      
      if (data === "ack") {
        return socket.send('nack')
      }
      
      const [action, ...rest] = data.split(':')
      if (action !== "pub") {
        return console.debug('[s]', `${action}: ${rest.join(':')}`)
      }
      
      const [channels, ...payload] = rest.join(':').split(':')
      if (!channels.includes('nobu_health')) {
        return console.debug('[s]', `pub: ${channels}: ${payload.join(':')}`)
      }
      
      const message = JSON.parse(payload.join(':'))
      setHeartbeat({
        bpm: message.bpm,
        timestamp: message.at
      })
      
      console.debug('[s]', `health update:`, message)
    }
    
    return () => {
      socket.close();
      setSocket(null);
    }
  }, []);
  
  return (
    <SocketContext.Provider value={{ latestHeartbeat: heartbeart, socket }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext);

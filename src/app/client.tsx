'use client';

import Heart from '@/icons/Heart'

import styles from './client.module.css'
import { useCallback, useEffect, useRef, useState } from 'react';
import { VolumeX, Volume } from 'lucide-react';

export interface Heartbeat {
  id: number
  bpm: number
  timestamp: number
}

// Convert timestamp to time ago eg: 12s, 12m, 12h, 12d, 12w, 12m, 12y
function toRelativeTime(timestamp: number, currentDate = Date.now()) {
  const diff = currentDate - timestamp
  if (diff < 60 * 1000) {
    return `${Math.floor(diff / 1000)}s`
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / 1000 / 60)}m`
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / 1000 / 60 / 60)}h`
  } else if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / 1000 / 60 / 60 / 24)}d`
  } else if (diff < 30 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / 1000 / 60 / 60 / 24 / 7)}w`
  } else if (diff < 365 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / 1000 / 60 / 60 / 24 / 30)}m`
  } else {
    return `${Math.floor(diff / 1000 / 60 / 60 / 24 / 365)}y`
  }
}

export default function Client({ initialHeartbeat }: { initialHeartbeat: Heartbeat }) {
  const [dead, setDead] = useState(false)
  const [heartbeat, setHeartbeat] = useState<Heartbeat>(initialHeartbeat)
  const [muted, setMuted] = useState(true)
  const audio = useRef<HTMLAudioElement>(null)
  
  const [date, setDate] = useState<number>(Date.now())
  
  const updateHeartbeat = useCallback(async () => {
    const res = await fetch('https://health.nobu.sh/', { cache: 'no-cache' })
    const data = await res.json() as Heartbeat
    setHeartbeat(data)
  }, [])
  
  // Fetch api every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      updateHeartbeat().catch(console.error)
    }, 10000)
    return () => clearInterval(interval)
  }, [updateHeartbeat])
  
  // Fix react minified error #425
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDate(Date.now())
    }, 1000)
    
    return () => clearTimeout(timeout)
  }, [date])
  
  // Handles dead state
  useEffect(() => {
    if (heartbeat.timestamp < date - 12 * 60 * 60 * 1000) {
      setDead(true)
    } else {
      setDead(false)
    }
  }, [heartbeat, date])
  
  // Handles the audio
  useEffect(() => {
    try {
      if (!audio.current) return
      
      if (muted) {
        audio.current.muted = true
      } else {
        audio.current.muted = false
        
        if (dead) {
          audio.current.muted = true
        }
      }
      
      if (audio.current.paused) {
        audio.current.play()
      }
      
      audio.current.playbackRate = heartbeat.bpm / 60
    } catch (e) { console.error(e) }
  }, [dead, audio, heartbeat, muted])
  
  return (
    <main className="relative flex min-h-screen w-full justify-center items-center py-20 overflow-hidden">
      {
        muted 
          ? <VolumeX className='absolute top-4 right-4 w-8 h-8 stroke-neutral-500 cursor-pointer' strokeWidth={1} onClick={() => setMuted(false)} /> 
          : <Volume className='absolute top-4 right-4 w-8 h-8 stroke-neutral-500 cursor-pointer' strokeWidth={1} onClick={() => setMuted(true)} />
      }
      <div className="relative sm:w-[32rem] sm:h-[32rem] w-[16rem] h-[16rem] flex justify-center items-center">
      <h1 className={`absolute z-40 font-bold text-xl top-20 right-14 rotate-[30deg] text-neutral-500 ${dead ? 'opacity-100' : 'opacity-0'} transition-opacity`}>I am possibly dead..?</h1>
        <Heart className={`${styles.Heart} sm:w-[20rem] sm:h-[20rem] w-[10rem] h-[10rem] mt-[1.2rem] relative z-20`} style={{
          animationDuration: `${(60 / heartbeat.bpm).toFixed(2)}s`
        }} />
        <div className={`${styles.Circle} z-10 absolute w-full h-full rounded-full border-2 border-neutral-700 border-dashed`} />
        <div className="absolute z-30">
          <p className='font-bold sm:text-3xl text-xl text-center mt-5'>{heartbeat.bpm} bpm</p>
          <p className='text-center opacity-90 sm:text-base text-xs'>{toRelativeTime(heartbeat.timestamp, date)} ago</p>
        </div>
      </div>
      <div className={`${styles.Line} absolute h-[100vh] top-[-50vh]`}></div>
      <div className={`${styles.Line} absolute h-[100vh] bottom-[-50vh] rotate-180`}></div>
      <audio ref={audio} muted loop src='/heartbeat.wav' />
    </main>
  )
}


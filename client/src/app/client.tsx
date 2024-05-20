'use client';

import Heart from '@/icons/Heart';
import styles from './client.module.css';
import { useEffect, useRef, useState } from 'react';
import { VolumeX, Volume } from 'lucide-react';
import { useSocket } from './socket-provider';

export interface Heartbeat {
  id: number;
  bpm: number;
  timestamp: number;
}

// Convert timestamp to time ago eg: 12s, 12m, 12h, 12d, 12w, 12m, 12y
function toRelativeTime(timestamp: number, currentDate = Date.now()) {
  const diff = currentDate - timestamp;
  if (diff < 60 * 1000) {
    return `${Math.floor(diff / 1000)}s`;
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / 1000 / 60)}m`;
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / 1000 / 60 / 60)}h`;
  } else if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / 1000 / 60 / 60 / 24)}d`;
  } else if (diff < 30 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / 1000 / 60 / 60 / 24 / 7)}w`;
  } else if (diff < 365 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / 1000 / 60 / 60 / 24 / 30)}m`;
  } else {
    return `${Math.floor(diff / 1000 / 60 / 60 / 24 / 365)}y`;
  }
}

export default function Client() {
  const [dead, setDead] = useState(false);
  const { latestHeartbeat: heartbeat } = useSocket();
  const [muted, setMuted] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  // const animationFrameRef = useRef<number | null>(null);
  // const intervalRef = useRef<number | null>(null);

  
  // Fix react minified error #425
  const [date, setDate] = useState<number>(Date.now());
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDate(Date.now());
    }, 1000);

    return () => clearTimeout(timeout);
  }, [date]);

  // Handles dead state
  useEffect(() => {
    setDead(heartbeat.timestamp < date - 12 * 60 * 60 * 1000);
  }, [heartbeat, date]);

  // Initialize AudioContext and load audio buffer
  useEffect(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    fetch('/heartbeat.wav')
      .then(response => response.arrayBuffer())
      .then(data => audioContext.decodeAudioData(data))
      .then(buffer => {
        audioBufferRef.current = buffer;
      })
      .catch(error => console.error('Error loading audio file:', error));

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);
  
  // Handles audio with setInterval. requestAnimationFrame is preferred but gets throttled when the
  // tab loses focus. We want the sound to keep playing even when the tab is not focused.
  useEffect(() => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    const audioContext = audioContextRef.current;
    const audioBuffer = audioBufferRef.current;
    let nextHeartbeat = performance.now() + (60 / heartbeat.bpm) * 1000;
    
    function playHeartbeatSound() {
      try {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
      } catch (e) {
        console.error(e);
      }
    }
    
    function update() {
      const currentTime = performance.now();
      if (currentTime >= nextHeartbeat) {
        playHeartbeatSound();
        nextHeartbeat += (60 / heartbeat.bpm) * 1000;
      }
    }
    
    let interval: NodeJS.Timeout | null;
    if (!muted && !dead) {
      audioContext.resume().then(() => {
        interval = setInterval(update, 1);
      });
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [dead, heartbeat, muted])

  // // Handles the audio with requestAnimationFrame and setInterval fallback
  // useEffect(() => {
  //   if (!audioBufferRef.current || !audioContextRef.current) return;
  //   const audioContext = audioContextRef.current;
  //   const audioBuffer = audioBufferRef.current;
  //   let nextHeartbeat = performance.now() + (60 / heartbeat.bpm) * 1000;

    // function playHeartbeatSound() {
    //   try {
    //     const source = audioContext.createBufferSource();
    //     source.buffer = audioBuffer;
    //     source.connect(audioContext.destination);
    //     source.start(0);
    //   } catch (e) {
    //     console.error(e);
    //   }
    // }

    // function update() {
    //   const currentTime = performance.now();
    //   if (currentTime >= nextHeartbeat) {
    //     playHeartbeatSound();
    //     nextHeartbeat += (60 / heartbeat.bpm) * 1000;
    //   }
    //   if (!muted && !dead) {
    //     animationFrameRef.current = requestAnimationFrame(update);
    //   }
    // }

  //   function fallbackUpdate() {
  //     const currentTime = Date.now();
  //     if (currentTime >= nextHeartbeat) {
  //       playHeartbeatSound();
  //       nextHeartbeat += (60 / heartbeat.bpm) * 1000;
  //     }
  //   }

  //   if (!muted && !dead) {
  //     audioContext.resume().then(() => {
  //       if (document.hidden) {
  //         intervalRef.current = window.setInterval(fallbackUpdate, (60 / heartbeat.bpm) * 1000);
  //       } else {
  //         animationFrameRef.current = requestAnimationFrame(update);
  //       }
  //     });
  //   }

  //   function handleVisibilityChange() {
  //     if (document.hidden) {
  //       if (animationFrameRef.current) {
  //         cancelAnimationFrame(animationFrameRef.current);
  //       }
  //       intervalRef.current = window.setInterval(fallbackUpdate, (60 / heartbeat.bpm) * 1000);
  //     } else {
  //       if (intervalRef.current) {
  //         clearInterval(intervalRef.current);
  //       }
  //       animationFrameRef.current = requestAnimationFrame(update);
  //     }
  //   }

  //   document.addEventListener('visibilitychange', handleVisibilityChange);

  //   return () => {
  //     if (animationFrameRef.current) {
  //       cancelAnimationFrame(animationFrameRef.current);
  //     }
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //     }
  //     document.removeEventListener('visibilitychange', handleVisibilityChange);
  //   };
  // }, [dead, heartbeat, muted]);

  return (
    <main className="relative flex min-h-screen w-full justify-center items-center py-20 overflow-hidden">
      {muted ? (
        <VolumeX
          className="absolute top-4 right-4 w-8 h-8 stroke-neutral-500 cursor-pointer"
          strokeWidth={1}
          onClick={() => setMuted(false)}
        />
      ) : (
        <Volume
          className="absolute top-4 right-4 w-8 h-8 stroke-neutral-500 cursor-pointer"
          strokeWidth={1}
          onClick={() => setMuted(true)}
        />
      )}
      <div className="relative sm:w-[32rem] sm:h-[32rem] w-[16rem] h-[16rem] flex justify-center items-center">
        <h1
          className={`absolute z-40 font-bold sm:text-xl text-sm top-10 right-3 sm:top-20 sm:right-14 rotate-[30deg] text-neutral-500 ${
            dead ? 'opacity-100' : 'opacity-0'
          } transition-opacity`}
        >
          I am possibly dead..?
        </h1>
        <Heart
          className={`${styles.Heart} sm:w-[20rem] sm:h-[20rem] w-[10rem] h-[10rem] mt-[1.2rem] relative z-20`}
          style={{
            animationDuration: `${(60 / heartbeat.bpm).toFixed(2)}s`,
          }}
        />
        <div className={`${styles.Circle} z-10 absolute w-full h-full rounded-full border-2 border-neutral-700 border-dashed`} />
        <div className="absolute z-30">
          <p className="font-bold sm:text-3xl text-xl text-center mt-5">{heartbeat.bpm} bpm</p>
          <p className="text-center opacity-90 sm:text-base text-xs">{toRelativeTime(heartbeat.timestamp, date)} ago</p>
        </div>
      </div>
      <div className={`${styles.Line} absolute h-[100vh] top-[-50vh]`}></div>
      <div className={`${styles.Line} absolute h-[100vh] bottom-[-50vh] rotate-180`}></div>
    </main>
  );
}

// Attempts to publish an update to the RTC server

import { RtcKey, RtcUrl } from "./env";

export async function tryPostUpdate(bpm: number, at: number) {
  try {
    await fetch(RtcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RtcKey}`
      },
      body: JSON.stringify({
        channels: ['nobu_health'],
        message: JSON.stringify({ bpm, at })
      })
    })
  } catch  {}
}

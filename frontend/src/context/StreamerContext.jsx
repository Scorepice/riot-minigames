/**
 * StreamerContext.jsx
 * Global toggle: when streamer mode is ON the room code is blurred
 * and the game secret card is blurred until hovered.
 */
import { createContext, useContext, useState } from 'react'

const StreamerContext = createContext(null)

export function StreamerProvider({ children }) {
  const [streamerMode, setStreamerMode] = useState(false)
  const toggle = () => setStreamerMode((v) => !v)

  return (
    <StreamerContext.Provider value={{ streamerMode, toggle }}>
      {children}
    </StreamerContext.Provider>
  )
}

/** @returns {{ streamerMode: boolean, toggle: () => void }} */
export function useStreamer() {
  return useContext(StreamerContext)
}

import { ref } from 'vue'
import type { Track } from './useApi'

const WS_BASE = 'ws://45.88.137.131:8002'

export const useWebSocket = () => {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const tracks = ref<Map<number, Track>>(new Map())
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5

  const connect = (deviceId: number = 0) => {
    return new Promise<void>((resolve, reject) => {
      try {
        ws.value = new WebSocket(`${WS_BASE}/ws/${deviceId}`)

        ws.value.onopen = () => {
          isConnected.value = true
          reconnectAttempts.value = 0
          console.log(`WebSocket connected to /ws/${deviceId}`)
          resolve()
        }

        ws.value.onmessage = (event) => {
          try {
            const track: Track = JSON.parse(event.data)
            tracks.value.set(track.device_id, track)
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }

        ws.value.onerror = (error) => {
          console.error('WebSocket error:', error)
          isConnected.value = false
          reject(error)
        }

        ws.value.onclose = () => {
          isConnected.value = false
          console.log('WebSocket disconnected')
          attemptReconnect(deviceId)
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  const attemptReconnect = (deviceId: number) => {
    if (reconnectAttempts.value < maxReconnectAttempts) {
      reconnectAttempts.value++
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000)
      console.log(`Attempting reconnect in ${delay}ms (attempt ${reconnectAttempts.value})`)
      setTimeout(() => connect(deviceId).catch(() => {}), delay)
    }
  }

  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    isConnected.value = false
  }

  const getLatestTrack = (deviceId: number): Track | undefined => {
    return tracks.value.get(deviceId)
  }

  const getAllTracks = (): Track[] => {
    return Array.from(tracks.value.values())
  }

  return {
    connect,
    disconnect,
    isConnected,
    tracks,
    getLatestTrack,
    getAllTracks
  }
}

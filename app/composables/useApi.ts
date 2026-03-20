import axios from 'axios'

const API_BASE = 'http://45.88.137.131:8002/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

export interface Device {
  id: number
  name: string
  color: string
  created_at?: string
}

export interface Track {
  id: number
  device_id: number
  latitude: number
  longitude: number
  altitude?: number
  speed?: number
  timestamp: string
}

export const useApi = () => {
  // Device endpoints
  const createDevice = async (name: string, color: string = '#FF0000'): Promise<Device> => {
    const response = await api.post('/device', null, {
      params: { name, color }
    })
    return response.data
  }

  const getDevices = async (): Promise<Device[]> => {
    const response = await api.get('/devices')
    return response.data
  }

  const getTracks = async (deviceId: number): Promise<Track[]> => {
    const response = await api.get(`/device/${deviceId}/tracks`)
    return response.data
  }

  const deleteDevice = async (deviceId: number): Promise<void> => {
    await api.delete(`/device/${deviceId}`)
  }

  return {
    createDevice,
    getDevices,
    getTracks,
    deleteDevice
  }
}

<template>
  <div class="app-container">
    <div class="app-header">
      <h1> GPS Tracker</h1>
      <div class="status-bar">
        <span :class="{ 'status-connected': wsConnected, 'status-disconnected': !wsConnected }">
          {{ wsConnected ? '✓ Bağlı' : '✗ Bağlantı Kesildi' }}
        </span>
        <span class="device-count">{{ devices.length }} cihaz</span>
      </div>
    </div>

    <div class="app-content">
      <div class="sidebar">
        <DevicePanel
          :devices="devices"
          :last-tracks="lastTracks"
          @device-created="handleDeviceCreated"
          @device-deleted="handleDeviceDeleted"
        />
      </div>
      <div class="main">
        <MapView :devices="devices" :tracks="wsConnectedTracks" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Device, Track } from '~/composables/useApi'
import { useApi } from '~/composables/useApi'
import { useWebSocket } from '~/composables/useWebSocket'
import MapView from '~/components/MapView.vue'
import DevicePanel from '~/components/DevicePanel.vue'

const { getDevices } = useApi()
const { connect, disconnect, isConnected: wsConnected, tracks: wsConnectedTracks } = useWebSocket()

const devices = ref<Device[]>([])
const lastTracks = ref<Map<number, Track>>(new Map())
const isLoading = ref(true)
let checkInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  try {
    // Load initial devices
    devices.value = await getDevices()

    // Connect to WebSocket for listening to all devices
    await connect(0)

    // Sync tracks from WebSocket to lastTracks for UI (less frequent)
    checkInterval = setInterval(() => {
      wsConnectedTracks.value.forEach((track, deviceId) => {
        lastTracks.value.set(deviceId, track)
      })
    }, 200)
  } catch (error) {
    console.error('Initialization error:', error)
    alert('Başlatma hatası. Sayfayı yenileyin.')
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
  disconnect()
})

const handleDeviceCreated = async (device: Device) => {
  devices.value.push(device)
}

const handleDeviceDeleted = (deviceId: number) => {
  devices.value = devices.value.filter(d => d.id !== deviceId)
  wsConnectedTracks.value.delete(deviceId)
  lastTracks.value.delete(deviceId)
}
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0d0d0d;
}

.app-header {
  background: #0d0d0d;
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  border-bottom: 1px solid #333;
}

.app-header h1 {
  margin: 0;
  font-size: 1.75rem;
}

.status-bar {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
}

.status-connected {
  color: #4ade80;
  font-weight: bold;
}

.status-disconnected {
  color: #fca5a5;
  font-weight: bold;
}

.device-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.app-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 320px;
  background: #1a1a1a;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.main {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Responsive */
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .app-header h1 {
    font-size: 1.25rem;
  }

  .status-bar {
    gap: 1rem;
    font-size: 0.8rem;
  }

  .app-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-height: 35vh;
    border-bottom: 1px solid #333;
  }

  .main {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0.75rem 1rem;
  }

  .app-header h1 {
    font-size: 1rem;
  }

  .status-bar {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>

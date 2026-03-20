<template>
  <div class="map-container">
    <div ref="mapElement" class="map"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Track, Device } from '~/composables/useApi'

interface Props {
  devices: Device[]
  tracks: Map<number, Track>
}

const props = defineProps<Props>()

const mapElement = ref<HTMLElement | null>(null)
let map: any = null
const markers = ref<Map<number, any>>(new Map())
const isMapReady = ref(false)

// Lazy load Leaflet CSS
const loadLeafletCSS = () => {
  if (document.getElementById('leaflet-css')) return
  const link = document.createElement('link')
  link.id = 'leaflet-css'
  link.rel = 'stylesheet'
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
  document.head.appendChild(link)
}

onMounted(async () => {
  if (!mapElement.value) return

  loadLeafletCSS()

  // Dynamic import Leaflet
  const L = await import('leaflet').then(m => m.default)

  // Initialize map
  map = L.map(mapElement.value).setView([41.0082, 28.9784], 12) // Istanbul

  // Dark minimal tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    attribution: '&copy; CartoDB',
    noWrap: true
  }).addTo(map)

  // Fix Leaflet icon issue with bundlers
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iODIiIHZpZXdCb3g9IjAgMCA1MCA4MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI1IDAgQzExLjE5IDAgMCA4LjM5IDAgMjAgQzAgNDAgMjUgODIgMjUgODIgQzI1IDgyIDUwIDQwIDUwIDIwIEM1MCA4LjM5IDM4LjgxIDAgMjUgMCBaIiBmaWxsPSIjMzM4N2ZmIi8+CjxjaXJjbGUgY3g9IjI1IiBjeT0iMjAiIHI9IjgiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMCBDNS42IDAgMCA1LjYgMCAxMi41IEMwIDI1IDEyLjUgNDEgMTIuNSA0MSBDMTI1IDQxIDI1IDI1IDI1IDEyLjUgQzI1IDUuNiAxOS40IDAgMTIuNSAwIFoiIGZpbGw9IiMzMzg3ZmYiLz4KPGNpcmNsZSBjeD0iMTIuNSIgY3k9IjEyLjUiIHI9IjQiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
    shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjIwLjUiIGN5PSIzNCIgcng9IjE3IiByeT0iNiIgZmlsbD0iYmxhY2siIG9wYWNpdHk9IjAuMyIvPgo8L3N2Zz4=',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  })

  isMapReady.value = true
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})

// Cache for marker icons
const iconCache = new Map<string, any>()

const createColorMarkerIcon = async (color: string) => {
  if (iconCache.has(color)) {
    return iconCache.get(color)
  }

  const L = await import('leaflet').then(m => m.default)
  const svg = `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5S25 25 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
    <circle cx="12.5" cy="12.5" r="4" fill="white"/>
  </svg>`

  const icon = L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  })

  iconCache.set(color, icon)
  return icon
}

// Watch for track updates and update markers
watch(
  () => props.tracks,
  async () => {
    if (!map || !isMapReady.value) return

    const L = await import('leaflet').then(m => m.default)

    props.devices.forEach(async device => {
      const track = props.tracks.get(device.id)
      if (!track) return

      const marker = markers.value.get(device.id)
      if (marker) {
        // Update existing marker position
        marker.setLatLng([track.latitude, track.longitude])
      } else {
        // Create new marker
        const icon = await createColorMarkerIcon(device.color)
        const newMarker = L.marker([track.latitude, track.longitude], { icon })
          .bindPopup(`<strong>${device.name}</strong><br/>📍 ${track.latitude.toFixed(6)}, ${track.longitude.toFixed(6)}`)
          .addTo(map)

        markers.value.set(device.id, newMarker)
      }
    })
  },
  { deep: true }
)
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}

.map {
  width: 100%;
  height: 100%;
}
</style>

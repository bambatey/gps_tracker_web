<template>
  <div class="device-panel">
    <div class="panel-header">
      <h2>Cihazlar</h2>
      <button class="btn-new" @click="showNewDeviceModal = true">+ Yeni</button>
    </div>

    <div class="device-list">
      <div
        v-for="device in devices"
        :key="device.id"
        class="device-card"
        :style="{ borderLeftColor: device.color }"
      >
        <div class="device-info">
          <div class="device-name">{{ device.name }}</div>
          <div class="device-meta">ID: {{ device.id }}</div>
          <div v-if="lastTracks.get(device.id)" class="device-location">
             {{ lastTracks.get(device.id)?.latitude.toFixed(4) }},
            {{ lastTracks.get(device.id)?.longitude.toFixed(4) }}
          </div>
        </div>
        <div class="device-actions">
          <button class="btn-icon" @click="handleExport(device)" title="GPX İndir">
            
          </button>
          <button class="btn-icon btn-danger" @click="handleDelete(device.id)" title="Sil">
            
          </button>
        </div>
      </div>

      <div v-if="devices.length === 0" class="empty-state">
        Henüz cihaz yok. Yeni cihaz ekleyin.
      </div>
    </div>

    <!-- New Device Modal -->
    <div v-if="showNewDeviceModal" class="modal-overlay" @click.self="showNewDeviceModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Yeni Cihaz</h3>
          <button class="btn-close" @click="showNewDeviceModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Cihaz Adı</label>
            <input v-model="newDevice.name" type="text" placeholder="Örn: Araç 1" />
          </div>
          <div class="form-group">
            <label>Renk</label>
            <div class="color-picker">
              <input v-model="newDevice.color" type="color" />
              <span>{{ newDevice.color }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showNewDeviceModal = false">
            İptal
          </button>
          <button class="btn btn-primary" @click="handleCreate" :disabled="isLoading">
            {{ isLoading ? 'Oluşturuluyor...' : 'Oluştur' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Device, Track } from '~/composables/useApi'
import { useApi } from '~/composables/useApi'
import { generateGPX, downloadGPX } from '~/utils/gpx'

interface Props {
  devices: Device[]
  lastTracks: Map<number, Track>
}

interface Emits {
  (e: 'device-created', device: Device): void
  (e: 'device-deleted', deviceId: number): void
  (e: 'devices-refresh'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { createDevice, deleteDevice, getTracks } = useApi()

const showNewDeviceModal = ref(false)
const isLoading = ref(false)
const newDevice = ref({
  name: '',
  color: '#FF0000'
})

const handleCreate = async () => {
  if (!newDevice.value.name.trim()) {
    alert('Cihaz adı boş olamaz')
    return
  }

  isLoading.value = true
  try {
    const device = await createDevice(newDevice.value.name, newDevice.value.color)
    emit('device-created', device)
    showNewDeviceModal.value = false
    newDevice.value = { name: '', color: '#FF0000' }
  } catch (error) {
    console.error('Cihaz oluşturma hatası:', error)
    alert('Cihaz oluşturma başarısız oldu')
  } finally {
    isLoading.value = false
  }
}

const handleDelete = async (deviceId: number) => {
  if (!confirm('Bu cihazı silmek istediğinize emin misiniz?')) {
    return
  }

  try {
    await deleteDevice(deviceId)
    emit('device-deleted', deviceId)
  } catch (error) {
    console.error('Cihaz silme hatası:', error)
    alert('Cihaz silinemiyor')
  }
}

const handleExport = async (device: Device) => {
  try {
    const tracks = await getTracks(device.id)
    if (tracks.length === 0) {
      alert('Bu cihazın hiç kaydı yok')
      return
    }
    const gpxContent = generateGPX(device, tracks)
    const timestamp = new Date().toISOString().split('T')[0]
    downloadGPX(gpxContent, `${device.name}_${timestamp}`)
  } catch (error) {
    console.error('GPX indirme hatası:', error)
    alert('GPX dosyası indirilemiyor')
  }
}
</script>

<style scoped>
.device-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  border-right: 1px solid #333;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #fff;
}

.btn-new {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-new:hover {
  background: #0056b3;
}

.device-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.device-card {
  padding: 1rem;
  margin-bottom: 0.5rem;
  border: 1px solid #333;
  border-left: 4px solid;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #252525;
  transition: background 0.2s;
}

.device-card:hover {
  background: #2a2a2a;
}

.device-info {
  flex: 1;
}

.device-name {
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.25rem;
}

.device-meta {
  font-size: 0.85rem;
  color: #aaa;
}

.device-location {
  font-size: 0.85rem;
  color: #64b5f6;
  margin-top: 0.25rem;
}

.device-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

.btn-icon {
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: transform 0.2s;
}

.btn-icon:hover {
  transform: scale(1.2);
}

.btn-icon.btn-danger:hover {
  color: red;
}

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: #666;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1a1a1a;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #fff;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #fff;
}

.form-group input[type='text'] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #333;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
  background: #252525;
  color: #fff;
}

.color-picker {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-picker input[type='color'] {
  width: 50px;
  height: 40px;
  border: 1px solid #333;
  border-radius: 4px;
  cursor: pointer;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #333;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #333;
  color: #fff;
}

.btn-secondary:hover {
  background: #444;
}

/* Responsive */
@media (max-width: 768px) {
  .device-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #333;
  }

  .device-list {
    max-height: 300px;
  }
}
</style>

import type { Track, Device } from '~/composables/useApi'

export const generateGPX = (device: Device, tracks: Track[]): string => {
  const timestamp = new Date().toISOString()

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPS Tracker Web">
  <metadata>
    <name>${escapeXml(device.name)}</name>
    <time>${timestamp}</time>
  </metadata>
  <trk>
    <name>${escapeXml(device.name)}</name>
    <trkseg>\n`

  tracks.forEach(track => {
    gpx += `      <trkpt lat="${track.latitude}" lon="${track.longitude}">
        <time>${track.timestamp}</time>`

    if (track.altitude !== undefined) {
      gpx += `\n        <ele>${track.altitude}</ele>`
    }

    gpx += `\n      </trkpt>\n`
  })

  gpx += `    </trkseg>
  </trk>
</gpx>`

  return gpx
}

export const downloadGPX = (gpxContent: string, filename: string) => {
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.gpx`
  link.click()
  URL.revokeObjectURL(url)
}

const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

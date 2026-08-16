import { subscribe } from '../config/mqtt.js'
import supabase from '../config/supabase.js'
import { evaluateAlertRules } from './alertEngine.js'
import { broadcast } from './wsServer.js'

export function startIngestion() {
  // mqtt.js calls callbacks as: cb(parsedPayload, topicString)
  // parsedPayload is already a JS object — do NOT call .toString() / JSON.parse() on it again
  subscribe('devices/+/telemetry', async (payload, topic) => {
    try {
      // topic format: "devices/<mqtt_topic>/telemetry"
      const parts = topic.split('/')
      if (parts.length < 3) return
      const deviceMqttTopic = parts[1]

      // Resolve device by mqtt_topic slug
      const { data: device, error: deviceError } = await supabase
        .from('devices')
        .select('*')
        .eq('mqtt_topic', deviceMqttTopic)
        .single()

      if (deviceError || !device) {
        console.warn(`⚠️  MQTT: No device found for mqtt_topic="${deviceMqttTopic}"`)
        return
      }

      // Payload field map:
      // v=voltage, hz=frequency, a=current_a, kwh=energy_kwh,
      // pf=power_factor, w=power_load_w, t=temperature_c,
      // door=door_status (boolean → 'OPEN'/'CLOSED'), rssi=signal
      const telemetryRow = {
        device_id:    device.id,
        recorded_at:  new Date().toISOString(),   // ← correct column name
        voltage:      payload.v   !== undefined ? Number(payload.v)   : null,
        frequency:    payload.hz  !== undefined ? Number(payload.hz)  : null,
        current_a:    payload.a   !== undefined ? Number(payload.a)   : null,
        energy_kwh:   payload.kwh !== undefined ? Number(payload.kwh) : null,
        power_factor: payload.pf  !== undefined ? Number(payload.pf)  : null,
        power_load_w: payload.w   !== undefined ? Number(payload.w)   : null,
        temperature_c: payload.t  !== undefined ? Number(payload.t)   : null,
        // CHECK constraint requires uppercase: 'OPEN' or 'CLOSED'
        door_status:  payload.door !== undefined
          ? (payload.door ? 'OPEN' : 'CLOSED')
          : null,
        raw_payload:  payload
      }

      // Insert telemetry row
      const { error: telErr } = await supabase.from('telemetry').insert([telemetryRow])
      if (telErr) console.error('❌ Telemetry insert error:', telErr.message)

      // Update device live status
      // CHECK constraints: status IN ('ACTIVE','INACTIVE'), connection_status IN ('Connected','Disconnected')
      const deviceUpdates = {
        last_seen:         new Date().toISOString(),
        connection_status: 'Connected',   // ← was 'Online', which breaks CHECK constraint
        status:            'ACTIVE',       // ← was 'Active', must be uppercase
      }

      if (payload.w !== undefined) {
        deviceUpdates.power = Number(payload.w) > 0 ? 'ON' : 'OFF'
      }
      if (payload.rssi !== undefined) {
        const rssi = Number(payload.rssi)
        deviceUpdates.signal_strength = `${rssi}/31`
        deviceUpdates.signal_level =
          rssi >= 25 ? 'Excellent' :
          rssi >= 15 ? 'Good' :
          rssi >= 8  ? 'Fair' : 'Weak'
      }

      await supabase.from('devices').update(deviceUpdates).eq('id', device.id)

      // Evaluate alert rules
      await evaluateAlertRules(device, telemetryRow)

      // Broadcast live telemetry to WebSocket clients
      broadcast('telemetry', { device_id: device.id, ...telemetryRow })

    } catch (err) {
      console.error('❌ MQTT ingestion error:', err.message)
    }
  })

  console.log('📡 Subscribed to devices/+/telemetry')
}

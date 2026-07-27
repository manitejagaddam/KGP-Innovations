import { subscribe } from '../config/mqtt.js';
import { supabase } from '../config/supabase.js';
import { evaluateAlertRules } from './alertEngine.js';
import { broadcast } from './wsServer.js';

export function startIngestion() {
  subscribe('devices/+/telemetry', async (topic, message) => {
    try {
      const payloadStr = message.toString();
      const payload = JSON.parse(payloadStr);
      
      // Extract device mqtt_topic from topic string (e.g. 'devices/gunupudi-street-light/telemetry' -> 'gunupudi-street-light')
      const parts = topic.split('/');
      if (parts.length < 3) return;
      const deviceMqttTopic = parts[1];

      // Look up device by mqtt_topic in devices table
      const { data: device, error: deviceError } = await supabase
        .from('devices')
        .select('*')
        .eq('mqtt_topic', deviceMqttTopic)
        .single();

      if (deviceError || !device) {
        console.warn(`Device not found for mqtt_topic: ${deviceMqttTopic}`);
        return;
      }

      // Map payload to telemetry fields
      // {v=voltage, hz=frequency, a=current_a, kwh=energy_kwh, pf=power_factor, w=power_load_w, t=temperature_c, door=door_status}
      const telemetryData = {
        device_id: device.id,
        voltage: payload.v || null,
        frequency: payload.hz || null,
        current_a: payload.a || null,
        energy_kwh: payload.kwh || null,
        power_factor: payload.pf || null,
        power_load_w: payload.w || null,
        temperature_c: payload.t || null,
        door_status: payload.door !== undefined ? (payload.door ? 'Open' : 'Closed') : null,
        timestamp: new Date().toISOString()
      };

      // Insert row into telemetry table
      const { error: telemetryError } = await supabase
        .from('telemetry')
        .insert([telemetryData]);

      if (telemetryError) {
        console.error('Error inserting telemetry:', telemetryError);
      }

      // Update devices table: status, power, connection_status, last_seen, signal_strength
      const deviceUpdates = {
        last_seen: new Date().toISOString(),
        connection_status: 'Online',
        // Example mapping, logic might differ based on actual requirements
        status: 'Active',
      };
      
      if (payload.w !== undefined) {
        deviceUpdates.power = payload.w > 0 ? 'ON' : 'OFF';
      }
      
      if (payload.rssi !== undefined) {
        deviceUpdates.signal_strength = payload.rssi;
      }

      await supabase
        .from('devices')
        .update(deviceUpdates)
        .eq('id', device.id);

      // Call evaluateAlertRules(device, telemetry) from alertEngine.js
      await evaluateAlertRules(device, telemetryData);

      // Broadcast updated telemetry to WebSocket clients
      broadcast('telemetry', {
        device_id: device.id,
        ...telemetryData
      });

    } catch (error) {
      console.error('Error processing MQTT telemetry message:', error);
    }
  });
}

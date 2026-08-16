import supabase from '../config/supabase.js'
import { broadcast } from './wsServer.js'

let cachedRules  = []
let lastFetchTime = 0

async function getEnabledRules() {
  const now = Date.now()
  // Refresh cache every 60 seconds
  if (now - lastFetchTime > 60_000) {
    const { data, error } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('enabled', true)

    if (!error && data) {
      cachedRules   = data
      lastFetchTime = now
    }
  }
  return cachedRules
}

export async function evaluateAlertRules(device, telemetry) {
  try {
    const rules = await getEnabledRules()

    for (const rule of rules) {
      const metricValue = telemetry[rule.metric]
      if (metricValue === undefined || metricValue === null) continue

      const threshold = rule.threshold

      let isBreached = false
      switch (rule.condition) {
        case '>':  isBreached = Number(metricValue) >  Number(threshold); break
        case '<':  isBreached = Number(metricValue) <  Number(threshold); break
        case '>=': isBreached = Number(metricValue) >= Number(threshold); break
        case '<=': isBreached = Number(metricValue) <= Number(threshold); break
        case '==': isBreached = String(metricValue) === String(threshold); break
      }

      if (!isBreached) continue

      // Suppress duplicate: check if a 'New' alert for this rule + device already exists
      const { data: existing } = await supabase
        .from('alerts')
        .select('id')
        .eq('device_id', device.id)
        .eq('rule_id', rule.id)
        .eq('status', 'New')
        .limit(1)

      if (existing && existing.length > 0) continue  // already active — skip

      // Insert new alert — includes rule_id and message (both columns now exist in schema)
      const alertRow = {
        device_id:       device.id,
        rule_id:         rule.id,       // ← added: column now exists in schema
        type:            rule.name,
        severity:        rule.severity,
        status:          'New',
        message:         `${rule.metric} ${rule.condition} ${threshold} (Actual: ${metricValue})`, // ← added
        triggered_value: String(metricValue)
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('alerts')
        .insert([alertRow])
        .select()
        .single()

      if (insertErr) {
        console.error('❌ Alert insert error:', insertErr.message)
        continue
      }

      // Broadcast new alert to WebSocket clients
      broadcast('alert', inserted)
      console.log(`🔔 Alert: [${rule.severity}] ${rule.name} on device ${device.name}`)
    }
  } catch (err) {
    console.error('❌ evaluateAlertRules error:', err.message)
  }
}

export async function resolveStaleAlerts(deviceId) {
  try {
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'Resolved', resolved_reason: 'Device reconnected' })
      .eq('device_id', deviceId)
      .eq('status', 'New')

    if (error) console.error('❌ resolveStaleAlerts error:', error.message)
  } catch (err) {
    console.error('❌ resolveStaleAlerts error:', err.message)
  }
}

import cron from 'node-cron'
import supabase from '../config/supabase.js'
import { publish } from '../config/mqtt.js'
import { log } from '../middleware/audit.js'

async function checkAutomations() {
  try {
    const { data: automations, error } = await supabase
      .from('automations')
      .select('*')
      .eq('enabled', true)
      .eq('trigger_type', 'time')

    if (error) {
      console.error('❌ checkAutomations fetch error:', error.message)
      return
    }
    if (!automations || automations.length === 0) return

    const now = new Date()
    const hh = now.getHours().toString().padStart(2, '0')
    const mm = now.getMinutes().toString().padStart(2, '0')
    const currentTime24 = `${hh}:${mm}`

    for (const auto of automations) {
      const triggerTime = auto.trigger_condition?.time  // e.g. "18:00" or "06:00 PM"
      if (!triggerTime) continue

      // Support both "HH:MM" (24h) and "HH:MM AM/PM" (12h) formats
      let targetTime24 = triggerTime
      if (triggerTime.includes(' ')) {
        const [timePart, modifier] = triggerTime.split(' ')
        const [hours, minutes] = timePart.split(':')
        let h = parseInt(hours, 10)
        if (modifier?.toUpperCase() === 'PM' && h < 12) h += 12
        if (modifier?.toUpperCase() === 'AM' && h === 12) h = 0
        targetTime24 = `${h.toString().padStart(2, '0')}:${minutes}`
      }

      if (currentTime24 !== targetTime24) continue

      // Execute action for all target devices
      if (auto.action?.type === 'power' && Array.isArray(auto.target_devices)) {
        const powerState = auto.action.value   // 'ON' or 'OFF'

        for (const deviceId of auto.target_devices) {
          const { data: device } = await supabase
            .from('devices')
            .select('mqtt_topic, name')
            .eq('id', deviceId)
            .single()

          if (device?.mqtt_topic) {
            const topic = `devices/${device.mqtt_topic}/command`
            publish(topic, JSON.stringify({ power: powerState }))
            console.log(`⚙️  Automation "${auto.name}" → ${device.name} → ${powerState}`)
          }
        }

        // Log automation execution — log() expects an object
        await log({
          userId:     null,
          userEmail:  'system@automation',
          action:     'AUTOMATION_EXECUTE',
          targetType: 'automation',
          targetId:   auto.id,
          reason:     `${auto.name} triggered at ${currentTime24} → power ${powerState}`
        })

        // Update run stats
        await supabase
          .from('automations')
          .update({ last_run: now.toISOString(), run_count: (auto.run_count || 0) + 1 })
          .eq('id', auto.id)
      }
    }
  } catch (err) {
    console.error('❌ checkAutomations error:', err.message)
  }
}

export function startAutomationEngine() {
  // Run every minute
  cron.schedule('* * * * *', () => checkAutomations())
  console.log('✅ Automation engine started (runs every minute)')
}

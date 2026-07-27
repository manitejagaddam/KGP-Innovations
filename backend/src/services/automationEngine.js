import cron from 'node-cron';
import { supabase } from '../config/supabase.js';
import { publish } from '../config/mqtt.js';
import { log } from '../middleware/audit.js';

async function checkAutomations() {
  try {
    // Load enabled automations from DB
    const { data: automations, error } = await supabase
      .from('automations')
      .select('*')
      .eq('enabled', true)
      .eq('trigger_type', 'time');

    if (error) {
      console.error('Error fetching automations:', error);
      return;
    }

    if (!automations || automations.length === 0) return;

    const now = new Date();
    // Get local time string HH:MM (using 24hr format for easier comparison or adjusting as per specific requirements)
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime24 = `${currentHours}:${currentMinutes}`;
    
    // We will parse '06:00 PM' to 24h format to compare
    for (const auto of automations) {
      const triggerTimeStr = auto.trigger_condition?.time; // e.g. "06:00 PM"
      if (!triggerTimeStr) continue;

      let [time, modifier] = triggerTimeStr.split(' ');
      if (!time || !modifier) continue;
      
      let [hours, minutes] = time.split(':');
      if (!hours || !minutes) continue;
      
      let hoursInt = parseInt(hours, 10);
      if (modifier.toUpperCase() === 'PM' && hoursInt < 12) hoursInt += 12;
      if (modifier.toUpperCase() === 'AM' && hoursInt === 12) hoursInt = 0;
      
      const targetTime24 = `${hoursInt.toString().padStart(2, '0')}:${minutes}`;

      if (currentTime24 === targetTime24) {
        // Execute action
        if (auto.action?.type === 'power' && Array.isArray(auto.target_devices)) {
          const powerState = auto.action.value; // 'ON' or 'OFF'
          
          for (const deviceId of auto.target_devices) {
            // Get device MQTT topic
            const { data: device } = await supabase
              .from('devices')
              .select('mqtt_topic')
              .eq('id', deviceId)
              .single();
              
            if (device && device.mqtt_topic) {
              const topic = `devices/${device.mqtt_topic}/command`;
              publish(topic, JSON.stringify({ power: powerState }));
              
              // Log execution to audit_logs
              // Note: using a system user id or null for automated actions
              await log(null, 'AUTOMATION_EXECUTE', deviceId, { 
                automation_id: auto.id, 
                power: powerState 
              });
            }
          }
          
          // Update automation.last_run and run_count in DB
          await supabase
            .from('automations')
            .update({ 
              last_run: now.toISOString(),
              run_count: (auto.run_count || 0) + 1 
            })
            .eq('id', auto.id);
        }
      }
    }
  } catch (error) {
    console.error('Error in checkAutomations:', error);
  }
}

export function startAutomationEngine() {
  // Use node-cron to run checkAutomations() every minute
  cron.schedule('* * * * *', () => {
    checkAutomations();
  });
  console.log('✅ Automation engine started');
}

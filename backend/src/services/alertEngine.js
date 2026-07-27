import { supabase } from '../config/supabase.js';
import { broadcast } from './wsServer.js';

let cachedRules = [];
let lastFetchTime = 0;

async function getEnabledRules() {
  const now = Date.now();
  if (now - lastFetchTime > 60000) { // 60 seconds cache
    const { data, error } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('enabled', true);
      
    if (!error && data) {
      cachedRules = data;
      lastFetchTime = now;
    }
  }
  return cachedRules;
}

export async function evaluateAlertRules(device, telemetry) {
  try {
    const rules = await getEnabledRules();

    for (const rule of rules) {
      let metricValue = telemetry[rule.metric];
      if (metricValue === undefined) continue;

      let isBreached = false;
      const threshold = rule.threshold;

      // evaluate condition (>, <, >=, <=, ==)
      switch (rule.condition) {
        case '>': isBreached = metricValue > threshold; break;
        case '<': isBreached = metricValue < threshold; break;
        case '>=': isBreached = metricValue >= threshold; break;
        case '<=': isBreached = metricValue <= threshold; break;
        case '==': isBreached = metricValue == threshold; break;
      }

      if (isBreached) {
        // Check if an active 'New' alert of same type already exists for this device
        const { data: existingAlerts, error: fetchError } = await supabase
          .from('alerts')
          .select('id')
          .eq('device_id', device.id)
          .eq('rule_id', rule.id)
          .eq('status', 'New')
          .limit(1);

        if (fetchError) {
          console.error('Error fetching existing alerts:', fetchError);
          continue;
        }

        if (existingAlerts.length === 0) {
          // Insert new alert
          const newAlert = {
            device_id: device.id,
            rule_id: rule.id,
            type: rule.name,
            severity: rule.severity,
            status: 'New',
            message: `Rule breached: ${rule.metric} ${rule.condition} ${rule.threshold} (Actual: ${metricValue})`
          };

          const { data: insertedAlert, error: insertError } = await supabase
            .from('alerts')
            .insert([newAlert])
            .select()
            .single();

          if (insertError) {
            console.error('Error inserting new alert:', insertError);
            continue;
          }

          // Broadcast alert via wsServer
          broadcast('alert', insertedAlert);
        }
      }
    }
  } catch (error) {
    console.error('Error evaluating alert rules:', error);
  }
}

export async function resolveStaleAlerts(deviceId) {
  try {
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'Resolved', resolved_reason: 'Device reconnected' })
      .eq('device_id', deviceId)
      .eq('status', 'New');
      
    if (error) {
      console.error('Error resolving stale alerts:', error);
    }
  } catch (error) {
    console.error('Error in resolveStaleAlerts:', error);
  }
}

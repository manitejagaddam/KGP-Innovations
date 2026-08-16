import mqtt from 'mqtt'
import dotenv from 'dotenv'

dotenv.config()

// ── Feature flag ──────────────────────────────────────────────────────────────
// Set MQTT_ENABLED=true in .env to enable the MQTT broker connection.
// Default is DISABLED so the server starts cleanly without a broker.
const MQTT_ENABLED = process.env.MQTT_ENABLED === 'true'
const brokerUrl    = process.env.MQTT_BROKER_URL

let mqttClient    = null
const topicCallbacks = {}

// ── connectMqtt ───────────────────────────────────────────────────────────────
export const connectMqtt = (onConnect) => {
  if (!MQTT_ENABLED) {
    console.log('ℹ️  MQTT: Disabled — set MQTT_ENABLED=true in .env to enable')
    if (onConnect) onConnect(null, true)  // simulate success so services start
    return
  }

  if (!brokerUrl) {
    console.warn('⚠️  MQTT: MQTT_ENABLED=true but MQTT_BROKER_URL is not set')
    if (onConnect) onConnect(null, true)
    return
  }

  const options = {
    clientId:        process.env.MQTT_CLIENT_ID || `kgp_backend_${Date.now()}`,
    clean:           true,
    connectTimeout:  10_000,
    reconnectPeriod: 10_000,   // wait 10 s between retries (less spammy)
  }
  if (process.env.MQTT_USERNAME) options.username = process.env.MQTT_USERNAME
  if (process.env.MQTT_PASSWORD) options.password = process.env.MQTT_PASSWORD

  console.log(`🔌 MQTT: Connecting to ${brokerUrl} ...`)
  mqttClient = mqtt.connect(brokerUrl, options)

  mqttClient.on('connect', () => {
    console.log('✅ MQTT: Connected to broker')
    // Re-subscribe to all registered topics after reconnect
    Object.keys(topicCallbacks).forEach(topic => {
      mqttClient.subscribe(topic, { qos: 1 }, err => {
        if (!err) console.log(`   → MQTT subscribed: ${topic}`)
      })
    })
    if (onConnect) onConnect(mqttClient, false)
  })

  mqttClient.on('reconnect', () => {
    console.log('🔄 MQTT: Reconnecting...')
  })

  mqttClient.on('error', err => {
    console.error('❌ MQTT Error:', err.message)
  })

  mqttClient.on('offline', () => {
    console.warn('⚠️  MQTT: Client went offline')
  })

  // Dispatch incoming messages to registered topic callbacks
  mqttClient.on('message', (topic, message) => {
    let payload
    try {
      payload = JSON.parse(message.toString())
    } catch {
      payload = message.toString()
    }

    Object.keys(topicCallbacks).forEach(registered => {
      let matches = false
      if (registered === topic) {
        matches = true
      } else if (registered.includes('+')) {
        matches = new RegExp('^' + registered.replace(/\+/g, '[^/]+') + '$').test(topic)
      } else if (registered.includes('#')) {
        matches = new RegExp('^' + registered.replace(/#/g, '.*') + '$').test(topic)
      }
      if (matches) {
        topicCallbacks[registered].forEach(cb => cb(payload, topic))
      }
    })
  })
}

// ── subscribe ─────────────────────────────────────────────────────────────────
export const subscribe = (topic, callback) => {
  if (!topicCallbacks[topic]) topicCallbacks[topic] = []
  topicCallbacks[topic].push(callback)

  if (mqttClient?.connected) {
    mqttClient.subscribe(topic, { qos: 1 })
  }
}

// ── publish ───────────────────────────────────────────────────────────────────
export const publish = (topic, payload) => {
  const message = typeof payload === 'object' ? JSON.stringify(payload) : String(payload)

  if (mqttClient?.connected) {
    mqttClient.publish(topic, message, { qos: 1 }, err => {
      if (err) console.error('❌ MQTT Publish error:', err)
      else     console.log(`📤 MQTT → ${topic}:`, payload)
    })
    return true
  }

  // MQTT disabled or offline — log the mock publish
  if (MQTT_ENABLED) {
    console.log(`📤 MQTT [OFFLINE MOCK] → ${topic}:`, payload)
  }
  return false
}

export const isMqttActive      = () => !!(mqttClient?.connected)
export const isMqttEnabled     = () => MQTT_ENABLED
export { MQTT_ENABLED as isMqttConfigured }

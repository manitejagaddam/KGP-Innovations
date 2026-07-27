import mqtt from 'mqtt'
import dotenv from 'dotenv'

dotenv.config()

const brokerUrl = process.env.MQTT_BROKER_URL
const isMqttConfigured = !!(brokerUrl && !brokerUrl.includes('your-aws'))

let mqttClient = null
const topicCallbacks = {}

/**
 * Connect to AWS IoT Core MQTT Broker
 * @param {Function} onConnect - called when connection succeeds
 */
export const connectMqtt = (onConnect) => {
  if (!isMqttConfigured) {
    console.log('⚠️  MQTT: No AWS broker configured — running in SIMULATION mode')
    if (onConnect) onConnect(null, true) // simulate connection
    return
  }

  const options = {
    clientId: process.env.MQTT_CLIENT_ID || `kgp_backend_${Date.now()}`,
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 3000,
  }

  if (process.env.MQTT_USERNAME) options.username = process.env.MQTT_USERNAME
  if (process.env.MQTT_PASSWORD) options.password = process.env.MQTT_PASSWORD

  console.log(`🔌 MQTT: Connecting to AWS IoT Core at ${brokerUrl}`)
  mqttClient = mqtt.connect(brokerUrl, options)

  mqttClient.on('connect', () => {
    console.log('✅ MQTT: Connected to AWS IoT Core Broker')
    // Re-subscribe to all previously registered topics
    Object.keys(topicCallbacks).forEach(topic => {
      mqttClient.subscribe(topic, { qos: 1 }, (err) => {
        if (!err) console.log(`   → Subscribed: ${topic}`)
      })
    })
    if (onConnect) onConnect(mqttClient, false)
  })

  mqttClient.on('reconnect', () => {
    console.log('🔄 MQTT: Reconnecting...')
  })

  mqttClient.on('error', (err) => {
    console.error('❌ MQTT Error:', err.message)
  })

  mqttClient.on('offline', () => {
    console.warn('⚠️  MQTT: Client went offline')
  })

  mqttClient.on('message', (topic, message) => {
    let payload
    try {
      payload = JSON.parse(message.toString())
    } catch {
      payload = message.toString()
    }

    // Dispatch to all exact and wildcard subscribers
    Object.keys(topicCallbacks).forEach(registeredTopic => {
      let matches = false
      if (registeredTopic === topic) {
        matches = true
      } else if (registeredTopic.includes('+')) {
        const pattern = '^' + registeredTopic.replace(/\+/g, '[^/]+') + '$'
        matches = new RegExp(pattern).test(topic)
      } else if (registeredTopic.includes('#')) {
        const pattern = '^' + registeredTopic.replace(/#/g, '.*') + '$'
        matches = new RegExp(pattern).test(topic)
      }
      if (matches) {
        topicCallbacks[registeredTopic].forEach(cb => cb(payload, topic))
      }
    })
  })
}

/**
 * Subscribe to an MQTT topic
 */
export const subscribe = (topic, callback) => {
  if (!topicCallbacks[topic]) {
    topicCallbacks[topic] = []
  }
  topicCallbacks[topic].push(callback)

  if (mqttClient && mqttClient.connected) {
    mqttClient.subscribe(topic, { qos: 1 })
  }
}

/**
 * Publish a command message to a device topic
 */
export const publish = (topic, payload) => {
  const message = typeof payload === 'object' ? JSON.stringify(payload) : String(payload)

  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(topic, message, { qos: 1 }, (err) => {
      if (err) console.error('❌ MQTT Publish error:', err)
      else console.log(`📤 MQTT Published → ${topic}:`, payload)
    })
    return true
  } else {
    console.log(`📤 MQTT [MOCK PUBLISH] → ${topic}:`, payload)
    return false
  }
}

export const isMqttActive = () => mqttClient && mqttClient.connected
export { isMqttConfigured }

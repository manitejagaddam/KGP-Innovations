import mqtt from 'mqtt'

const brokerUrl = import.meta.env.VITE_MQTT_BROKER_URL
const username = import.meta.env.VITE_MQTT_USERNAME
const password = import.meta.env.VITE_MQTT_PASSWORD
const clientId = import.meta.env.VITE_MQTT_CLIENT_ID || `kgp_dashboard_${Math.random().toString(16).substring(2, 10)}`

export const isMqttConfigured = !!(brokerUrl && brokerUrl !== 'your_aws_iot_endpoint' && brokerUrl !== '')

class MqttService {
  constructor() {
    this.client = null
    this.subscriptions = new Set()
    this.callbacks = {}
  }

  connect(onStatusChange) {
    if (!isMqttConfigured) {
      console.log('[MQTT Service] Running in MOCK MODE (No broker credentials)')
      if (onStatusChange) onStatusChange('connected', true) // Mock connection success
      return
    }

    try {
      console.log(`[MQTT Service] Connecting to AWS Broker: ${brokerUrl}`)
      const options = {
        clientId,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
      }

      if (username) options.username = username
      if (password) options.password = password

      this.client = mqtt.connect(brokerUrl, options)

      this.client.on('connect', () => {
        console.log('[MQTT Service] Successfully connected to AWS IoT Broker!')
        if (onStatusChange) onStatusChange('connected', false)
        
        // Re-subscribe to active topics
        this.subscriptions.forEach(topic => {
          this.client.subscribe(topic)
        })
      })

      this.client.on('error', (err) => {
        console.error('[MQTT Service] Connection error:', err)
        if (onStatusChange) onStatusChange('error', false, err.message)
      })

      this.client.on('offline', () => {
        console.warn('[MQTT Service] Client went offline')
        if (onStatusChange) onStatusChange('offline', false)
      })

      this.client.on('message', (topic, message) => {
        const payloadStr = message.toString()
        try {
          const payload = JSON.parse(payloadStr)
          this.triggerCallbacks(topic, payload)
        } catch (e) {
          this.triggerCallbacks(topic, payloadStr)
        }
      })

    } catch (e) {
      console.error('[MQTT Service] Failed to initialize connection:', e)
      if (onStatusChange) onStatusChange('error', false, e.message)
    }
  }

  subscribe(topic, callback) {
    this.subscriptions.add(topic)
    if (!this.callbacks[topic]) {
      this.callbacks[topic] = []
    }
    this.callbacks[topic].push(callback)

    if (this.client && this.client.connected && isMqttConfigured) {
      this.client.subscribe(topic)
      console.log(`[MQTT Service] Subscribed to AWS topic: ${topic}`)
    }
  }

  unsubscribe(topic, callback) {
    if (this.callbacks[topic]) {
      this.callbacks[topic] = this.callbacks[topic].filter(cb => cb !== callback)
      if (this.callbacks[topic].length === 0) {
        delete this.callbacks[topic]
        this.subscriptions.delete(topic)
        if (this.client && this.client.connected && isMqttConfigured) {
          this.client.unsubscribe(topic)
          console.log(`[MQTT Service] Unsubscribed from topic: ${topic}`)
        }
      }
    }
  }

  publish(topic, payload) {
    const payloadStr = typeof payload === 'object' ? JSON.stringify(payload) : String(payload)
    if (this.client && this.client.connected && isMqttConfigured) {
      this.client.publish(topic, payloadStr, { qos: 1 })
      console.log(`[MQTT Service] Published to AWS topic: ${topic}`, payload)
      return true
    } else {
      console.log(`[MQTT Service] [MOCK PUBLISH] Topic: ${topic}`, payload)
      return false
    }
  }

  triggerCallbacks(topic, data) {
    // Exact match triggers
    if (this.callbacks[topic]) {
      this.callbacks[topic].forEach(cb => cb(data, topic))
    }
    
    // Wildcard match triggers (e.g. support matching devices/+/telemetry)
    Object.keys(this.callbacks).forEach(registeredTopic => {
      if (registeredTopic.includes('+')) {
        const regexPattern = '^' + registeredTopic.replace('+', '[^/]+') + '$'
        const regex = new RegExp(regexPattern)
        if (regex.test(topic)) {
          this.callbacks[registeredTopic].forEach(cb => cb(data, topic))
        }
      }
    })
  }

  disconnect() {
    if (this.client) {
      this.client.end()
      console.log('[MQTT Service] Disconnected client')
    }
  }
}

export const mqttService = new MqttService()
export default mqttService

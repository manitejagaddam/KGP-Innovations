import http from 'http'
import dotenv from 'dotenv'
import app from './app.js'
import { connectMqtt } from './config/mqtt.js'
import { initWsServer } from './services/wsServer.js'
import { startIngestion } from './services/mqttIngestion.js'
import { startAutomationEngine } from './services/automationEngine.js'

dotenv.config()

const PORT = process.env.PORT || 4000
const httpServer = http.createServer(app)

// Init WebSocket server
initWsServer(httpServer)

// Connect MQTT and start telemetry ingestion pipeline
connectMqtt(() => {
  startIngestion()
  console.log('✅ MQTT ingestion pipeline started')
})

// Start automation cron engine (runs every minute)
startAutomationEngine()

httpServer.listen(PORT, () => {
  console.log(`🚀 KGP IoT Backend running on http://localhost:${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  httpServer.close(() => process.exit(0))
})

# KGP Inovation — IoT Street Light Platform

A real-time, responsive IoT Fleet Management Dashboard built with **Vite, React, Tailwind CSS, Supabase**, and **AWS MQTT**. Designed to monitor, control, and schedule smart street light fleets.

---

## 🚀 Getting Started

Follow these simple steps to run the application locally:

### 1. Install Dependencies
In your terminal, navigate to this project directory and run:
```bash
npm install
```

### 2. Run the Development Server
Launch the local dev server at [http://localhost:3000](http://localhost:3000):
```bash
npm run dev
```

---

## ⚡ Integration Details (Hardware & DB)

This dashboard is built to support direct hardware connections and database storage:

1. **Supabase Database & Auth:**
   * Handled inside `src/services/supabaseClient.js`.
   * Real-time PostgreSQL changes are subscribed to using CDC Channels in `src/context/AppContext.jsx`.
2. **AWS MQTT Broker:**
   * Handled in `src/services/mqttService.js` using WebSocket connections.
   * Telemetry topics: Subscribes to `devices/+/telemetry` to capture incoming sensor values.
   * Command topics: Publishes toggling commands to `devices/{device_id}/command`.

### Credentials Configuration
To connect the UI to your live services:
1. Duplicate `.env.example` and rename it to `.env`.
2. Fill in your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_MQTT_BROKER_URL=wss://your-aws-iot-endpoint.amazonaws.com/mqtt
   ```
3. Restart the development server.

> [!NOTE]
> **Mock Fallback Mode:** If no credentials are provided in `.env`, the dashboard will run in a **fully interactive local simulation mode**. Sliders and toggles inside the collapsible simulator drawer (bottom right corner) let you verify voltage warnings, temp alarms, door tamper states, and connection dropouts seamlessly.

---

## 🔒 Security & Admin Controls

* **Remote Command Password:** When toggling the device power button or triggering control state changes, you will be prompted with the **Confirm Control Mode Change Modal**.
* **Default Password:** Use **`admin123`** to authenticate and write the reason for change to the audit log.

import React, { useState, useEffect } from 'react'
import { isSupabaseConfigured } from '../services/supabaseClient'
import { isMqttConfigured } from '../services/mqttService'
import { Settings, Shield, Bell, Key, Database, Cpu, Save } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function SettingsPage() {
  const toast = useToast()
  
  const [apiKey, setApiKey] = useState('kgp_live_prv_ak_98a3b8cd2c78f1')
  const [showKey, setShowKey] = useState(false)
  
  const [orgProfile, setOrgProfile] = useState({
    name: 'KGP Inovation Co.',
    email: 'support@kgpinovation.com'
  })
  
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true
  })

  useEffect(() => {
    const savedProfile = localStorage.getItem('kgp_org_profile')
    if (savedProfile) setOrgProfile(JSON.parse(savedProfile))
      
    const savedNotifs = localStorage.getItem('kgp_notifications')
    if (savedNotifs) setNotifications(JSON.parse(savedNotifs))
  }, [])

  const handleSave = () => {
    localStorage.setItem('kgp_org_profile', JSON.stringify(orgProfile))
    localStorage.setItem('kgp_notifications', JSON.stringify(notifications))
    toast.success('Settings saved successfully')
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-outfit font-black text-2xl tracking-tight text-slate-900 dark:text-white uppercase">
            Platform Settings
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            Configure system integrations & profiles
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: General Profile Form & Notifications */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Org profile */}
          <div className="glass-card bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
              <Shield className="w-5 h-5 text-blue-500" />
              <h3 className="font-outfit font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider">Organization Profile</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Organization Name</label>
                <input 
                  type="text" 
                  value={orgProfile.name}
                  onChange={(e) => setOrgProfile({...orgProfile, name: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Support Email</label>
                <input 
                  type="email" 
                  value={orgProfile.email}
                  onChange={(e) => setOrgProfile({...orgProfile, email: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Notifications config */}
          <div className="glass-card bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
              <Bell className="w-5 h-5 text-amber-500" />
              <h3 className="font-outfit font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider">Alert Notification Dispatch</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Email Dispatch</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Send alert digests immediately to administrators</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.email} 
                  onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                  className="w-4 h-4 accent-blue-600 cursor-pointer" 
                />
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">SMS Gateway</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Dispatch warning texts to field operations (Workers)</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.sms} 
                  onChange={(e) => setNotifications({...notifications, sms: e.target.checked})}
                  className="w-4 h-4 accent-blue-600 cursor-pointer" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer"
            >
              <Save size={16} />
              Save Settings
            </button>
          </div>

        </div>

        {/* Right Side: Environment Variables and Integration Verification */}
        <div className="space-y-6">
          
          <div className="glass-card bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
              <Key className="w-5 h-5 text-blue-500" />
              <h3 className="font-outfit font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider">API Credentials</h3>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Developer Authorization Key</label>
              <div className="flex gap-2">
                <input 
                  type={showKey ? 'text' : 'password'} 
                  value={apiKey} 
                  readOnly 
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl outline-none font-mono"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>

          {/* Integration Status Badges */}
          <div className="glass-card bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
              <Cpu className="w-5 h-5 text-emerald-500" />
              <h3 className="font-outfit font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider">Hardware Integration</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Database status */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-slate-400" />
                  <span className="font-semibold text-slate-600 dark:text-slate-400">PostgreSQL (Supabase)</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase
                  ${isSupabaseConfigured ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}
                >
                  {isSupabaseConfigured ? 'Connected' : 'Mock (Local)'}
                </span>
              </div>

              {/* MQTT Broker status */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-slate-400" />
                  <span className="font-semibold text-slate-600 dark:text-slate-400">AWS MQTT Broker</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase
                  ${isMqttConfigured ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}
                >
                  {isMqttConfigured ? 'Connected' : 'Mock (Local)'}
                </span>
              </div>

              <div className="p-3 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-600 dark:text-blue-400 rounded-xl leading-relaxed font-semibold">
                To connect the dashboard to your physical street light, add your credentials to the `.env` file at the root.
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

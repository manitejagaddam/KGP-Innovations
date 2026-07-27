import React, { useState } from 'react'
import { Briefcase, Mail, Phone, MapPin, ExternalLink, Plus, Edit2, Trash2, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../components/Toast'

export default function Vendors() {
  const { vendors, addVendor, updateVendor, deleteVendor } = useApp()
  const toast = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [currentVendorId, setCurrentVendorId] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    region: ''
  })

  const handleOpenAdd = () => {
    setModalMode('add')
    setFormData({ name: '', contact: '', phone: '', region: '' })
    setCurrentVendorId(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (vendor) => {
    setModalMode('edit')
    setFormData({
      name: vendor.name,
      contact: vendor.contact,
      phone: vendor.phone,
      region: vendor.region
    })
    setCurrentVendorId(vendor.id)
    setIsModalOpen(true)
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete vendor "${name}"?`)) {
      deleteVendor(id)
      toast.success('Vendor deleted successfully.')
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (modalMode === 'add') {
      addVendor(formData)
      toast.success('Vendor added successfully.')
    } else {
      updateVendor(currentVendorId, formData)
      toast.success('Vendor updated successfully.')
    }
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="font-outfit font-black text-2xl tracking-tight text-slate-900 dark:text-white uppercase">
            Registered Vendors
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            IoT Hardware Suppliers & Manufacturers
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={16} strokeWidth={3} />
          Add Vendor
        </button>
      </div>

      {/* Vendors table grid */}
      <div className="glass-card bg-white dark:bg-slate-900 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/30">
                <th className="p-4 pl-6 whitespace-nowrap">Vendor Company</th>
                <th className="p-4 whitespace-nowrap">Contact Email</th>
                <th className="p-4 whitespace-nowrap">Phone Support</th>
                <th className="p-4 whitespace-nowrap">Supplied Assets</th>
                <th className="p-4 whitespace-nowrap">Territory</th>
                <th className="p-4 pr-6 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">No vendors found.</td>
                </tr>
              ) : vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 font-medium transition-colors">
                  
                  {/* Vendor Company Name */}
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
                        <Briefcase size={16} />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white leading-tight">{vendor.name}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="p-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 mt-1">
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{vendor.contact}</span>
                    </span>
                  </td>

                  {/* Phone */}
                  <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400 shrink-0" />
                      <span className="whitespace-nowrap">{vendor.phone}</span>
                    </span>
                  </td>

                  {/* Supplied Assets Count */}
                  <td className="p-4 font-bold text-blue-500 whitespace-nowrap">{vendor.devices} devices</td>

                  {/* Territory */}
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{vendor.region}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-4 pr-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleOpenEdit(vendor)}
                        className="p-1.5 bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-900/30 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                        title="Edit Vendor"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(vendor.id, vendor.name)}
                        className="p-1.5 bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                        title="Delete Vendor"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {modalMode === 'add' ? 'Add New Vendor' : 'Edit Vendor'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800 dark:text-slate-200"
                  placeholder="e.g. KGP Smart Lighting"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contact Email</label>
                <input 
                  type="email"
                  required
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800 dark:text-slate-200"
                  placeholder="e.g. sales@kgpsmart.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone Support</label>
                <input 
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800 dark:text-slate-200"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Territory</label>
                <input 
                  type="text"
                  required
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800 dark:text-slate-200"
                  placeholder="e.g. Andhra Pradesh"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >
                  {modalMode === 'add' ? 'Create Vendor' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

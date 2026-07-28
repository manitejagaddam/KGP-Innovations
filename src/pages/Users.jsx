import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Search, UserPlus, Shield, User, Briefcase, Edit3, Trash2, X } from 'lucide-react'

export default function Users() {
  const { users, addUser, deleteUser } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('Worker')
  const [newVendorId, setNewVendorId] = useState('')

  // Table pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'All' || user.role === roleFilter
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  // Pagination logic
  const totalRows = filteredUsers.length
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage)

  const handleAddUserSubmit = (e) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) return

    addUser({
      name: newName,
      email: newEmail,
      role: newRole,
      vendor_id: newRole === 'Vendor' ? newVendorId : null
    })

    // Reset and close
    setNewName('')
    setNewEmail('')
    setNewRole('Worker')
    setNewVendorId('')
    setIsAddModalOpen(false)
  }

  // Get Role Badge Styling and Icons matching Screenshot 3
  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return {
          bg: 'bg-orange-500/10 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-500/20',
          icon: Shield
        }
      case 'Vendor':
        return {
          bg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-500/20',
          icon: Briefcase
        }
      default: // Worker
        return {
          bg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20',
          icon: User
        }
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Header block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative flex items-center min-w-[240px] flex-1 sm:flex-initial">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none shadow-sm focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* Role Filter dropdown */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl outline-none shadow-sm font-semibold cursor-pointer"
          >
            <option value="All">Role: All</option>
            <option value="Admin">Admin</option>
            <option value="Vendor">Vendor</option>
            <option value="Worker">Worker</option>
          </select>

          {/* Status Filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl outline-none shadow-sm font-semibold cursor-pointer"
          >
            <option value="All">Status: All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Primary Action Button: + Add User */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 shrink-0 cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Add User</span>
        </button>
      </div>

      {/* Users Database Table (Direct implementation of Screenshot 3) */}
      <div className="glass-card bg-white dark:bg-slate-900 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No users found matching search criteria.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const roleStyle = getRoleBadge(user.role)
                  const RoleIcon = roleStyle.icon
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 font-medium">
                      
                      {/* Name & ID column */}
                      <td className="p-4 pl-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white leading-tight">{user.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                            ID: {user.id}
                          </span>
                        </div>
                      </td>

                      {/* Email column */}
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{user.email}</td>

                      {/* Role badge column */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${roleStyle.bg}`}>
                          <RoleIcon size={12} className="shrink-0" />
                          {user.role}
                        </span>
                      </td>

                      {/* Status badge column */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase
                          ${user.status === 'Active' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-850'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {user.status}
                        </span>
                      </td>

                      {/* Created date column */}
                      <td className="p-4 text-xs font-semibold text-slate-400 dark:text-slate-500">{user.created}</td>

                      {/* Action buttons (Edit & Delete) */}
                      <td className="p-4 pr-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-blue-500 rounded-lg transition-colors">
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => deleteUser(user.id)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar matching Screenshot 3 details */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500 select-none">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg font-bold outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span>
              {startIndex + 1}-{Math.min(startIndex + rowsPerPage, totalRows)} of {totalRows}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
              >
                &lt;
              </button>
              <button
                disabled={startIndex + rowsPerPage >= totalRows}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 text-slate-800 dark:text-slate-100">
            
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 mb-4">
              <h3 className="font-outfit font-bold text-lg text-slate-900 dark:text-white">
                Register New User
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-slate-100 rounded-xl outline-none font-semibold"
                  placeholder="e.g. Anil Kumar"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-slate-100 rounded-xl outline-none font-semibold"
                  placeholder="e.g. worker@kgpinovation.com"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Assign System Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-slate-100 rounded-xl outline-none font-bold"
                >
                  <option value="Worker">Worker</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Vendor Selection (only visible if Role is Vendor) */}
              {newRole === 'Vendor' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Select Vendor Group
                  </label>
                  <select
                    required
                    value={newVendorId}
                    onChange={(e) => setNewVendorId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-slate-100 rounded-xl outline-none font-bold"
                  >
                    <option value="" disabled>-- Select a Vendor --</option>
                    {useApp().vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 transition-all uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all uppercase tracking-wider shadow-lg shadow-blue-600/20"
                >
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

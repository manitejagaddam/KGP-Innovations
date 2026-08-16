/**
 * Role-Based Access Control (RBAC) Middleware
 * Valid roles: Admin | Vendor | User
 *
 * Usage:
 *   router.get('/route', rbac('Admin'), handler)
 *   router.get('/route', adminOnly, handler)
 *   router.get('/route', adminOrVendor, handler)
 */
export const rbac = (...allowedRoles) => {
  const normalized = allowedRoles.map(r => r.toLowerCase())
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' })
    }
    const userRole = (req.user.role || '').toLowerCase()
    if (!normalized.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      })
    }
    next()
  }
}

/** Admin-only shorthand */
export const adminOnly = rbac('Admin')

/** Admin or Vendor shorthand */
export const adminOrVendor = rbac('Admin', 'Vendor')

/**
 * Role-Based Access Control (RBAC) Middleware Factory
 * Usage: rbac('Admin') or rbac('Admin', 'Vendor')
 */
export const rbac = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase())
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' })
    }

    const userRole = (req.user.role || '').toLowerCase()
    
    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      })
    }

    next()
  }
}

/**
 * Admin-only shorthand
 */
export const adminOnly = rbac('Admin')

/**
 * Admin or Vendor shorthand
 */
export const adminOrVendor = rbac('Admin', 'Vendor')

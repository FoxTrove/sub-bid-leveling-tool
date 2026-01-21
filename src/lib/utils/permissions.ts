import type { OrganizationRole } from "@/types"

/**
 * Permission definitions for team roles
 * Each permission maps to specific actions users can perform
 */
export type Permission =
  // Team management
  | "team:invite_members"
  | "team:remove_members"
  | "team:change_roles"
  | "team:update_settings"
  | "team:update_logo"
  | "team:delete_organization"
  // Projects
  | "project:create"
  | "project:view_own"
  | "project:view_team"
  | "project:edit_own"
  | "project:edit_team"
  | "project:delete_own"
  | "project:delete_team"
  | "project:share"
  // Comments
  | "comment:create"
  | "comment:edit_own"
  | "comment:delete_own"
  | "comment:delete_any"
  // Analytics
  | "analytics:view_own"
  | "analytics:view_team"

/**
 * Role-based permission matrix
 * Defines what each role can do
 */
const rolePermissions: Record<OrganizationRole, Permission[]> = {
  owner: [
    // Full team management
    "team:invite_members",
    "team:remove_members",
    "team:change_roles",
    "team:update_settings",
    "team:update_logo",
    "team:delete_organization",
    // Full project access
    "project:create",
    "project:view_own",
    "project:view_team",
    "project:edit_own",
    "project:edit_team",
    "project:delete_own",
    "project:delete_team",
    "project:share",
    // Full comment access
    "comment:create",
    "comment:edit_own",
    "comment:delete_own",
    "comment:delete_any",
    // Full analytics
    "analytics:view_own",
    "analytics:view_team",
  ],
  admin: [
    // Limited team management
    "team:invite_members",
    "team:remove_members",
    "team:update_settings",
    "team:update_logo",
    // Full project access
    "project:create",
    "project:view_own",
    "project:view_team",
    "project:edit_own",
    "project:edit_team",
    "project:delete_own",
    "project:delete_team",
    "project:share",
    // Comment access
    "comment:create",
    "comment:edit_own",
    "comment:delete_own",
    "comment:delete_any",
    // Full analytics
    "analytics:view_own",
    "analytics:view_team",
  ],
  member: [
    // Basic project access
    "project:create",
    "project:view_own",
    "project:view_team",
    "project:edit_own",
    "project:delete_own",
    "project:share",
    // Basic comment access
    "comment:create",
    "comment:edit_own",
    "comment:delete_own",
    // Own analytics
    "analytics:view_own",
    "analytics:view_team",
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: OrganizationRole | null, permission: Permission): boolean {
  if (!role) return false
  return rolePermissions[role]?.includes(permission) ?? false
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: OrganizationRole | null, permissions: Permission[]): boolean {
  if (!role) return false
  return permissions.every(permission => hasPermission(role, permission))
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: OrganizationRole | null, permissions: Permission[]): boolean {
  if (!role) return false
  return permissions.some(permission => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: OrganizationRole): Permission[] {
  return rolePermissions[role] ?? []
}

/**
 * Permission helper hooks for common checks
 */
export const permissionChecks = {
  canInviteMembers: (role: OrganizationRole | null) => hasPermission(role, "team:invite_members"),
  canRemoveMembers: (role: OrganizationRole | null) => hasPermission(role, "team:remove_members"),
  canChangeRoles: (role: OrganizationRole | null) => hasPermission(role, "team:change_roles"),
  canUpdateTeamSettings: (role: OrganizationRole | null) => hasPermission(role, "team:update_settings"),
  canUpdateLogo: (role: OrganizationRole | null) => hasPermission(role, "team:update_logo"),
  canDeleteOrganization: (role: OrganizationRole | null) => hasPermission(role, "team:delete_organization"),
  canCreateProject: (role: OrganizationRole | null) => hasPermission(role, "project:create"),
  canViewTeamProjects: (role: OrganizationRole | null) => hasPermission(role, "project:view_team"),
  canEditTeamProjects: (role: OrganizationRole | null) => hasPermission(role, "project:edit_team"),
  canDeleteTeamProjects: (role: OrganizationRole | null) => hasPermission(role, "project:delete_team"),
  canShareProject: (role: OrganizationRole | null) => hasPermission(role, "project:share"),
  canDeleteAnyComment: (role: OrganizationRole | null) => hasPermission(role, "comment:delete_any"),
  canViewTeamAnalytics: (role: OrganizationRole | null) => hasPermission(role, "analytics:view_team"),
}

/**
 * Role hierarchy for comparison
 * Higher number = more privileges
 */
const roleHierarchy: Record<OrganizationRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
}

/**
 * Check if role1 is higher than role2 in hierarchy
 */
export function isHigherRole(role1: OrganizationRole, role2: OrganizationRole): boolean {
  return roleHierarchy[role1] > roleHierarchy[role2]
}

/**
 * Check if a user can manage another user based on their roles
 */
export function canManageUser(
  managerRole: OrganizationRole | null,
  targetRole: OrganizationRole
): boolean {
  if (!managerRole) return false

  // Can't manage owners
  if (targetRole === "owner") return false

  // Owners can manage anyone except other owners
  if (managerRole === "owner") return true

  // Admins can only manage members
  if (managerRole === "admin") return targetRole === "member"

  // Members can't manage anyone
  return false
}

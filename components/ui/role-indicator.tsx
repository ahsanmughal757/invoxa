import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, User, Shield, Crown, AlertTriangle, EyeOff } from 'lucide-react';

export type UserRole = 'owner' | 'admin' | 'member' | string;

interface RoleIndicatorProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  disabled?: boolean;
}

const roleConfig = {
  owner: {
    label: 'Owner',
    badgeVariant: 'default' as const,
    icon: Crown,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    tooltip: 'Organization Owner - Full administrative privileges'
  },
  admin: {
    label: 'Admin',
    badgeVariant: 'secondary' as const,
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    tooltip: 'Administrator - Can manage organization settings and members'
  },
  member: {
    label: 'Member',
    badgeVariant: 'outline' as const,
    icon: User,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    tooltip: 'Member - Standard user with limited permissions'
  }
};

export const RoleIndicator: React.FC<RoleIndicatorProps> = ({
  role,
  size = 'md',
  showTooltip = true,
  disabled = false
}) => {
  const config = roleConfig[role as keyof typeof roleConfig] || {
    label: role.charAt(0).toUpperCase() + role.slice(1),
    badgeVariant: 'outline' as const,
    icon: User,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    tooltip: `Role: ${role}`
  };

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs h-6 px-2',
    md: 'text-sm h-7 px-2.5',
    lg: 'text-base h-8 px-3'
  };

  const badgeClass = `${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  const roleElement = (
    <Badge
      variant={config.badgeVariant}
      className={`${badgeClass} ${config.bgColor} ${config.color} capitalize flex items-center gap-1`}
    >
      <IconComponent className={`h-3 w-3 ${size === 'lg' ? 'h-4 w-4' : ''}`} />
      {config.label}
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {roleElement}
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return roleElement;
};

interface RoleRestrictedUIProps {
  userRole: UserRole;
  requiredRole: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLock?: boolean;
  lockMessage?: string;
}

/**
 * Component that conditionally renders content based on user role
 * IMPORTANT: This is purely a UI/UX component for visual feedback
 * Backend validation and security remain completely separate and unaffected
 */
export const RoleRestrictedUI: React.FC<RoleRestrictedUIProps> = ({
  userRole,
  requiredRole,
  children,
  fallback,
  showLock = true,
  lockMessage = "This action requires higher permissions"
}) => {
  // Check if user has sufficient role (owner > admin > member hierarchy)
  const hasPermission = checkRoleHierarchy(userRole, requiredRole);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showLock) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground italic">
        <Lock className="h-4 w-4" />
        <span>{lockMessage}</span>
      </div>
    );
  }

  return null;
};

/**
 * Checks if a user role has sufficient permissions compared to required role
 * Implements a simple hierarchy: owner > admin > member
 */
export function checkRoleHierarchy(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === 'owner') return true;
  if (userRole === 'admin' && requiredRole !== 'owner') return true;
  if (userRole === 'member' && requiredRole === 'member') return true;

  return false;
}

interface RoleAwareButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  userRole: UserRole;
  requiredRole: UserRole;
  disabledMessage?: string;
  locked?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  asChild?: boolean;
}

/**
 * A button that shows role-based restrictions for UI/UX purposes
 * IMPORTANT: Backend validation and security remain completely separate and unaffected
 */
export const RoleAwareButton: React.FC<RoleAwareButtonProps> = ({
  userRole,
  requiredRole,
  children,
  onClick,
  disabledMessage = "Insufficient permissions",
  locked = false,
  variant = "default",
  size = "default",
  disabled,
  className = "",
  asChild,
  ...props
}) => {
  const hasPermission = checkRoleHierarchy(userRole, requiredRole);
  const isDisabled = disabled || locked || !hasPermission;

  if (!hasPermission && !disabled) { // Only show restricted UI if not explicitly disabled
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 opacity-50 cursor-not-allowed ${className}`}
            >
              {children}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      className={className}
      asChild={asChild}
      {...props}
    >
      {children}
    </Button>
  );
};

interface RoleAwareActionProps {
  userRole: UserRole;
  requiredRole: UserRole;
  actionName: string;
  children: React.ReactNode;
  onAttempt?: (action: string, userRole: UserRole, requiredRole: UserRole) => void;
}

/**
 * Wrapper for actions that shows visual feedback when user lacks required role
 * IMPORTANT: This is purely a UI/UX component for visual feedback
 * Backend validation and security remain completely separate and unaffected
 */
export const RoleAwareAction: React.FC<RoleAwareActionProps> = ({
  userRole,
  requiredRole,
  actionName,
  children,
  onAttempt
}) => {
  const hasPermission = checkRoleHierarchy(userRole, requiredRole);

  const handleClick = (e: React.MouseEvent) => {
    if (!hasPermission) {
      e.preventDefault();
      e.stopPropagation();

      if (onAttempt) {
        onAttempt(actionName, userRole, requiredRole);
      }

      // Show a visual cue that action is restricted
      const target = e.currentTarget as HTMLElement;
      target.classList.add('animate-pulse');
      setTimeout(() => {
        if (target) target.classList.remove('animate-pulse');
      }, 500);
    }
  };

  if (hasPermission) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span onClick={handleClick} className="cursor-not-allowed">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>You need {requiredRole} role to {actionName}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface PermissionCueProps {
  userRole: UserRole;
  requiredRole: UserRole;
  type?: 'icon' | 'text' | 'both';
  position?: 'inline' | 'tooltip';
}

/**
 * Visual cue indicating permission level for an element
 */
export const PermissionCue: React.FC<PermissionCueProps> = ({
  userRole,
  requiredRole,
  type = 'icon',
  position = 'inline'
}) => {
  const hasPermission = checkRoleHierarchy(userRole, requiredRole);

  if (hasPermission) {
    return null; // No cue needed if user has permission
  }

  const permissionElement = (
    <span className="inline-flex items-center text-xs text-muted-foreground">
      <Lock className="h-3 w-3 mr-1" />
      {type === 'text' || type === 'both' ? `Requires ${requiredRole}` : ''}
    </span>
  );

  if (position === 'tooltip') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Lock className="h-3 w-3 text-muted-foreground ml-1" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Requires {requiredRole} role</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return permissionElement;
};

interface RestrictedContentProps {
  userRole: UserRole;
  requiredRole: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showReason?: boolean;
}

/**
 * Component that visually indicates restricted content
 */
export const RestrictedContent: React.FC<RestrictedContentProps> = ({
  userRole,
  requiredRole,
  children,
  fallback,
  showReason = true
}) => {
  const hasPermission = checkRoleHierarchy(userRole, requiredRole);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="border border-dashed border-yellow-300 rounded-lg p-4 bg-yellow-50 flex items-center gap-3">
      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
      <div>
        <p className="font-medium text-yellow-800">Restricted Content</p>
        {showReason && (
          <p className="text-sm text-yellow-600">
            You need {requiredRole} role to access this content
          </p>
        )}
      </div>
    </div>
  );
};
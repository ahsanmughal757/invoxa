import React from 'react';
import toast, { ToastOptions } from 'react-hot-toast';
import { AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { UserRole } from './role-indicator';

interface RoleNotificationProps {
  userRole: UserRole;
  requiredRole: UserRole;
  actionName: string;
  customMessage?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

/**
 * Utility to show role-based notifications when users attempt restricted actions
 * IMPORTANT: This is purely a UI/UX component for visual feedback
 * Backend validation and security remain completely separate and unaffected
 */
export const showRoleNotification = ({
  userRole,
  requiredRole,
  actionName,
  customMessage,
  type = 'warning'
}: RoleNotificationProps) => {
  let message = customMessage;
  
  if (!message) {
    switch (type) {
      case 'error':
        message = `Error: You need ${requiredRole} role to ${actionName}`;
        break;
      case 'warning':
        message = `Warning: You need ${requiredRole} role to ${actionName}`;
        break;
      case 'info':
        message = `Info: ${actionName} requires ${requiredRole} role`;
        break;
      case 'success':
        message = `Success: ${actionName} completed (as ${userRole})`;
        break;
      default:
        message = `You need ${requiredRole} role to ${actionName}`;
    }
  }
  
  // Map notification type to toast appearance
  const toastOptions: ToastOptions = {
    duration: 4000,
    position: 'bottom-right',
  };
  
  switch (type) {
    case 'error':
      toast.error(message, toastOptions);
      break;
    case 'warning':
      toast(message, {
        ...toastOptions,
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        style: { backgroundColor: '#fef3c7', color: '#92400e' }
      });
      break;
    case 'info':
      toast(message, {
        ...toastOptions,
        icon: <Info className="h-5 w-5 text-blue-500" />,
        style: { backgroundColor: '#dbeafe', color: '#1e40af' }
      });
      break;
    case 'success':
      toast.success(message, toastOptions);
      break;
    default:
      toast(message, toastOptions);
  }
};

interface RoleAwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  requiredRole: UserRole;
  actionName: string;
  title?: string;
  description?: string;
  onUpgrade?: () => void;
  showUpgradeOption?: boolean;
}

/**
 * Modal component that explains role restrictions
 * IMPORTANT: This is purely a UI/UX component for visual feedback
 * Backend validation and security remain completely separate and unaffected
 */
export const RoleAwareModal: React.FC<RoleAwareModalProps> = ({
  isOpen,
  onClose,
  userRole,
  requiredRole,
  actionName,
  title = "Access Restricted",
  description,
  onUpgrade,
  showUpgradeOption = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {description || React.createElement('span', null, `The "${actionName}" action requires ${requiredRole} role or higher.`)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Your current role is: <span className="font-medium">{userRole}</span>
              </p>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-between sm:gap-3">
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0"
                onClick={onClose}
              >
                Close
              </button>
              
              {showUpgradeOption && onUpgrade && (
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
                  onClick={onUpgrade}
                >
                  Contact Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RoleHintProps {
  userRole: UserRole;
  requiredRole: UserRole;
  actionName: string;
  hintType?: 'inline' | 'tooltip' | 'banner';
}

/**
 * Subtle hint to educate users about role requirements
 */
export const RoleHint: React.FC<RoleHintProps> = ({
  userRole,
  requiredRole,
  actionName,
  hintType = 'tooltip'
}) => {
  const isEligible = userRole === 'owner' || 
                     (userRole === 'admin' && requiredRole !== 'owner') || 
                     (userRole === 'member' && requiredRole === 'member');
  
  if (isEligible) return null; // Don't show hints to eligible users
  
  const hintContent = (
    <span className="text-xs text-muted-foreground italic">
      Requires {requiredRole} role • <span className="capitalize">{userRole}</span>s cannot {actionName}
    </span>
  );
  
  if (hintType === 'inline') {
    return <div className="mt-1">{hintContent}</div>;
  }
  
  if (hintType === 'banner') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Role Requirement</p>
            <p className="text-sm text-blue-700 mt-1">
              {React.createElement('span', null, `The "${actionName}" action requires ${requiredRole} role or higher. Contact your organization owner to adjust your role.`)}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Default to tooltip
  return (
    <div className="relative group inline-block">
      <Info className="h-4 w-4 text-muted-foreground ml-2 inline cursor-help" />
      <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-gray-800 text-white text-xs rounded py-1 px-2 w-64 z-10">
        {hintContent}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
      </div>
    </div>
  );
};

interface RoleAwareToastProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component to handle role-based notifications throughout the app
 */
export const RoleAwareToastProvider: React.FC<RoleAwareToastProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      {/* react-hot-toast container will be rendered here */}
    </>
  );
};
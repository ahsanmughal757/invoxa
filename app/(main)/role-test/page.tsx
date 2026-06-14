"use client";
import React, { useState } from 'react';
import { RoleIndicator, RoleAwareButton, RoleAwareAction, RoleRestrictedUI, PermissionCue, RestrictedContent } from '@/components/ui/role-indicator';
import { showRoleNotification, RoleAwareModal, RoleHint } from '@/components/ui/role-notification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Test page to demonstrate role-aware UI components
const RoleAwareUITestPage = () => {
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'admin' | 'member'>('member');
  const [modalOpen, setModalOpen] = useState(false);
  
  const handleActionAttempt = (action: string, userRole: string, requiredRole: string) => {
    console.log(`User attempted ${action} with role ${userRole}, required ${requiredRole}`);
    showRoleNotification({
      userRole,
      requiredRole,
      actionName: action,
      type: 'warning'
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Role-Aware UI Components Test</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Current User Role: {currentUserRole}</h2>
        <div className="flex gap-2">
          <Button 
            variant={currentUserRole === 'owner' ? 'default' : 'outline'} 
            onClick={() => setCurrentUserRole('owner')}
          >
            Switch to Owner
          </Button>
          <Button 
            variant={currentUserRole === 'admin' ? 'default' : 'outline'} 
            onClick={() => setCurrentUserRole('admin')}
          >
            Switch to Admin
          </Button>
          <Button 
            variant={currentUserRole === 'member' ? 'default' : 'outline'} 
            onClick={() => setCurrentUserRole('member')}
          >
            Switch to Member
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Role Indicator Test */}
        <Card>
          <CardHeader>
            <CardTitle>Role Indicator</CardTitle>
            <CardDescription>Show different role badges based on user role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <RoleIndicator role="owner" />
              <RoleIndicator role="admin" />
              <RoleIndicator role="member" />
              <RoleIndicator role={currentUserRole} size="lg" />
            </div>
          </CardContent>
        </Card>
        
        {/* Role Restricted UI Test */}
        <Card>
          <CardHeader>
            <CardTitle>Role Restricted UI</CardTitle>
            <CardDescription>Content that changes based on user role</CardDescription>
          </CardHeader>
          <CardContent>
            <RoleRestrictedUI 
              userRole={currentUserRole} 
              requiredRole="admin"
              showLock={true}
            >
              <div className="p-4 bg-green-100 rounded text-green-800">
                <p>Admin-level content visible!</p>
                <p>This content is accessible to admins and owners.</p>
              </div>
            </RoleRestrictedUI>
            
            <RoleRestrictedUI 
              userRole={currentUserRole} 
              requiredRole="owner"
              fallback={<p className="text-gray-500 italic">Only owners can see this content</p>}
            >
              <div className="p-4 bg-yellow-100 rounded text-yellow-800">
                <p>Owner-level content visible!</p>
                <p>This content is only for organization owners.</p>
              </div>
            </RoleRestrictedUI>
          </CardContent>
        </Card>
        
        {/* Role Aware Button Test */}
        <Card>
          <CardHeader>
            <CardTitle>Role Aware Buttons</CardTitle>
            <CardDescription>Buttons that show restrictions based on role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <RoleAwareButton
                userRole={currentUserRole}
                requiredRole="admin"
                onClick={() => alert('Delete organization clicked!')}
                variant="destructive"
              >
                Delete Organization
              </RoleAwareButton>
              
              <RoleAwareButton
                userRole={currentUserRole}
                requiredRole="owner"
                onClick={() => alert('Manage billing clicked!')}
              >
                Manage Billing
              </RoleAwareButton>
              
              <RoleAwareButton
                userRole={currentUserRole}
                requiredRole="member"
                onClick={() => alert('View reports clicked!')}
              >
                View Reports
              </RoleAwareButton>
            </div>
          </CardContent>
        </Card>
        
        {/* Role Aware Action Test */}
        <Card>
          <CardHeader>
            <CardTitle>Role Aware Actions</CardTitle>
            <CardDescription>Wrapping elements with role awareness</CardDescription>
          </CardHeader>
          <CardContent>
            <RoleAwareAction
              userRole={currentUserRole}
              requiredRole="admin"
              actionName="edit organization settings"
              onAttempt={handleActionAttempt}
            >
              <Button variant="outline">
                Edit Organization Settings
              </Button>
            </RoleAwareAction>
            
            <div className="mt-4">
              <RoleAwareAction
                userRole={currentUserRole}
                requiredRole="owner"
                actionName="transfer ownership"
                onAttempt={handleActionAttempt}
              >
                <span className="inline-block px-4 py-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300">
                  Transfer Organization Ownership
                </span>
              </RoleAwareAction>
            </div>
          </CardContent>
        </Card>
        
        {/* Permission Cue Test */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Cues</CardTitle>
            <CardDescription>Visual indicators for required permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span>Delete Organization</span>
              <PermissionCue 
                userRole={currentUserRole} 
                requiredRole="admin" 
                type="both" 
                position="inline" 
              />
            </div>
            
            <div className="flex items-center mt-2">
              <span>Manage Billing</span>
              <PermissionCue 
                userRole={currentUserRole} 
                requiredRole="owner" 
                position="tooltip" 
              />
            </div>
            
            <div className="mt-4">
              <span>View Analytics</span>
              <PermissionCue 
                userRole={currentUserRole} 
                requiredRole="member" 
                type="icon" 
                position="inline" 
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Restricted Content Test */}
        <Card>
          <CardHeader>
            <CardTitle>Restricted Content</CardTitle>
            <CardDescription>Content areas that show restrictions</CardDescription>
          </CardHeader>
          <CardContent>
            <RestrictedContent
              userRole={currentUserRole}
              requiredRole="admin"
            >
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-medium">Advanced Settings</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This section contains advanced organization settings that only admins can access.
                </p>
              </div>
            </RestrictedContent>
            
            <div className="mt-4">
              <RestrictedContent
                userRole={currentUserRole}
                requiredRole="owner"
                showReason={false}
                fallback={
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                    <h3 className="font-medium text-gray-500">Billing Information</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Only organization owners can view billing details.
                    </p>
                  </div>
                }
              >
                <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                  <h3 className="font-medium">Billing Information</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    This section contains billing information and payment methods.
                  </p>
                </div>
              </RestrictedContent>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Role Hint Test */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Role Hints</CardTitle>
          <CardDescription>Educational content about role requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Inline Hint</h4>
              <div className="flex items-center">
                <span>Delete Organization</span>
                <RoleHint 
                  userRole={currentUserRole} 
                  requiredRole="admin" 
                  actionName="delete organization" 
                  hintType="inline" 
                />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium">Tooltip Hint</h4>
              <div className="flex items-center">
                <span>Manage Billing</span>
                <RoleHint 
                  userRole={currentUserRole} 
                  requiredRole="owner" 
                  actionName="manage billing" 
                  hintType="tooltip" 
                />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium">Banner Hint</h4>
              <RoleHint 
                  userRole={currentUserRole} 
                  requiredRole="owner" 
                  actionName="transfer ownership" 
                  hintType="banner" 
                />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal Test */}
      <Card>
        <CardHeader>
          <CardTitle>Role-Aware Modal</CardTitle>
          <CardDescription>Modal that appears for restricted actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={() => setModalOpen(true)}
            className="mb-4"
          >
            Trigger Restricted Action Modal
          </Button>
          
          <RoleAwareModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            userRole={currentUserRole}
            requiredRole="owner"
            actionName="transfer organization ownership"
            showUpgradeOption={true}
            onUpgrade={() => {
              alert('Contact admin functionality triggered!');
              setModalOpen(false);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleAwareUITestPage;
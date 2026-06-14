"use client"

import { FileText, Building } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { OrganizationSwitcher } from '@/components/organization/organization-switcher'
import { UserButton } from '@clerk/nextjs'

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <div className="flex items-center">
                  <span className="text-xl font-bold text-gray-900">Invoxa</span>
                  <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">Enterprise</Badge>
                </div>
                <div className="text-xs text-gray-500">
                  Professional Invoice Management System
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <OrganizationSwitcher />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right text-sm">
              <div className="font-medium text-gray-900 flex items-center gap-2 justify-end">
                <Building className="h-4 w-4 text-gray-500" />
                <span>Organization Workspace</span>
              </div>
              <div className="text-gray-500">Manage invoices and clients</div>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  )
}
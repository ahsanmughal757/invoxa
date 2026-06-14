"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Info, Award, Shield, Users, Zap } from 'lucide-react'

export function AboutModal() {
  const [isOpen, setIsOpen] = useState(false)
  const currentYear = new Date().getFullYear()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
          <Info className="h-4 w-4 mr-2" />
          About
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            Invoxa Enterprise
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Product Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Professional Invoice Management System</h3>
                <p className="text-gray-600">
                  Streamline your billing process with our comprehensive invoice management solution
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center p-4">
                  <Zap className="h-8 w-8 text-blue-600 mb-2" />
                  <h4 className="font-medium">Fast & Efficient</h4>
                  <p className="text-sm text-gray-600">Create invoices in seconds</p>
                </div>
                <div className="flex flex-col items-center p-4">
                  <Shield className="h-8 w-8 text-green-600 mb-2" />
                  <h4 className="font-medium">Secure & Reliable</h4>
                  <p className="text-sm text-gray-600">Your data is protected</p>
                </div>
                <div className="flex flex-col items-center p-4">
                  <Users className="h-8 w-8 text-purple-600 mb-2" />
                  <h4 className="font-medium">Client Focused</h4>
                  <p className="text-sm text-gray-600">Built for businesses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Award className="h-5 w-5 text-blue-600 mr-2" />
                Key Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Invoice Creation & Management
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Custom Template Designer
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Client & Payment Tracking
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Expense Management
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Reports & Analytics
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Multi-Currency Support
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Print & Export Functionality
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Notification System
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company & Legal */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Your Company Name</h3>
              <p className="text-gray-600">Professional Software Solutions</p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Version 1.0.0 - Enterprise Edition</p>
                <p>© {currentYear} Your Company Name. All rights reserved.</p>
                <p>InvoicePro™ is a trademark of Your Company Name.</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
              <p>This software is licensed for use by the client organization.</p>
              <p>Unauthorized reproduction or distribution is prohibited.</p>
            </div>
          </div>

          {/* Support */}
          <div className="text-center">
            <h4 className="font-medium mb-2">Need Support?</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Email: support@yourcompany.com</p>
              <p>Phone: +1 (555) 123-4567</p>
              <p>Website: www.yourcompany.com</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
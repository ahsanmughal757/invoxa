"use client"

import { Card } from '@/components/ui/card'
import { FileText, Mail, Phone, Globe } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white mt-16 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <FileText className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-2xl font-bold">Invoxa</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Professional invoice management system designed to streamline your billing process 
              and help you get paid faster. Built with modern technology for businesses of all sizes.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <span>support@yourcompany.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                <span>www.yourcompany.com</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Invoice Creation & Management</li>
              <li>Custom Templates</li>
              <li>Payment Tracking</li>
              <li>Client Management</li>
              <li>Expense Tracking</li>
              <li>Reports & Analytics</li>
              <li>Multi-Currency Support</li>
              <li>Print & Export</li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Documentation</li>
              <li>Video Tutorials</li>
              <li>Email Support</li>
              <li>Live Chat</li>
              <li>Knowledge Base</li>
              <li>Community Forum</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400">
              © {currentYear} <span className="font-semibold">Your Company Name</span>. All rights reserved.
              <span className="mx-2">|</span>
              InvoicePro™ is a trademark of Your Company Name.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">License Agreement</a>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 text-center md:text-left">
            Developed by <span className="font-medium text-gray-400">Your Company Name</span> - 
            Professional Software Solutions
          </div>
        </div>
      </div>
    </footer>
  )
}
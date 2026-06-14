"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, X } from 'lucide-react'

export function LicenseBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium text-blue-900">Licensed Software</h3>
              <div className="text-sm text-blue-700">
                <p>Invoxa™ Enterprise Edition - Licensed to your organization by Your Company Name</p>
                <p className="text-xs mt-1">
                  For support: support@yourcompany.com | Technical: tech@yourcompany.com
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
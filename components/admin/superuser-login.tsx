"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Shield, Lock, Eye, EyeOff } from 'lucide-react'

// Zod schema for validation
const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormFields = z.infer<typeof loginSchema>;

interface SuperuserLoginProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (success: boolean) => void
}

export function SuperuserLogin({ isOpen, onClose, onLogin }: SuperuserLoginProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<LoginFormFields>({
    resolver: zodResolver(loginSchema),
  });

  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Default superuser credentials (in production, this would be properly secured)
  const SUPERUSER_CREDENTIALS = {
    username: 'superadmin',
    password: 'InvoicePro2024!'
  }

  const handleLoginSubmit = async (data: LoginFormFields) => {
    setIsLoading(true)
    setAuthError('')

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (
      data.username === SUPERUSER_CREDENTIALS.username &&
      data.password === SUPERUSER_CREDENTIALS.password
    ) {
      onLogin(true)
      handleClose()
    } else {
      setAuthError('Invalid credentials. Please try again.')
      onLogin(false)
    }

    setIsLoading(false)
  }

  const handleClose = () => {
    reset({ username: '', password: '' })
    setAuthError('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Shield className="h-6 w-6 text-red-600 mr-2" />
            Superuser Access
          </DialogTitle>
        </DialogHeader>
        
        <Card className="border-red-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-center text-sm text-gray-600">
              Enter superuser credentials to access system administration
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleLoginSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  {...register("username")}
                  placeholder="Enter username"
                  autoComplete="username"
                />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register("password")}
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {authError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {authError}
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Authenticating...' : 'Login'}
                </Button>
              </div>
            </form>

            <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
              <p className="font-medium mb-1">Default Credentials:</p>
              <p>Username: superadmin</p>
              <p>Password: InvoicePro2024!</p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
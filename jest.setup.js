import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(() => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
  })),
  currentUser: jest.fn(() => ({
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  })),
  UserButton: () => null,
  SignInButton: () => null,
  SignUpButton: () => null,
  SignOutButton: () => null,
}))

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
    })),
  })),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Save: () => null,
  Plus: () => null,
  Trash2: () => null,
  Edit: () => null,
  Eye: () => null,
  Send: () => null,
  AlertCircle: () => null,
  Loader2: () => null,
  Receipt: () => null,
  Search: () => null,
  Filter: () => null,
  DollarSign: () => null,
  TrendingDown: () => null,
  Calendar: () => null,
  Users: () => null,
  Mail: () => null,
  Phone: () => null,
  Building: () => null,
  Key: () => null,
  CheckCircle: () => null,
  Settings: () => null,
  Globe: () => null,
  Palette: () => null,
}))

// Global test utilities
global.fetch = jest.fn()

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
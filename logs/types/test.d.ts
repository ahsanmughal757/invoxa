// Test types declaration file
import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveAttribute(attr: string, value?: any): R
      toHaveTextContent(text: string | RegExp): R
      toHaveValue(value: any): R
      toBeDisabled(): R
      toHaveFocus(): R
      toBeVisible(): R
    }
  }
}

// For Testing Library matchers
declare module '@testing-library/jest-dom' {
  interface JestMatchers<T> {
    toBeInTheDocument(): void
    toHaveAttribute(attr: string, value?: any): void
    toHaveTextContent(text: string | RegExp): void
    toHaveValue(value: any): void
    toBeDisabled(): void
    toHaveFocus(): void
    toBeVisible(): void
  }
}

export {}
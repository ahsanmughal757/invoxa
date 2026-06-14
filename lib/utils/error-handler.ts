/**
 * Centralized error handler to distinguish between empty states and true errors
 */

export interface ErrorResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface EmptyStateResult {
  success: boolean;
  data: any;
  isEmpty: true;
}

export interface SuccessResult {
  success: true;
  data: any;
}

export type ActionResult = ErrorResult | EmptyStateResult | SuccessResult;

/**
 * Determines if an error is a true system failure vs an empty state
 */
export function isTrueError(error: any): boolean {
  if (!error) return false;
  
  // Check for specific error codes that indicate system failures vs empty states
  const errorMessage = typeof error === 'string' ? error : error.message || '';
  const errorCode = error.code || '';
  
  // These are typically empty state indicators, not true errors
  const emptyStateCodes = ['PGRST116']; // PostgREST no rows found
  const emptyStateMessages = [
    'Row not found',
    'No rows returned',
    'does not exist',
    'not found'
  ];
  
  // If it's an empty state indicator, it's not a true error
  if (emptyStateCodes.includes(errorCode)) {
    return false;
  }
  
  // Check if the error message indicates an empty state
  for (const msg of emptyStateMessages) {
    if (errorMessage.toLowerCase().includes(msg.toLowerCase())) {
      // But make sure it's not a validation/auth error
      const validationErrors = [
        'invalid',
        'unauthorized',
        'permission',
        'denied',
        'expired',
        'required'
      ];
      
      for (const validationMsg of validationErrors) {
        if (errorMessage.toLowerCase().includes(validationMsg)) {
          return true; // This is a validation/auth error, not an empty state
        }
      }
      
      return false; // This is an empty state
    }
  }
  
  // For other errors, determine if they're system failures
  const systemErrorIndicators = [
    'database',
    'connection',
    'timeout',
    'network',
    'server',
    'internal'
  ];
  
  for (const indicator of systemErrorIndicators) {
    if (errorMessage.toLowerCase().includes(indicator)) {
      return true; // This is a system error
    }
  }
  
  // Default: if we can't determine, treat as a true error for safety
  return true;
}

/**
 * Creates an appropriate result based on whether it's an empty state or true error
 */
export function createResult(data: any, error?: any): ActionResult {
  if (error) {
    if (isTrueError(error)) {
      return {
        success: false,
        error: typeof error === 'string' ? error : error.message || 'An error occurred'
      };
    } else {
      // This is an empty state, not a true error
      return {
        success: true,
        data: data || null,
        isEmpty: true
      };
    }
  }
  
  return {
    success: true,
    data
  };
}

/**
 * Checks if a result represents an empty state
 */
export function isEmptyState(result: ActionResult): result is EmptyStateResult {
  return 'isEmpty' in result && result.isEmpty === true;
}

/**
 * Checks if a result represents a true error
 */
export function isError(result: ActionResult): result is ErrorResult {
  return result.success === false && !!(result as ErrorResult).error;
}

/**
 * Checks if a result represents a success
 */
export function isSuccess(result: ActionResult): result is SuccessResult {
  return result.success === true && !('isEmpty' in result);
}

/**
 * Standardized error wrapper for async operations
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options: { 
    emptyStateHandler?: (error: any) => T | null,
    errorHandler?: (error: any) => ErrorResult 
  } = {}
): Promise<ActionResult> {
  try {
    const result = await operation();
    return createResult(result);
  } catch (error: any) {
    if (isTrueError(error)) {
      if (options.errorHandler) {
        return options.errorHandler(error);
      }
      return {
        success: false,
        error: typeof error === 'string' ? error : error.message || 'An unexpected error occurred'
      };
    } else {
      // Empty state - return success with potentially transformed data
      if (options.emptyStateHandler) {
        const emptyStateData = options.emptyStateHandler(error);
        return {
          success: true,
          data: emptyStateData,
          isEmpty: true
        };
      }
      return {
        success: true,
        data: null,
        isEmpty: true
      };
    }
  }
}
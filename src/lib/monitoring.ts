// Error tracking and monitoring utilities

export interface ErrorLog {
  id: string;
  timestamp: number;
  userId?: string;
  error: string;
  stack?: string;
  context: Record<string, unknown>;
  userAgent: string;
  url: string;
}

// Log errors to console and prepare for external service
export function logError(error: Error | string, context: Record<string, unknown> = {}, userId?: string) {
  const errorLog: ErrorLog = {
    id: generateId(),
    timestamp: Date.now(),
    userId: userId || getCurrentUserId(),
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // In production, send to monitoring service
  if (import.meta.env.PROD) {
    // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
    sendToMonitoringService(errorLog);
  }

  return errorLog;
}

// Log user actions for analytics
export function logUserAction(action: string, data: Record<string, unknown> = {}, userId?: string) {
  const actionLog = {
    id: generateId(),
    timestamp: Date.now(),
    userId: userId || getCurrentUserId(),
    action,
    data,
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  // In production, send to analytics service
  if (import.meta.env.PROD) {
    sendToAnalyticsService(actionLog);
  }
}

// Monitor API calls (new version that wraps fetch)
export async function monitorApiCall(
  endpoint: string, 
  fetchFn: () => Promise<Response>, 
  metadata: Record<string, unknown> = {},
  userId?: string
): Promise<Response> {
  const startTime = Date.now();
  
  try {
    const response = await fetchFn();
    const duration = Date.now() - startTime;
    const success = response.ok;

    logUserAction('api_call', {
      endpoint,
      method: 'GET', // Default, could be enhanced to detect method
      duration,
      success,
      status: response.status,
      ...metadata
    }, userId);

    // Alert on slow or failing requests
    if (duration > 10000) { // 10 seconds
      logError(`Slow API call: ${endpoint} took ${duration}ms`, { endpoint, method: 'GET', ...metadata }, userId);
    }

    if (!success) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logError(`API call failed: ${endpoint} (${response.status})`, { 
        endpoint, 
        method: 'GET', 
        status: response.status,
        error: errorText,
        ...metadata 
      }, userId);
    }

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    
    logUserAction('api_call', {
      endpoint,
      method: 'GET',
      duration,
      success: false,
      error: errorMessage,
      ...metadata
    }, userId);

    logError(`API call failed: ${endpoint} - ${errorMessage}`, { 
      endpoint, 
      method: 'GET', 
      duration,
      ...metadata 
    }, userId);

    throw error;
  }
}

// Utility functions
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getCurrentUserId(): string | undefined {
  // This would integrate with your auth system
  // For now, return undefined for anonymous users
  return undefined;
}

// Placeholder functions for external services
function sendToMonitoringService(errorLog: ErrorLog) {
  // TODO: Implement Sentry, Bugsnag, etc.
}

function sendToAnalyticsService(actionLog: Record<string, unknown>) {
  // TODO: Implement Google Analytics, Mixpanel, etc.
}

// Global error handler
export function setupGlobalErrorHandling() {
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, { type: 'unhandledrejection' });
  });
}
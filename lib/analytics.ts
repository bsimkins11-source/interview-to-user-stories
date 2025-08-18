// Enterprise-grade analytics and performance monitoring
export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'navigation' | 'api' | 'rendering' | 'user-interaction';
}

export interface UserJourney {
  step: string;
  duration: number;
  success: boolean;
  errors?: string[];
  timestamp: number;
  category: 'workflow' | 'api' | 'user-interaction' | 'file-upload' | 'ai-processing';
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private userJourney: UserJourney[] = [];
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean;
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.initializeFlushInterval();
    this.trackPageView();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeFlushInterval(): void {
    if (this.isEnabled) {
      setInterval(() => {
        this.flushEvents();
      }, this.flushInterval);
    }
  }

  // Track page views
  trackPageView(page: string = window.location.pathname): void {
    this.trackEvent('page_view', 'navigation', 'view', page);
  }

  // Track user interactions
  trackUserInteraction(action: string, label?: string, value?: number): void {
    this.trackEvent('user_interaction', 'engagement', action, label, value);
  }

  // Track form submissions
  trackFormSubmission(formName: string, success: boolean, duration?: number): void {
    this.trackEvent('form_submission', 'forms', success ? 'success' : 'failure', formName, duration);
  }

  // Track API calls
  trackApiCall(endpoint: string, method: string, duration: number, success: boolean): void {
    this.trackEvent('api_call', 'api', method, endpoint, duration);
    this.addPerformanceMetric('api_response_time', duration, 'ms', 'api');
  }

  // Track workflow progression
  trackWorkflowStep(step: string, success: boolean, duration: number, errors?: string[]): void {
    this.trackEvent('workflow_step', 'workflow', success ? 'completed' : 'failed', step);
    this.addUserJourneyStep(step, duration, success, errors, 'workflow');
  }

  // Track file uploads
  trackFileUpload(fileName: string, fileSize: number, fileType: string, success: boolean): void {
    this.trackEvent('file_upload', 'files', success ? 'success' : 'failure', fileName, fileSize);
    this.addUserJourneyStep('file_upload', 0, success, undefined, 'file-upload');
  }

  // Track AI processing
  trackAIProcessing(step: string, duration: number, success: boolean, model?: string): void {
    this.trackEvent('ai_processing', 'ai', step, model, duration);
    this.addPerformanceMetric('ai_processing_time', duration, 'ms', 'api');
    this.addUserJourneyStep(step, duration, success, undefined, 'ai-processing');
  }

  // Track errors
  trackError(error: Error, context: string, severity: 'low' | 'medium' | 'high' = 'medium'): void {
    this.trackEvent('error', 'errors', severity, context, undefined, {
      errorMessage: error.message,
      errorStack: error.stack,
      severity
    });
  }

  // Add performance metric
  addPerformanceMetric(name: string, value: number, unit: string, category: PerformanceMetric['category']): void {
    this.performanceMetrics.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
      category
    });
  }

  // Add user journey step
  addUserJourneyStep(step: string, duration: number, success: boolean, errors?: string[], category: UserJourney['category'] = 'workflow'): void {
    this.userJourney.push({
      step,
      duration,
      success,
      errors,
      timestamp: Date.now(),
      category
    });
  }

  // Track custom event
  trackEvent(
    event: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    properties?: Record<string, any>
  ): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      category,
      action,
      label,
      value,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.events.push(analyticsEvent);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', analyticsEvent);
    }

    // Flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flushEvents();
    }
  }

  // Set user ID for tracking
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Get analytics summary
  getAnalyticsSummary(): {
    totalEvents: number;
    sessionDuration: number;
    workflowCompletionRate: number;
    averageApiResponseTime: number;
    errorRate: number;
  } {
    const now = Date.now();
    const sessionDuration = now - parseInt(this.sessionId.split('_')[1]);
    
    const workflowSteps = this.userJourney.filter(j => j.category === 'workflow');
    const workflowCompletionRate = workflowSteps.length > 0 
      ? (workflowSteps.filter(j => j.success).length / workflowSteps.length) * 100
      : 0;

    const apiMetrics = this.performanceMetrics.filter(m => m.category === 'api');
    const averageApiResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0;

    const errorEvents = this.events.filter(e => e.event === 'error');
    const errorRate = this.events.length > 0
      ? (errorEvents.length / this.events.length) * 100
      : 0;

    return {
      totalEvents: this.events.length,
      sessionDuration,
      workflowCompletionRate,
      averageApiResponseTime,
      errorRate
    };
  }

  // Flush events to analytics service
  private async flushEvents(): Promise<void> {
    if (!this.isEnabled || this.events.length === 0) return;

    try {
      const eventsToFlush = [...this.events];
      this.events = [];

      // In production, send to your analytics service
      // Example: Google Analytics, Mixpanel, Amplitude, etc.
      if (typeof window !== 'undefined' && (window as any).gtag) {
        eventsToFlush.forEach(event => {
          (window as any).gtag('event', event.action, {
            event_category: event.category,
            event_label: event.label,
            value: event.value,
            custom_parameters: event.properties
          });
        });
      }

      // Send to your backend analytics endpoint
      await this.sendToBackend(eventsToFlush);

    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Restore events that failed to send
      this.events.unshift(...this.events);
    }
  }

  // Send events to backend
  private async sendToBackend(events: AnalyticsEvent[]): Promise<void> {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events,
          sessionId: this.sessionId,
          userId: this.userId,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to send analytics to backend:', error);
    }
  }

  // Export analytics data
  exportAnalytics(): {
    events: AnalyticsEvent[];
    performanceMetrics: PerformanceMetric[];
    userJourney: UserJourney[];
    summary: {
      totalEvents: number;
      sessionDuration: number;
      workflowCompletionRate: number;
      averageApiResponseTime: number;
      errorRate: number;
    };
  } {
    return {
      events: [...this.events],
      performanceMetrics: [...this.performanceMetrics],
      userJourney: [...this.userJourney],
      summary: this.getAnalyticsSummary()
    };
  }

  // Clear analytics data
  clearAnalytics(): void {
    this.events = [];
    this.performanceMetrics = [];
    this.userJourney = [];
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static marks = new Map<string, number>();
  private static measures = new Map<string, number>();

  // Start timing an operation
  static startTimer(name: string): void {
    this.marks.set(name, performance.now());
  }

  // End timing an operation
  static endTimer(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measures.set(name, duration);
    this.marks.delete(name);

    return duration;
  }

  // Get timing for an operation
  static getTiming(name: string): number | undefined {
    return this.measures.get(name);
  }

  // Measure time for async operations
  static async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    this.startTimer(name);
    try {
      const result = await operation();
      return result;
    } finally {
      this.endTimer(name);
    }
  }

  // Get all performance measures
  static getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  // Clear all measures
  static clearMeasures(): void {
    this.measures.clear();
    this.marks.clear();
  }
}

// Create global analytics instance
export const analytics = new Analytics();

// Export performance monitor
export { PerformanceMonitor as Performance };

// Utility functions for easy tracking
export const track = {
  pageView: (page?: string) => analytics.trackPageView(page),
  userInteraction: (action: string, label?: string, value?: number) => 
    analytics.trackUserInteraction(action, label, value),
  formSubmission: (formName: string, success: boolean, duration?: number) => 
    analytics.trackFormSubmission(formName, success, duration),
  apiCall: (endpoint: string, method: string, duration: number, success: boolean) => 
    analytics.trackApiCall(endpoint, method, duration, success),
  workflowStep: (step: string, success: boolean, duration: number, errors?: string[]) => 
    analytics.trackWorkflowStep(step, success, duration, errors),
  fileUpload: (fileName: string, fileSize: number, fileType: string, success: boolean) => 
    analytics.trackFileUpload(fileName, fileSize, fileType, success),
  aiProcessing: (step: string, duration: number, success: boolean, model?: string) => 
    analytics.trackAIProcessing(step, duration, success, model),
  error: (error: Error, context: string, severity?: 'low' | 'medium' | 'high') => 
    analytics.trackError(error, context, severity)
};

// Performance tracking decorator
export function trackPerformance(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      try {
        const result = await method.apply(this, args);
        const duration = performance.now() - startTime;
        analytics.trackEvent('method_execution', 'performance', 'success', name, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        analytics.trackEvent('method_execution', 'performance', 'failure', name, duration);
        throw error;
      }
    };

    return descriptor;
  };
}

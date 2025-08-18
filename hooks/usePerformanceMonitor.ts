"use client";

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  componentMountTime: number;
  renderCount: number;
  averageRenderTime: number;
  memoryUsage?: number;
  interactionTime?: number;
}

interface PerformanceOptions {
  trackMemory?: boolean;
  trackInteractions?: boolean;
  logToConsole?: boolean;
  sendToAnalytics?: boolean;
}

export function usePerformanceMonitor(
  componentName: string,
  options: PerformanceOptions = {}
) {
  const mountTime = useRef<number>(Date.now());
  const renderCount = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);
  const lastRenderTime = useRef<number>(Date.now());
  const interactionStartTime = useRef<number | null>(null);

  // Track component mount
  useEffect(() => {
    const mountDuration = Date.now() - mountTime.current;
    
    if (options.logToConsole) {
      console.log(`🚀 ${componentName} mounted in ${mountDuration}ms`);
    }
    
    if (options.sendToAnalytics) {
      // Send to analytics service
      trackPerformanceEvent('component_mount', {
        component: componentName,
        duration: mountDuration,
        timestamp: Date.now()
      });
    }
  }, [componentName, options.logToConsole, options.sendToAnalytics]);

  // Track render performance
  useEffect(() => {
    const now = Date.now();
    const renderTime = now - lastRenderTime.current;
    
    renderCount.current++;
    renderTimes.current.push(renderTime);
    lastRenderTime.current = now;
    
    // Keep only last 100 render times for memory efficiency
    if (renderTimes.current.length > 100) {
      renderTimes.current = renderTimes.current.slice(-100);
    }
    
    if (options.logToConsole && renderCount.current % 10 === 0) {
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      console.log(`📊 ${componentName} render #${renderCount.current} in ${renderTime}ms (avg: ${avgRenderTime.toFixed(2)}ms)`);
    }
  });

  // Track memory usage if enabled
  useEffect(() => {
    if (!options.trackMemory || !('memory' in performance)) return;
    
    const memoryInfo = (performance as any).memory;
    if (memoryInfo) {
      const memoryUsage = memoryInfo.usedJSHeapSize / 1024 / 1024; // MB
      
      if (options.logToConsole && renderCount.current % 20 === 0) {
        console.log(`💾 ${componentName} memory usage: ${memoryUsage.toFixed(2)}MB`);
      }
      
      if (options.sendToAnalytics) {
        trackPerformanceEvent('memory_usage', {
          component: componentName,
          memoryUsage,
          timestamp: Date.now()
        });
      }
    }
  }, [componentName, options.trackMemory, options.logToConsole, options.sendToAnalytics, renderCount.current]);

  // Track user interactions
  const trackInteraction = useCallback((interactionType: string) => {
    if (!options.trackInteractions) return;
    
    const now = Date.now();
    const duration = interactionStartTime.current ? now - interactionStartTime.current : 0;
    
    if (options.logToConsole) {
      console.log(`👆 ${componentName} interaction: ${interactionType} (${duration}ms)`);
    }
    
    if (options.sendToAnalytics) {
      trackPerformanceEvent('user_interaction', {
        component: componentName,
        interactionType,
        duration,
        timestamp: now
      });
    }
    
    interactionStartTime.current = now;
  }, [componentName, options.trackInteractions, options.logToConsole, options.sendToAnalytics]);

  // Get current performance metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    const avgRenderTime = renderTimes.current.length > 0 
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length 
      : 0;
    
    const metrics: PerformanceMetrics = {
      componentMountTime: mountTime.current,
      renderCount: renderCount.current,
      averageRenderTime: avgRenderTime
    };
    
    if (options.trackMemory && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        metrics.memoryUsage = memoryInfo.usedJSHeapSize / 1024 / 1024;
      }
    }
    
    if (options.trackInteractions && interactionStartTime.current) {
      metrics.interactionTime = Date.now() - interactionStartTime.current;
    }
    
    return metrics;
  }, [options.trackMemory, options.trackInteractions]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (options.logToConsole) {
      const metrics = getMetrics();
      const totalTime = Date.now() - mountTime.current;
      console.log(`🧹 ${componentName} cleanup - Total time: ${totalTime}ms, Renders: ${metrics.renderCount}, Avg render: ${metrics.averageRenderTime.toFixed(2)}ms`);
    }
    
    if (options.sendToAnalytics) {
      const metrics = getMetrics();
      trackPerformanceEvent('component_cleanup', {
        component: componentName,
        totalTime: Date.now() - mountTime.current,
        ...metrics,
        timestamp: Date.now()
      });
    }
  }, [componentName, options.logToConsole, options.sendToAnalytics, getMetrics]);

  return {
    trackInteraction,
    getMetrics,
    cleanup,
    renderCount: renderCount.current
  };
}

// Analytics tracking function
function trackPerformanceEvent(eventName: string, data: Record<string, any>) {
  // In production, this would send to your analytics service
  // For now, we'll just log it
  if (process.env.NODE_ENV === 'development') {
    console.log(`📈 Performance Event: ${eventName}`, data);
  }
  
  // Example: Send to Google Analytics, Mixpanel, etc.
  // gtag('event', eventName, data);
  // mixpanel.track(eventName, data);
}

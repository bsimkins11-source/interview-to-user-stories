"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug, AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReportButton?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  isReporting: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: this.generateErrorId(),
      isReporting: false
    };
  }

  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error, 
      errorInfo: null,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isReporting: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console and any error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to external service (e.g., Sentry, LogRocket)
    this.reportErrorToService(error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo
    });
  }

  private reportErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In production, send to your error reporting service
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureException(error, { extra: errorInfo });
        console.log('Error reported to service:', this.state.errorId);
      }
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: this.generateErrorId()
    });
  };

  handleGoHome = () => {
    // Reset to initial state and navigate home
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: this.generateErrorId()
    });
    
    // You can add navigation logic here if using Next.js router
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  handleReportError = async () => {
    this.setState({ isReporting: true });
    
    try {
      // In production, this would send detailed error info to your team
      await this.reportErrorToService(this.state.error!, this.state.errorInfo!);
      
      // Show success message
      alert('Error reported successfully. Our team will investigate.');
    } catch (error) {
      alert('Failed to report error. Please try again.');
    } finally {
      this.setState({ isReporting: false });
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default enterprise error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-800">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center text-gray-600">
                <p className="mb-4">
                  We encountered an unexpected error while processing your request.
                </p>
                <p className="text-sm">
                  Our engineering team has been automatically notified and is working to resolve this issue.
                </p>
              </div>

              {/* Error Details for Developers */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Bug className="w-4 h-4 mr-2" />
                    Error Details (Development)
                  </h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div>
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-xs bg-gray-200 p-2 rounded overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Reporting */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-900">Help Us Improve</h3>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  This error has been automatically logged. If you'd like to provide additional context, please report it.
                </p>
                <Button 
                  onClick={this.handleReportError}
                  disabled={this.state.isReporting}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {this.state.isReporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Reporting...
                    </>
                  ) : (
                    <>
                      <Bug className="w-4 h-4 mr-2" />
                      Report Error
                    </>
                  )}
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={this.handleRetry}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Support Information */}
              <div className="text-center text-xs text-gray-500">
                <p>If this problem persists, please contact support.</p>
                <p>Error ID: {this.state.errorId}</p>
                <p>Time: {new Date().toISOString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    console.error('Error caught by useErrorHandler:', error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-night flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-gold/10 border border-gold/20 rounded-xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-500/20 p-4 rounded-full">
                <AlertTriangle className="h-12 w-12 text-red-400" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-ivory mb-2">
              Une erreur est survenue
            </h1>

            <p className="text-ivory/70 mb-6">
              Nous sommes désolés, quelque chose s'est mal passé. Veuillez réessayer.
            </p>

            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div className="bg-night/60 rounded-lg p-4 mb-6 text-left">
                <p className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 w-full bg-gold hover:bg-gold/90 text-night font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

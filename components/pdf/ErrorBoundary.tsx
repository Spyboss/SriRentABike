"use client"
import { Component, ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; message?: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: String(error?.message ?? 'PDF render failed') }
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded border bg-red-50 p-3 text-red-900" role="alert" aria-live="polite">
          {this.state.message}
        </div>
      )
    }
    return this.props.children
  }
}


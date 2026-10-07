import React from 'react'
import { reportClientError } from './error-reporting'

type ErrorBoundaryProps = {
  children: React.ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    reportClientError('render-error', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <p role="alert">
          Something went wrong while rendering this page. Please reload.
        </p>
      )
    }

    return this.props.children
  }
}

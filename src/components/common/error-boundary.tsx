/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertOctagon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  resetKey?: string
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidUpdate(previous: Props): void {
    if (previous.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Render error:', error, info.componentStack)
  }

  private readonly reset = () => this.setState({ error: null })

  override render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertOctagon className="h-6 w-6 text-destructive" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold">This screen ran into a problem</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Your saved data is safe. You can retry this screen or move to another one from the sidebar.
          </p>
        </div>
        <pre className="selectable max-w-xl overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
          {error.message}
        </pre>
        <Button onClick={this.reset}>Retry</Button>
      </div>
    )
  }
}

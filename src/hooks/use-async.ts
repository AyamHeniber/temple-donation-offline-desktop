/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { toMessage } from '@/utils/errors'

export interface AsyncState<T> {
  data: T | null
  error: string | null
  loading: boolean
  initialising: boolean
  refresh: () => Promise<void>
  setData: (updater: T | ((current: T | null) => T | null)) => void
}

export function useAsync<T>(factory: () => Promise<T>, deps: React.DependencyList = []): AsyncState<T> {
  const [data, setDataState] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialising, setInitialising] = useState(true)

  const mounted = useRef(true)
  const requestId = useRef(0)
  const factoryRef = useRef(factory)
  factoryRef.current = factory

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const run = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)

    try {
      const result = await factoryRef.current()
      if (!mounted.current || id !== requestId.current) return
      setDataState(result)
      setError(null)
    } catch (err) {
      if (!mounted.current || id !== requestId.current) return
      setError(toMessage(err, 'Could not load this data.'))
    } finally {
      if (mounted.current && id === requestId.current) {
        setLoading(false)
        setInitialising(false)
      }
    }
  }, [])

  useEffect(() => {
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const setData = useCallback((updater: T | ((current: T | null) => T | null)) => {
    setDataState((current) =>
      typeof updater === 'function' ? (updater as (c: T | null) => T | null)(current) : updater,
    )
  }, [])

  return { data, error, loading, initialising, refresh: run, setData }
}

export interface MutationState<TArgs extends unknown[], TResult> {
  run: (...args: TArgs) => Promise<TResult | undefined>
  pending: boolean
  error: string | null
}

export function useMutation<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: { onSuccess?: (result: TResult) => void; onError?: (error: unknown) => void } = {},
): MutationState<TArgs, TResult> {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  const actionRef = useRef(action)
  actionRef.current = action
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const run = useCallback(async (...args: TArgs) => {
    setPending(true)
    setError(null)

    try {
      const result = await actionRef.current(...args)
      optionsRef.current.onSuccess?.(result)
      return result
    } catch (err) {
      if (mounted.current) setError(toMessage(err))
      optionsRef.current.onError?.(err)
      return undefined
    } finally {
      if (mounted.current) setPending(false)
    }
  }, [])

  return { run, pending, error }
}

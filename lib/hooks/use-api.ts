'use client'

import { useState, useCallback } from 'react'

interface MutationState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

export function useApiMutation<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>
) {
  const [state, setState] = useState<MutationState<T>>({
    data: null,
    error: null,
    loading: false,
  })

  const mutate = useCallback(
    async (...args: A) => {
      setState({ data: null, error: null, loading: true })
      try {
        const data = await fn(...args)
        setState({ data, error: null, loading: false })
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        setState({ data: null, error: message, loading: false })
        throw err
      }
    },
    [fn]
  )

  return { ...state, mutate }
}

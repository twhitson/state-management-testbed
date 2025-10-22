import { useState, useCallback } from "react";

/**
 * State returned by useMutation
 */
export interface MutationState<TData, TError = Error> {
  /** Whether the mutation is currently executing */
  isLoading: boolean;
  /** Whether the mutation completed successfully */
  isSuccess: boolean;
  /** Whether the mutation failed with an error */
  isError: boolean;
  /** The successful result data (undefined if not successful yet) */
  data: TData | undefined;
  /** The error if mutation failed (undefined if no error) */
  error: TError | undefined;
}

/**
 * Return value from useMutation
 */
export interface MutationResult<TData, TVariables, TError = Error>
  extends MutationState<TData, TError> {
  /** Execute the mutation with the provided variables */
  mutate: (variables: TVariables) => void;
  /** Execute the mutation and return a promise */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** Reset the mutation state back to initial values */
  reset: () => void;
}

/**
 * A simple mutation hook that wraps async operations
 *
 * @example
 * ```tsx
 * const { mutate, mutateAsync, isLoading, isSuccess, isError, data, error } = useMutation(
 *   async (newTitle: string) => {
 *     const response = await fetch('/api/update', {
 *       method: 'POST',
 *       body: JSON.stringify({ title: newTitle })
 *     });
 *     return response.json();
 *   }
 * );
 *
 * // Use mutate for fire-and-forget
 * mutate("New Title");
 *
 * // Or use mutateAsync to await the result
 * const result = await mutateAsync("New Title");
 * ```
 */
export function useMutation<TData, TVariables = void, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>
): MutationResult<TData, TVariables, TError> {
  const [state, setState] = useState<MutationState<TData, TError>>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    data: undefined,
    error: undefined,
  });

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      data: undefined,
      error: undefined,
    });
  }, []);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setState({
        isLoading: true,
        isSuccess: false,
        isError: false,
        data: undefined,
        error: undefined,
      });

      try {
        const data = await mutationFn(variables);
        setState({
          isLoading: false,
          isSuccess: true,
          isError: false,
          data,
          error: undefined,
        });
        return data;
      } catch (error) {
        const err = error as TError;
        setState({
          isLoading: false,
          isSuccess: false,
          isError: true,
          data: undefined,
          error: err,
        });
        throw error;
      }
    },
    [mutationFn]
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      mutateAsync(variables).catch(() => {
        // Error is already handled in mutateAsync
        // Just prevent unhandled promise rejection
      });
    },
    [mutateAsync]
  );

  return {
    ...state,
    mutate,
    mutateAsync,
    reset,
  };
}

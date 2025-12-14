import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
});

interface UseQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: number | false;
  refetchOnWindowFocus?: boolean;
}

export function useFetchData<T>(
  queryKey: string[],
  url: string,
  options?: UseQueryOptions
) {
  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<T>(url);
      return response.data;
    },
    ...options,
  });
}

interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useCreateData<T, V>(
  url: string,
  options?: UseMutationOptions<T>
) {
  const queryClient = useQueryClient();

  return useMutation<T, Error, V>({
    mutationFn: async (data: V) => {
      const response = await apiClient.post<T>(url, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

export function useUpdateData<T, V>(
  url: string,
  options?: UseMutationOptions<T>
) {
  const queryClient = useQueryClient();

  return useMutation<T, Error, V>({
    mutationFn: async (data: V) => {
      const response = await apiClient.put<T>(url, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

export function useDeleteData<T>(
  url: string,
  options?: UseMutationOptions<T>
) {
  const queryClient = useQueryClient();

  return useMutation<T, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.delete<T>(url);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

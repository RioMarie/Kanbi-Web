import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './api'

export interface WithId {
  id: number
}

export function createService<T extends WithId>(endpoint: string) {
  const queryKey = [endpoint]

  const requests = {
    getAll: () => api.get<T[]>(endpoint).then((r) => r.data),
    getById: (id: number) => api.get<T>(`${endpoint}/${id}`).then((r) => r.data),
    create: (payload: Omit<T, 'id'>) => api.post<T>(endpoint, payload).then((r) => r.data),
    update: (id: number, payload: Partial<T>) =>
      api.put<T>(`${endpoint}/${id}`, payload).then((r) => r.data),
    delete: (id: number) => api.delete(`${endpoint}/${id}`),
  }

  function useGetAll() {
    return useQuery({ queryKey, queryFn: requests.getAll })
  }

  function useGetById(id: number) {
    return useQuery({ queryKey: [...queryKey, id], queryFn: () => requests.getById(id) })
  }

  function useCreate() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: requests.create,
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    })
  }

  function useUpdate() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, created_at: _, ...payload }: T & { created_at?: unknown }) => requests.update(id, payload as Partial<T>),
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    })
  }

  function useDelete() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: requests.delete,
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    })
  }

  return { useGetAll, useGetById, useCreate, useUpdate, useDelete }
}

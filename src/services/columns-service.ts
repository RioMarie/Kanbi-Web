import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createService } from "./factory";
import api from "./api";

export interface Column {
  id: number;
  title: string;
  position?: number;
  created_date?: Date;
}

interface CreateColumnPayload {
  title: string;
  position: number;
}

interface UpdateColumnPayload {
  id: number;
  title: string;
  position?: number;
}

const { useGetAll, useGetById, useDelete } = createService<Column>("/columns");

function useCreate(boardId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateColumnPayload) =>
      api.post<Column>(`/columns/${boardId}`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/columns"] }),
  });
}

function useUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title, position }: UpdateColumnPayload) =>
      api
        .put<Column>(`/columns/${id}`, { title, position })
        .then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/columns"] }),
  });
}

export const columnsService = {
  useGetAll,
  useGetById,
  useCreate,
  useUpdate,
  useDelete,
};

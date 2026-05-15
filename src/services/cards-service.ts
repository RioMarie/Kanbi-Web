import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createService } from "./factory";
import api from "./api";
import type { Card } from "./dashboard-service";

interface CreateCardPayload {
  title: string;
  position: number;
  description: string;
  due_date: string;
  priority: number;
}

const { useGetAll, useGetById, useUpdate, useDelete } =
  createService<Card>("/cards");

function useCreate(columnId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCardPayload) =>
      api.post<Card>(`/cards/${columnId}`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/cards"] }),
  });
}

export const cardsService = {
  useGetAll,
  useGetById,
  useCreate,
  useUpdate,
  useDelete,
};

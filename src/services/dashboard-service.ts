import { useQuery } from "@tanstack/react-query";
import api from "./api";

export interface Card {
  id: number;
  column_id: number;
  title: string;
  description: string;
  due_date: string;
  position: number;
  priority: number;
  created_at: string;
}

export interface Column {
  id: number;
  title: string;
  position: number;
  created_at: string;
  cards: Card[];
}

export interface Boards {
  id: number;
  title: string;
  created_at: string;
  columns: Column[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<Boards[]>("/boards/dashboard").then((r) => r.data),
  });
}

export function useBoard(id: number) {
  return useQuery({
    queryKey: ["board", id],
    queryFn: () => api.get<Boards>(`/boards/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

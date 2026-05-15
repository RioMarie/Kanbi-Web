import { createService } from "./factory";

export interface Board {
  id: number;
  title: string;
  created_date?: Date;
}

export const boardsService = createService<Board>("/boards");

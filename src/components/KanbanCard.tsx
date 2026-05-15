import { useState, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "../services/dashboard-service";

interface Props {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
}

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: "Low", color: "bg-emerald-100 text-emerald-700" },
  2: { label: "Medium", color: "bg-amber-100 text-amber-700" },
  3: { label: "High", color: "bg-rose-100 text-rose-700" },
};

function formatDueDate(raw: string): { label: string; overdue: boolean } {
  const due = new Date(raw + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = due < today;
  const label = due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return { label, overdue };
}

export function KanbanCard({ card, onEdit, onDelete }: Props) {
  const [hovered, setHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `card-${card.id}`,
    data: { type: "card", card },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const priority = PRIORITY_CONFIG[card.priority];
  const dueDate = useMemo(
    () => (card.due_date ? formatDueDate(card.due_date) : null),
    [card.due_date],
  );

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-14 rounded-lg border-2 border-dashed border-slate-200 bg-slate-100/50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: "white" }}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-800 font-medium leading-snug">
          {card.title}
        </p>
        <div
          className={`flex gap-0.5 shrink-0 transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}
        >
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(card);
            }}
            className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card);
            }}
            className="p-1 rounded text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex">
        {card.description && (
          <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-1">
            {card.description}
          </p>
        )}
      </div>

      {(priority || dueDate) && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {priority && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${priority.color}`}
            >
              {priority.label}
            </span>
          )}
          {dueDate && (
            <span
              className={`text-xs flex items-center gap-1 ${dueDate.overdue ? "text-rose-500 font-medium" : "text-gray-400"}`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {dueDate.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function KanbanCardOverlay({ card }: { card: Card }) {
  const priority = PRIORITY_CONFIG[card.priority];
  return (
    <div className="rounded-lg border border-blue-400 shadow-xl p-3 rotate-2 w-64 opacity-95 bg-white">
      <p className="text-sm text-gray-800 font-medium">{card.title}</p>
      {priority && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full font-medium mt-1.5 inline-block ${priority.color}`}
        >
          {priority.label}
        </span>
      )}
    </div>
  );
}

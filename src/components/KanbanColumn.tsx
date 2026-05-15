import { useState, useMemo } from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard } from "./KanbanCard";
import type { Card, Column } from "../services/dashboard-service";

interface Props {
  column: Column;
  cards: Card[];
  onEditColumn: (column: Column) => void;
  onDeleteColumn: (column: Column) => void;
  onAddCard: (columnId: number) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (card: Card) => void;
}

export function KanbanColumn({ column, cards, onEditColumn, onDeleteColumn, onAddCard, onEditCard, onDeleteCard }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `col-${column.id}`,
    data: { type: "column", column },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const cardIds = useMemo(() => cards.map((c) => `card-${c.id}`), [cards]);

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-72 shrink-0 rounded-xl border-2 border-dashed border-slate-200 bg-slate-100/50 min-h-[10rem]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: "rgba(255,255,255,0.92)" }}
      className="w-72 shrink-0 flex flex-col rounded-xl max-h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-1 px-2 pt-2.5 pb-1.5 select-none">
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors cursor-grab active:cursor-grabbing shrink-0"
          tabIndex={-1}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="7" cy="5" r="1.5" /><circle cx="13" cy="5" r="1.5" />
            <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
            <circle cx="7" cy="15" r="1.5" /><circle cx="13" cy="15" r="1.5" />
          </svg>
        </button>
        <h3 className="text-sm font-semibold text-slate-700 flex-1 truncate">{column.title}</h3>
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-xs text-slate-400 font-medium tabular-nums px-1">{cards.length}</span>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-7 z-20 rounded-lg shadow-xl border border-gray-100 py-1 w-36 bg-white"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEditColumn(column); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Rename
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDeleteColumn(column); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-2 pb-1 flex flex-col gap-2 min-h-[4rem]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onEdit={onEditCard} onDelete={onDeleteCard} />
          ))}
          {cards.length === 0 && (
            <div className="flex-1 min-h-[3rem] rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
              <span className="text-xs text-slate-400">Drop cards here</span>
            </div>
          )}
        </SortableContext>
      </div>

      {/* Add card */}
      <div className="px-2 py-2">
        <button
          onClick={() => onAddCard(column.id)}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-black/5 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add a card
        </button>
      </div>
    </div>
  );
}

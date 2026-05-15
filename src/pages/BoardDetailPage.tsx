import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useBoard } from "../services/dashboard-service";
import { boardsService } from "../services/boards-service";
import { columnsService } from "../services/columns-service";
import { cardsService } from "../services/cards-service";
import { KanbanColumn } from "../components/KanbanColumn";
import { KanbanCardOverlay } from "../components/KanbanCard";
import { useToast } from "../components/Toaster";
import type { Card, Column } from "../services/dashboard-service";

interface CardForm {
  title: string;
  description: string;
  due_date: string;
  priority: number;
}

// const PRIORITY_LABELS: Record<number, string> = {
//   0: "None",
//   1: "Low",
//   2: "Medium",
//   3: "High",
// };

type LocalColumn = Column & { cards: Card[] };

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const boardId = Number(id);

  const {
    data: board,
    isLoading: isBoardLoading,
    isError: isBoardError,
  } = useBoard(boardId);

  const toast = useToast();

  useEffect(() => {
    if (board?.title) {
      document.title = `${board.title} — Kanbi`;
      return () => {
        document.title = "Kanbi";
      };
    }
  }, [board?.title]);

  const [localColumns, setLocalColumns] = useState<LocalColumn[]>([]);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeCardOriginalColId, setActiveCardOriginalColId] = useState<
    number | null
  >(null);

  // Board title editing
  const { mutate: updateBoard } = boardsService.useUpdate();
  const [editingBoardTitle, setEditingBoardTitle] = useState(false);
  const [boardTitleInput, setBoardTitleInput] = useState("");
  const boardTitleRef = useRef<HTMLInputElement>(null);

  // Column mutations
  const { mutate: createColumn } = columnsService.useCreate(boardId);
  const { mutate: updateColumn } = columnsService.useUpdate();
  const { mutate: deleteColumn } = columnsService.useDelete();

  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [columnTitle, setColumnTitle] = useState("");
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [confirmDeleteColumn, setConfirmDeleteColumn] = useState<Column | null>(
    null,
  );
  const [confirmDeleteCard, setConfirmDeleteCard] = useState<Card | null>(null);

  // Card mutations
  const { mutate: updateCard } = cardsService.useUpdate();
  const { mutate: deleteCard } = cardsService.useDelete();

  const [cardModal, setCardModal] = useState<{
    open: boolean;
    columnId: number | null;
    editingCard: Card | null;
  }>({ open: false, columnId: null, editingCard: null });

  const [cardForm, setCardForm] = useState<CardForm>({
    title: "",
    description: "",
    due_date: "",
    priority: 0,
  });

  const { mutate: createCard, isPending: isCreatingCard } =
    cardsService.useCreate(cardModal.columnId ?? 0);
  const { mutate: updateCardMutate, isPending: isUpdatingCard } =
    cardsService.useUpdate();

  useEffect(() => {
    // Sorting the columns and cards by position
    if (board) {
      setLocalColumns(
        [...(board.columns ?? [])]
          .sort((a, b) => a.position - b.position)
          .map((col) => ({
            ...col,
            cards: [...(col.cards ?? [])].sort(
              (a, b) => a.position - b.position,
            ),
          })),
      );
    }
  }, [board]);

  useEffect(() => {
    if (editingBoardTitle) boardTitleRef.current?.select();
  }, [editingBoardTitle]);

  // ─── DnD sensors ────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "card") {
      const card = event.active.data.current.card as Card;
      setActiveCard(card);
      const col = localColumns.find((c) =>
        c.cards.some((ca) => ca.id === card.id),
      );
      setActiveCardOriginalColId(col?.id ?? null);
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== "card") return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const isOverCard = over.data.current?.type === "card";
    const isOverColumn = over.data.current?.type === "column";

    setLocalColumns((cols) => {
      const activeColIdx = cols.findIndex((c) =>
        c.cards.some((card) => `card-${card.id}` === activeId),
      );
      if (activeColIdx === -1) return cols;

      if (isOverCard) {
        const overColIdx = cols.findIndex((c) =>
          c.cards.some((card) => `card-${card.id}` === overId),
        );
        if (overColIdx === -1) return cols;

        if (activeColIdx === overColIdx) {
          const col = cols[activeColIdx];
          const oldIdx = col.cards.findIndex(
            (c) => `card-${c.id}` === activeId,
          );
          const newIdx = col.cards.findIndex((c) => `card-${c.id}` === overId);
          return cols.map((c, i) =>
            i === activeColIdx
              ? { ...c, cards: arrayMove(col.cards, oldIdx, newIdx) }
              : c,
          );
        }

        const movingCard = cols[activeColIdx].cards.find(
          (c) => `card-${c.id}` === activeId,
        )!;
        const overCardIdx = cols[overColIdx].cards.findIndex(
          (c) => `card-${c.id}` === overId,
        );
        return cols.map((col, i) => {
          if (i === activeColIdx)
            return {
              ...col,
              cards: col.cards.filter((c) => `card-${c.id}` !== activeId),
            };
          if (i === overColIdx) {
            const newCards = [...col.cards];
            newCards.splice(overCardIdx, 0, movingCard);
            return { ...col, cards: newCards };
          }
          return col;
        });
      }

      if (isOverColumn) {
        const overColIdx = cols.findIndex((c) => `col-${c.id}` === overId);
        if (overColIdx === -1 || activeColIdx === overColIdx) return cols;
        const movingCard = cols[activeColIdx].cards.find(
          (c) => `card-${c.id}` === activeId,
        )!;
        return cols.map((col, i) => {
          if (i === activeColIdx)
            return {
              ...col,
              cards: col.cards.filter((c) => `card-${c.id}` !== activeId),
            };
          if (i === overColIdx)
            return { ...col, cards: [...col.cards, movingCard] };
          return col;
        });
      }

      return cols;
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (
      active.data.current?.type === "column" &&
      over.data.current?.type === "column"
    ) {
      const oldIdx = localColumns.findIndex((c) => `col-${c.id}` === activeId);
      const newIdx = localColumns.findIndex((c) => `col-${c.id}` === overId);
      if (oldIdx !== newIdx) {
        const reordered = arrayMove(localColumns, oldIdx, newIdx);
        setLocalColumns(reordered);
        reordered.forEach((col, idx) => {
          updateColumn(
            { id: col.id, title: col.title, position: idx + 1 },
            {
              onSuccess: () =>
                queryClient.invalidateQueries({ queryKey: ["board", boardId] }),
            },
          );
        });
      }
      return;
    }

    if (active.data.current?.type === "card") {
      const destCol = localColumns.find((c) =>
        c.cards.some((card) => `card-${card.id}` === activeId),
      );
      if (!destCol) return;

      const isCrossColumn =
        activeCardOriginalColId !== null &&
        activeCardOriginalColId !== destCol.id;

      destCol.cards.forEach((card, idx) => {
        updateCard(
          { ...card, column_id: destCol.id, position: idx + 1 },
          {
            onSuccess: () =>
              queryClient.invalidateQueries({ queryKey: ["board", boardId] }),
          },
        );
      });

      if (isCrossColumn) {
        const srcCol = localColumns.find(
          (c) => c.id === activeCardOriginalColId,
        );
        srcCol?.cards.forEach((card, idx) => {
          updateCard({ ...card, position: idx + 1 });
        });
      }

      setActiveCardOriginalColId(null);
    }
  }

  // ─── Board title handlers ────────────────────────────────────────────────

  function startEditingBoardTitle() {
    setBoardTitleInput(board?.title ?? "");
    setEditingBoardTitle(true);
  }

  function saveBoardTitle() {
    const trimmed = boardTitleInput.trim();
    if (trimmed && trimmed !== board?.title) {
      updateBoard(
        { id: boardId, title: trimmed },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["board", boardId] });
            toast("Board renamed");
          },
          onError: () => toast("Failed to rename board", "error"),
        },
      );
    }
    setEditingBoardTitle(false);
  }

  // ─── Column handlers ─────────────────────────────────────────────────────

  function handleAddColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    createColumn(
      { title: newColumnTitle.trim(), position: localColumns.length + 1 },
      {
        onSuccess: () => {
          setNewColumnTitle("");
          setShowAddColumn(false);
          queryClient.invalidateQueries({ queryKey: ["board", boardId] });
          toast("List added");
        },
        onError: () => toast("Failed to add list", "error"),
      },
    );
  }

  function handleSaveColumnEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!columnTitle.trim() || !editingColumn) return;
    updateColumn(
      {
        id: editingColumn.id,
        title: columnTitle.trim(),
        position: editingColumn.position,
      },
      {
        onSuccess: () => {
          setEditingColumn(null);
          queryClient.invalidateQueries({ queryKey: ["board", boardId] });
          toast("List renamed");
        },
        onError: () => toast("Failed to rename list", "error"),
      },
    );
  }

  function handleDeleteColumn(id: number) {
    deleteColumn(id, {
      onSuccess: () => {
        setConfirmDeleteColumn(null);
        queryClient.invalidateQueries({ queryKey: ["board", boardId] });
        toast("List deleted");
      },
      onError: () => toast("Failed to delete list", "error"),
    });
  }

  // ─── Card handlers ───────────────────────────────────────────────────────

  function openAddCard(columnId: number) {
    setCardModal({ open: true, columnId, editingCard: null });
    setCardForm({ title: "", description: "", due_date: "", priority: 0 });
  }

  function openEditCard(card: Card) {
    setCardModal({ open: true, columnId: card.column_id, editingCard: card });
    setCardForm({
      title: card.title,
      description: card.description ?? "",
      due_date: card.due_date ?? "",
      priority: card.priority,
    });
  }

  function closeCardModal() {
    setCardModal({ open: false, columnId: null, editingCard: null });
  }

  function handleCardFormChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;
    setCardForm((prev) => ({
      ...prev,
      [name]: name === "priority" ? Number(value) : value,
    }));
  }

  function handleSubmitCard(e: React.FormEvent) {
    e.preventDefault();
    if (!cardForm.title.trim()) return;
    const basePayload = {
      ...cardForm,
      title: cardForm.title.trim(),
      due_date: cardForm.due_date || undefined,
    };

    if (cardModal.editingCard) {
      updateCardMutate(
        { ...cardModal.editingCard, ...basePayload },
        {
          onSuccess: () => {
            closeCardModal();
            queryClient.invalidateQueries({ queryKey: ["board", boardId] });
            toast("Card updated");
          },
          onError: () => toast("Failed to update card", "error"),
        },
      );
    } else {
      const col = localColumns.find((c) => c.id === cardModal.columnId);
      createCard(
        { ...basePayload, position: (col?.cards.length ?? 0) + 1 },
        {
          onSuccess: () => {
            closeCardModal();
            queryClient.invalidateQueries({ queryKey: ["board", boardId] });
            toast("Card added");
          },
          onError: () => toast("Failed to add card", "error"),
        },
      );
    }
  }

  function handleDeleteCard(id: number) {
    deleteCard(id, {
      onSuccess: () => {
        setConfirmDeleteCard(null);
        queryClient.invalidateQueries({ queryKey: ["board", boardId] });
        toast("Card deleted");
      },
      onError: () => toast("Failed to delete card", "error"),
    });
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  const columnIds = useMemo(
    () => localColumns.map((c) => `col-${c.id}`),
    [localColumns],
  );

  if (isBoardLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0052cc 0%, #1d6fa4 50%, #0747a6 100%)" }}>
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-8 h-8 text-white/60 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span className="text-white/60 text-sm">Loading board…</span>
        </div>
      </div>
    );
  }

  if (isBoardError) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0052cc 0%, #1d6fa4 50%, #0747a6 100%)" }}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-white/60 text-sm">Failed to load this board.</p>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-white/60 hover:text-white underline"
          >
            Back to boards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "linear-gradient(135deg, #0052cc 0%, #1d6fa4 50%, #0747a6 100%)" }}>
      {/* Header */}
      <header className="shrink-0 px-6 py-3 flex items-center gap-3 bg-white border-b border-gray-200">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors text-sm px-2 py-1 rounded hover:bg-gray-100"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Boards
        </button>

        <div className="w-px h-4 bg-gray-200" />

        {editingBoardTitle ? (
          <input
            ref={boardTitleRef}
            value={boardTitleInput}
            onChange={(e) => setBoardTitleInput(e.target.value)}
            onBlur={saveBoardTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveBoardTitle();
              if (e.key === "Escape") setEditingBoardTitle(false);
            }}
            className="border border-blue-400 text-gray-900 font-bold text-sm rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-100 w-48 bg-white"
          />
        ) : (
          <button
            onClick={startEditingBoardTitle}
            className="text-gray-900 font-bold text-sm px-2 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            {board?.title ?? "…"}
          </button>
        )}

        <div className="ml-auto">
          <button
            onClick={() => setShowAddColumn((v) => !v)}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add list
          </button>
        </div>
      </header>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-3 py-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-3 h-full items-start">
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              {localColumns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  cards={col.cards}
                  onEditColumn={(c) => {
                    setEditingColumn(c);
                    setColumnTitle(c.title);
                  }}
                  onDeleteColumn={(col) => setConfirmDeleteColumn(col)}
                  onAddCard={openAddCard}
                  onEditCard={openEditCard}
                  onDeleteCard={(card) => setConfirmDeleteCard(card)}
                />
              ))}
            </SortableContext>

            {showAddColumn ? (
              <form
                onSubmit={handleAddColumn}
                className="w-72 shrink-0 rounded-xl p-2 flex flex-col gap-2 bg-white border border-gray-200 shadow-sm"
              >
                <input
                  autoFocus
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="Enter list name…"
                  onKeyDown={(e) =>
                    e.key === "Escape" && setShowAddColumn(false)
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition bg-white"
                />
                <div className="flex gap-2 items-center">
                  <button
                    type="submit"
                    disabled={!newColumnTitle.trim()}
                    className="rounded px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Add list
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddColumn(false)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddColumn(true)}
                className="w-72 shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/80 hover:text-white bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {localColumns.length > 0
                  ? "Add another list"
                  : "Add your first list"}
              </button>
            )}
          </div>

          <DragOverlay>
            {activeCard && <KanbanCardOverlay card={activeCard} />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Confirm delete column modal */}
      {confirmDeleteColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-gray-900 font-semibold mb-3">Delete list?</h2>
            <p className="text-sm text-gray-500 mb-5 mt-4">
              <span className="font-medium text-gray-700 mb-6">
                "{confirmDeleteColumn.title}"
              </span>{" "}
              and all its cards will be permanently deleted.
            </p>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setConfirmDeleteColumn(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteColumn(confirmDeleteColumn.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete card modal */}
      {confirmDeleteCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-gray-900 font-semibold mb-3">Delete card?</h2>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-medium text-gray-700">
                "{confirmDeleteCard.title}"
              </span>{" "}
              will be permanently deleted.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setConfirmDeleteCard(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCard(confirmDeleteCard.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit column modal */}
      {editingColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleSaveColumnEdit}
            className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-sm"
          >
            <h2 className="text-gray-900 font-semibold mb-4">Rename list</h2>
            <input
              autoFocus
              value={columnTitle}
              onChange={(e) => setColumnTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setEditingColumn(null)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingColumn(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Card modal */}
      {cardModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCardModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-gray-900">
                  {cardModal.editingCard ? "Edit card" : "Add card"}
                </h2>
              </div>
              <button
                onClick={closeCardModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitCard} className="flex flex-col">
              <div className="px-6 py-4 flex flex-col gap-5">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                        d="M4 6h16M4 10h16M4 14h8"
                      />
                    </svg>
                    Title
                  </label>
                  <input
                    name="title"
                    value={cardForm.title}
                    onChange={handleCardFormChange}
                    required
                    autoFocus
                    placeholder="What needs to be done?"
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                        d="M4 6h16M4 10h16M4 14h16M4 18h10"
                      />
                    </svg>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={cardForm.description}
                    onChange={handleCardFormChange}
                    rows={3}
                    placeholder="Add a more detailed description…"
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition resize-none"
                  />
                </div>

                {/* Due date + Priority row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Due date
                    </label>
                    <input
                      name="due_date"
                      type="date"
                      value={cardForm.due_date}
                      onChange={handleCardFormChange}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                          d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H9.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                        />
                      </svg>
                      Priority
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {([0, 1, 2, 3] as const).map((p) => {
                        const cfg: Record<
                          number,
                          { label: string; active: string; inactive: string }
                        > = {
                          0: {
                            label: "None",
                            active:
                              "bg-gray-200 text-gray-700 ring-2 ring-gray-400",
                            inactive:
                              "bg-gray-100 text-gray-500 hover:bg-gray-200",
                          },
                          1: {
                            label: "Low",
                            active:
                              "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400",
                            inactive:
                              "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600",
                          },
                          2: {
                            label: "Medium",
                            active:
                              "bg-amber-100 text-amber-700 ring-2 ring-amber-400",
                            inactive:
                              "bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600",
                          },
                          3: {
                            label: "High",
                            active:
                              "bg-rose-100 text-rose-700 ring-2 ring-rose-400",
                            inactive:
                              "bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-600",
                          },
                        };
                        const c = cfg[p];
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() =>
                              setCardForm((prev) => ({ ...prev, priority: p }))
                            }
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${cardForm.priority === p ? c.active : c.inactive}`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCardModal}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isCreatingCard || isUpdatingCard || !cardForm.title.trim()
                  }
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                >
                  {isCreatingCard || isUpdatingCard
                    ? "Saving…"
                    : cardModal.editingCard
                      ? "Save changes"
                      : "Add card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

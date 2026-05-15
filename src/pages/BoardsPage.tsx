import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLogout, getTokenPayload } from "../services/auth-service";
import { boardsService } from "../services/boards-service";
import { useDashboard } from "../services/dashboard-service";
import type { Boards } from "../services/dashboard-service";

const BOARD_COLORS = [
  "#0052cc",
  "#0065ff",
  "#00875a",
  "#ff5630",
  "#ff8b00",
  "#6554c0",
  "#00b8d9",
  "#36b37e",
  "#403294",
  "#de350b",
];

export default function BoardsPage() {
  const navigate = useNavigate();
  const logout = useLogout();
  const user = getTokenPayload();
  const queryClient = useQueryClient();
  const { data: boards, isLoading, isError } = useDashboard();

  const { mutate: createBoard, isPending: isCreating } =
    boardsService.useCreate();
  const { mutate: deleteBoard } = boardsService.useDelete();
  const { mutate: updateBoard } = boardsService.useUpdate();

  const [newTitle, setNewTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [renamingBoard, setRenamingBoard] = useState<Boards | null>(null);
  const [renameInput, setRenameInput] = useState("");

  function handleAddBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createBoard(
      { title: newTitle.trim() },
      {
        onSuccess: () => {
          setNewTitle("");
          setShowForm(false);
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
      },
    );
  }

  function handleRenameBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!renamingBoard || !renameInput.trim()) return;
    updateBoard(
      { id: renamingBoard.id, title: renameInput.trim() },
      {
        onSuccess: () => {
          setRenamingBoard(null);
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
      },
    );
  }

  function handleDelete() {
    if (!confirmDelete) return;
    deleteBoard(confirmDelete.id, {
      onSuccess: () => {
        setConfirmDelete(null);
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      },
    });
  }

  const initials = user?.email ? user.email[0].toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="4" width="7" height="14" rx="1.5" />
              <rect x="14" y="4" width="7" height="14" rx="1.5" />
            </svg>
          </div>
          <span className="text-gray-900 font-bold text-lg tracking-tight">
            Kanbi
          </span>
        </div>
        <div className="flex items-center gap-3">
          {user?.email && (
            <span className="hidden sm:block text-sm text-gray-500">
              {user.email}
            </span>
          )}
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            {initials}
          </div>
          <button
            onClick={() => setConfirmSignOut(true)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-gray-500 font-semibold text-sm uppercase tracking-wider">
            Your boards
          </h2>
        </div>

        {isError && (
          <p className="text-red-500 text-sm mb-4">Failed to load boards.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {isLoading &&
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl animate-pulse bg-gray-200"
              />
            ))}

          {boards?.map((board, i) => (
            <div
              key={board.id}
              onClick={() => navigate(`/boards/${board.id}`)}
              className="group relative h-24 rounded-xl cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20"
              style={{ background: BOARD_COLORS[i % BOARD_COLORS.length] }}
            >
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative p-3 h-full flex flex-col justify-between">
                <h3 className="text-white font-bold text-base leading-snug line-clamp-2">
                  {board.title}
                </h3>
                <div className="flex gap-1 self-end opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingBoard(board);
                      setRenameInput(board.title);
                    }}
                    className="text-white/80 hover:text-white text-xs px-1.5 py-0.5 rounded bg-black/30 hover:bg-black/50 transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete({ id: board.id, title: board.title });
                    }}
                    className="text-white/80 hover:text-white text-xs px-1.5 py-0.5 rounded bg-black/30 hover:bg-black/50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!isLoading &&
            (showForm ? (
              <form
                onSubmit={handleAddBoard}
                className="rounded-xl p-2 flex flex-col gap-2 bg-white border border-gray-200"
              >
                <input
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setShowForm(false)}
                  placeholder="Board title"
                  className="flex-1 rounded-lg px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition w-full border border-gray-200 focus:border-blue-400 bg-gray-50"
                />
                <div className="flex gap-1">
                  <button
                    type="submit"
                    disabled={isCreating || !newTitle.trim()}
                    className="flex-1 rounded-lg text-xs font-semibold text-white py-1 disabled:opacity-50 transition bg-blue-600 hover:bg-blue-700"
                  >
                    {isCreating ? "Creating…" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-2 rounded-lg text-gray-400 hover:text-gray-600 text-xs hover:bg-gray-100 transition"
                  >
                    ✕
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="h-24 rounded-xl flex items-center justify-center text-sm text-gray-400 hover:text-gray-600 transition-all hover:bg-gray-100 cursor-pointer border border-gray-200 bg-white"
              >
                + Create new board
              </button>
            ))}

          {boards?.length === 0 && !isLoading && !showForm && (
            <div className="col-span-full flex flex-col items-center py-16 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-gray-700 font-semibold text-sm">
                  No boards yet
                </p>
                <p className="text-gray-400 text-sm mt-0.5">
                  Create your first board to start organizing.
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                Create a board
              </button>
            </div>
          )}
        </div>
      </main>

      {confirmSignOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-gray-900 font-semibold mb-1">Sign out?</h2>
            <p className="text-sm text-gray-500 mb-5">
              You'll need to sign in again to access your boards.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmSignOut(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {renamingBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleRenameBoard}
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
          >
            <h2 className="text-gray-900 font-semibold mb-4">Rename board</h2>
            <input
              autoFocus
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setRenamingBoard(null)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition mb-4 bg-gray-50"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingBoard(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!renameInput.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-gray-900 font-semibold mb-1">Delete board?</h2>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-medium text-gray-700">
                "{confirmDelete.title}"
              </span>{" "}
              and all its lists and cards will be permanently deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  AddBoard,
  DeleteBoard,
  EditBoard,
  fetchAllMembers,
  fetchInitialBoards,
  UpdateBoardFields,
} from "@/services/kanbanApi";
import CollapsedSidebar from "@/components/kanban/CollapsedSidebar";
import AddBoardModal from "@/components/kanban/AddBoardModal";
import { EyeIcon, TrashIcon } from "@heroicons/react/24/outline";
import Select from "react-select";
import { toast } from "react-toastify";

type Role = "admin" | "employee";
type Member = { id: number; name: string };

export default function BoardList() {
  const router = useRouter();
  const userGuid = (router.query.userGuid as string) || "";
  const role: Role = userGuid === "ADMIN-GUID" ? "admin" : "employee";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  // inline edit state: which row/field is being edited
  const [editCell, setEditCell] = useState<{ id: number; field: "title" | "description" | "members" | "progress" } | null>(null);
  const [membersOptions, setMembersOptions] = useState<Member[]>([]);

  const fkpoid = 1001; // fake project/org id

  async function load() {
    try {
      setLoading(true);
      const res = await fetchInitialBoards(fkpoid);
      setRows(res.data);
      const m = await fetchAllMembers();
      setMembersOptions(m.data);
    } catch {
      toast.error("Failed to load boards");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional: filter by project when the user clicks in the sidebar
  const filteredRows = useMemo(() => {
    if (!projectFilter) return rows;
    return rows.filter((r) => r.title === projectFilter);
  }, [rows, projectFilter]);

  async function createBoard({
    projectName,
    description,
    memberIds,
  }: {
    projectName: string;
    description?: string;
    memberIds: number[];
  }) {
    try {
      const res = await AddBoard(projectName, fkpoid, 205, "205-Osama Ahmed", {
        description,
        memberIds,
      });
      setRows((prev) => [res.data, ...prev]);
      toast.success("Board created");
    } catch {
      toast.error("Failed to create board");
    }
  }

  async function renameBoardPrompt(row: any) {
    // kept for fallback via prompt (not used in inline now)
    if (role !== "admin") return;
    const title = prompt("Rename project", row.title);
    if (!title) return;
    try {
      await EditBoard(title, row.boardid ?? null, "Admin");
      setRows((prev) =>
        prev.map((r) => (r.boardid === row.boardid ? { ...r, title } : r))
      );
      toast.success("Board renamed");
    } catch {
      toast.error("Rename failed");
    }
  }

  async function removeBoard(row: any) {
    if (role !== "admin") return;
    const ok = confirm(`Delete board "${row.title}"?`);
    if (!ok) return;
    try {
      await DeleteBoard(row.boardid);
      setRows((prev) => prev.filter((r) => r.boardid !== row.boardid));
      toast.success("Board deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  // helpers for inline save
  function updateRowLocal(boardid: number, patch: any) {
    setRows((prev) => prev.map((r) => (r.boardid === boardid ? { ...r, ...patch } : r)));
  }

  async function saveTitle(boardid: number, value: string) {
    try {
      updateRowLocal(boardid, { title: value });
      await UpdateBoardFields(boardid, { title: value });
      toast.success("Project updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setEditCell(null);
    }
  }

  async function saveDescription(boardid: number, value: string) {
    try {
      updateRowLocal(boardid, { description: value });
      await UpdateBoardFields(boardid, { description: value });
      toast.success("Description updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setEditCell(null);
    }
  }

  async function saveMembers(boardid: number, memberIds: number[]) {
    try {
      const selected = memberIds
        .map((id) => membersOptions.find((m) => m.id === id))
        .filter(Boolean) as Member[];
      updateRowLocal(boardid, { members: selected });
      await UpdateBoardFields(boardid, { ...( { memberIds } as any) });
      toast.success("Members updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setEditCell(null);
    }
  }

  async function saveProgress(boardid: number, progress: number) {
    try {
      updateRowLocal(boardid, { progress });
      await UpdateBoardFields(boardid, { progress });
      toast.success("Status updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setEditCell(null);
    }
  }

  const isAdmin = role === "admin";

  return (
    <div className="flex">
      {/* Sidebar (collapsed by default) */}
      <CollapsedSidebar onSelectProject={setProjectFilter} />

      {/* Main */}
      <div className="grow p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin Task Board</h1>
          <button
            onClick={() => setOpenAdd(true)}
            disabled={!isAdmin}
            className={`rounded-md border px-4 py-2 text-sm hover:bg-gray-50 ${
              !isAdmin ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            + Add Board
          </button>
        </div>

        {/* Filters stub (left icons) */}
        <div className="mb-3 flex items-center gap-3">
          <div className="h-6 w-6 rounded-full border" title="Search" />
          <div className="h-6 w-8 rounded border" title="Filters" />
          <div className="h-6 w-8 rounded border" title="Filters" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
                <th>#id</th>
                <th>project</th>
                <th>description</th>
                <th>members</th>
                <th>Status</th>
                <th>createdAt</th>
                <th>added by</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center">
                    loading…
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center">
                    No boards
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  const editing = (field: typeof editCell extends null ? never : any) =>
                    editCell && editCell.id === r.boardid && editCell.field === field;

                  return (
                    <tr key={r.fkboardid} className="border-t">
                      <td className="px-3 py-2">{r.boardid}</td>

                      {/* project / title */}
                      <td
                        className="px-3 py-2"
                        onDoubleClick={() => isAdmin && setEditCell({ id: r.boardid, field: "title" })}
                      >
                        {editing("title") ? (
                          <input
                            autoFocus
                            defaultValue={r.title}
                            className="w-full rounded border px-2 py-1 outline-none focus:ring"
                            onBlur={(e) => saveTitle(r.boardid, e.target.value.trim() || r.title)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              if (e.key === "Escape") setEditCell(null);
                            }}
                          />
                        ) : (
                          <span className={isAdmin ? "cursor-text" : ""} title={isAdmin ? "Double-click to edit" : ""}>
                            {r.title}
                          </span>
                        )}
                      </td>

                      {/* description */}
                      <td
                        className="px-3 py-2"
                        onDoubleClick={() => isAdmin && setEditCell({ id: r.boardid, field: "description" })}
                      >
                        {editing("description") ? (
                          <textarea
                            autoFocus
                            defaultValue={r.description || ""}
                            className="w-full rounded border px-2 py-1 outline-none focus:ring"
                            rows={2}
                            onBlur={(e) => saveDescription(r.boardid, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                (e.target as HTMLTextAreaElement).blur();
                              }
                              if (e.key === "Escape") setEditCell(null);
                            }}
                          />
                        ) : (
                          <span className={isAdmin ? "cursor-text" : ""} title={isAdmin ? "Double-click to edit" : ""}>
                            {r.description || "-"}
                          </span>
                        )}
                      </td>

                      {/* members */}
                      <td
                        className="px-3 py-2"
                        onDoubleClick={() => isAdmin && setEditCell({ id: r.boardid, field: "members" })}
                      >
                        {editing("members") ? (
                          <Select
                            autoFocus
                            isMulti
                            className="text-sm"
                            options={membersOptions.map((m) => ({ value: m.id, label: m.name }))}
                            defaultValue={(r.members || []).map((m: Member) => ({
                              value: m.id,
                              label: m.name,
                            }))}
                            onChange={(opts) =>
                              saveMembers(
                                r.boardid,
                                (opts || []).map((o: any) => Number(o.value))
                              )
                            }
                            onBlur={() => setEditCell(null)}
                          />
                        ) : (
                          <div className="flex -space-x-2">
                            {(r.members || [])
                              .slice(0, 5)
                              .map((m: Member, i: number) => (
                                <div
                                  key={i}
                                  className="flex h-6 w-6 items-center justify-center rounded-full border bg-gray-100 text-[10px] font-medium"
                                  title={m.name}
                                >
                                  {m.name?.slice(0, 2)}
                                </div>
                              ))}
                          </div>
                        )}
                      </td>

                      {/* status / progress */}
                      <td
                        className="px-3 py-2"
                        onDoubleClick={() => isAdmin && setEditCell({ id: r.boardid, field: "progress" })}
                      >
                        {editing("progress") ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              defaultValue={r.progress ?? 0}
                              onChange={(e) => updateRowLocal(r.boardid, { progress: Number(e.target.value) })}
                              onMouseUp={(e) => saveProgress(r.boardid, Number((e.target as HTMLInputElement).value))}
                              className="w-32"
                            />
                            <span className="w-10 text-xs text-gray-600">{r.progress ?? 0}%</span>
                          </div>
                        ) : (
                          <div className="h-3 w-28 rounded bg-gray-200" title={isAdmin ? "Double-click to edit" : ""}>
                            <div
                              className={`h-3 rounded ${
                                (r.progress ?? 0) < 30
                                  ? "bg-red-500"
                                  : (r.progress ?? 0) < 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${r.progress ?? 0}%` }}
                            />
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-2">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">{r.addedby}</td>

                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded border px-2 py-1 text-xs"
                            onClick={() =>
                              router.push(
                                `/kanbanList/${r.fkboardid}?userGuid=${userGuid || "ADMIN-GUID"}`
                              )
                            }
                            title="view"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => removeBoard(r)}
                            disabled={!isAdmin}
                            className={`rounded border px-2 py-1 text-xs ${
                              !isAdmin ? "cursor-not-allowed opacity-50" : ""
                            }`}
                            title="delete"
                          >
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-center text-xs text-gray-500">
          {/* Placeholder note, matches Excalidraw */}
          sum calculations of the tasks of all the lists in single board
        </div>
      </div>

      {/* Add Board Modal */}
      <AddBoardModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={createBoard}
      />
    </div>
  );
}

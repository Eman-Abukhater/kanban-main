import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  AddBoard,
  DeleteBoard,
  EditBoard,
  fetchInitialBoards,
} from "@/services/kanbanApi";
import CollapsedSidebar from "@/components/kanban/CollapsedSidebar";
import AddBoardModal from "@/components/kanban/AddBoardModal";
import { EyeIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

type Role = "admin" | "employee";

export default function BoardList() {
  const router = useRouter();
  const userGuid = (router.query.userGuid as string) || "";
  const role: Role = userGuid === "ADMIN-GUID" ? "admin" : "employee";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  const fkpoid = 1001; // fake project/org id

  async function load() {
    try {
      setLoading(true);
      const res = await fetchInitialBoards(fkpoid);
      setRows(res.data);
    } catch (e) {
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

  // FIXED: match AddBoardModal's onSubmit shape
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

  async function renameBoard(row: any) {
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
            disabled={role !== "admin"}
            className={`rounded-md border px-4 py-2 text-sm hover:bg-gray-50 ${
              role !== "admin" ? "cursor-not-allowed opacity-50" : ""
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
                filteredRows.map((r) => (
                  <tr key={r.fkboardid} className="border-t">
                    <td className="px-3 py-2">{r.boardid}</td>

                    {/* title (click to rename if admin) */}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => renameBoard(r)}
                        disabled={role !== "admin"}
                        className={`underline-offset-2 hover:underline ${
                          role !== "admin"
                            ? "cursor-default hover:no-underline"
                            : ""
                        }`}
                        title={role === "admin" ? "Rename" : ""}
                      >
                        {r.title}
                      </button>
                    </td>

                    <td className="px-3 py-2">{r.description || "-"}</td>

                    <td className="px-3 py-2">
                      <div className="flex -space-x-2">
                        {(r.members || [])
                          .slice(0, 5)
                          .map((m: any, i: number) => (
                            <div
                              key={i}
                              className="flex h-6 w-6 items-center justify-center rounded-full border bg-gray-100 text-[10px] font-medium"
                              title={m.name}
                            >
                              {m.name?.slice(0, 2)}
                            </div>
                          ))}
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      <div className="h-3 w-28 rounded bg-gray-200">
                        <div
                          className="h-3 rounded bg-green-500"
                          style={{ width: `${r.progress ?? 0}%` }}
                          title={`${r.progress ?? 0}%`}
                        />
                      </div>
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
                              `/kanbanList/${r.fkboardid}?userGuid=${
                                userGuid || "ADMIN-GUID"
                              }`
                            )
                          }
                          title="view"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => removeBoard(r)}
                          disabled={role !== "admin"}
                          className={`rounded border px-2 py-1 text-xs ${
                            role !== "admin"
                              ? "cursor-not-allowed opacity-50"
                              : ""
                          }`}
                          title="delete"
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-center text-xs text-gray-500">
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

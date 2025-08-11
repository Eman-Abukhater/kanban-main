import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { AddBoard, EditBoard, fetchInitialBoards } from "@/services/kanbanApi";

type Role = "admin" | "employee";

export default function BoardList() {
  const router = useRouter();
  const userGuid = (router.query.userGuid as string) || "";
  const isAdmin: Role = userGuid === "ADMIN-GUID" ? "admin" : "employee";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const fkpoid = 1001; // fake project/org id for now

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchInitialBoards(fkpoid);
      setRows(res.data);
      setLoading(false);
    })();
  }, []);

  async function addBoard() {
    if (isAdmin !== "admin") return;
    const title = prompt("Board title?");
    if (!title) return;
    const res = await AddBoard(title, fkpoid, 205, "205-Osama Ahmed");
    setRows((prev) => [res.data, ...prev]);
  }

  async function renameBoard(row: any) {
    if (isAdmin !== "admin") return;
    const title = prompt("Rename project", row.title);
    if (!title) return;
    await EditBoard(title, row.boardid ?? null, "Admin");
    setRows((prev) =>
      prev.map((r) => (r.boardid === row.boardid ? { ...r, title } : r))
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Task Board</h1>
        <button
          onClick={addBoard}
          disabled={isAdmin !== "admin"}
          className={`rounded-md border px-4 py-2 text-sm hover:bg-gray-50 ${
            isAdmin !== "admin" ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          + Add Board
        </button>
      </div>

      {/* Filters stub to match mock */}
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
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center">
                  No boards
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.fkboardid} className="border-t">
                  <td className="px-3 py-2">{r.boardid}</td>

                  {/* title (inline edit for admin) */}
                  <td className="px-3 py-2">
                    <button
                      onClick={() => renameBoard(r)}
                      disabled={isAdmin !== "admin"}
                      className={`underline-offset-2 hover:underline ${
                        isAdmin !== "admin" ? "cursor-default hover:no-underline" : ""
                      }`}
                      title={isAdmin === "admin" ? "Rename" : ""}
                    >
                      {r.title}
                    </button>
                  </td>

                  <td className="px-3 py-2">{r.description || "-"}</td>

                  {/* members as small circles */}
                  <td className="px-3 py-2">
                    <div className="flex -space-x-2">
                      {(r.members || []).slice(0, 5).map((m: any, i: number) => (
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

                  {/* status progress bar */}
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

                  {/* actions: view, (delete later) */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() =>
                          router.push(
                            `/kanbanList/${r.fkboardid}?userGuid=${userGuid || "ADMIN-GUID"}`
                          )
                        }
                      >
                        view
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* little note (matches your mock “sum calculations…”) */}
      <div className="mt-3 text-center text-xs text-gray-500">
        sum calculations of the tasks of all the lists in single board
      </div>
    </div>
  );
}

// src/pages/kanbanList/[id].tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  fetchKanbanList,
  AddKanbanList,
  AddCard,
  useOnDragEndCard,
  useOnDragEndList,
  EditCard,
  AddTask,
  SubmitTask,
  DeleteTask,
  fetchAllMembers,
  getShareLink as getShareLinkApi,
  closeBoard as closeBoardApi,
} from "@/services/kanbanApi";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { toast } from "react-toastify";

// ==== Types ====
type Role = "admin" | "employee";

type Task = {
  task_id: string;
  task_name: string;
  status: "todo" | "done";
  assigneeId?: number;
};

type Card = {
  card_id: string;
  list_id: string;
  title: string;
  description?: string;
  position: number;
  imageUrl?: string | null;
  tasks?: Task[];
};

type List = {
  list_id: string;
  list_name: string;
  position: number;
  cards: Card[];
};

export default function KanbanPage() {
  const router = useRouter();
  const { id, userGuid, view } = router.query as {
    id: string;
    userGuid?: string;
    view?: string;
  };

  const fkboardid = id; // GUID from BoardList "View" button
  const role: Role = userGuid === "ADMIN-GUID" ? "admin" : "employee";
  const readOnly = view === "public";
  const isAdmin = role === "admin" && !readOnly;

  // Demo current user id (replace with real auth when ready)
  const currentUserId = isAdmin ? 205 : 301;

  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<List[]>([]);
  const [boardTitle, setBoardTitle] = useState<string>("Kanban");
  const [progress, setProgress] = useState<number>(0);
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);

  // per-list infinite scroll: list_id -> visible count
  const [visibleMap, setVisibleMap] = useState<Record<string, number>>({});

  // permissions
  const canEditCard = (c: Card) =>
    isAdmin ||
    (c.tasks && c.tasks.some((t) => t.assigneeId === currentUserId));
  const canWrite = !readOnly && (isAdmin || role === "employee");

  function resetVisible(ls: List[]) {
    const v: Record<string, number> = {};
    ls.forEach((l) => (v[l.list_id] = 10)); // 10 initially
    setVisibleMap(v);
  }
  function showMore(list_id: string, total: number) {
    setVisibleMap((prev) => {
      const cur = prev[list_id] ?? 10;
      const next = Math.min(cur + 10, total);
      return cur === next ? prev : { ...prev, [list_id]: next };
    });
  }

  function computeProgressFromLists(ls: List[]) {
    const allCards = ls.flatMap((l) => l.cards);
    const total =
      allCards.length +
      allCards.reduce((acc, c) => acc + (c.tasks?.length || 0), 0);
    const doneCards = allCards.filter((c) =>
      (c.tasks || []).length > 0
        ? (c.tasks || []).every((t) => t.status === "done")
        : false
    ).length;
    const doneSubs = allCards.reduce(
      (acc, c) => acc + (c.tasks || []).filter((t) => t.status === "done").length,
      0
    );
    const done = doneCards + doneSubs;
    return total ? Math.round((done / total) * 100) : 0;
  }

  // Normalize service response (real or fake) to our List/Card shape
  function normalize(res: any): { lists: List[]; title: string; progress: number } {
    const rawLists = Array.isArray(res) ? res : res?.lists || [];
    const lists: List[] = rawLists
      .map((l: any) => {
        const list_id = String(l.list_id ?? l.id);
        const list_name = String(l.list_name ?? l.title ?? "");
        const position = Number(l.position ?? l.seq ?? 0);
        const rawCards = l.cards ?? l.kanbanCards ?? [];
        const cards: Card[] = rawCards.map((c: any) => ({
          card_id: String(c.card_id ?? c.id),
          list_id,
          title: String(c.title ?? ""),
          description: c.description ?? c.desc ?? "",
          position: Number(c.position ?? c.seq ?? 0),
          imageUrl: c.imageUrl ?? c.image ?? c.imageDataUrl ?? null,
          tasks: Array.isArray(c.tasks)
            ? c.tasks
            : Array.isArray(c.subtasks)
            ? c.subtasks.map((s: any) => ({
                task_id: String(s.id),
                task_name: String(s.title ?? ""),
                status: s.completed ? "done" : "todo",
                assigneeId:
                  typeof s.assigneeId === "number" ? s.assigneeId : undefined,
              }))
            : [],
        }));
        return { list_id, list_name, position, cards };
      })
      .sort((a, b) => a.position - b.position)
      .map((l) => ({
        ...l,
        cards: l.cards.sort((a, b) => a.position - b.position),
      }));

    const title = String(res?.board?.title ?? "Kanban");
    // prefer API progress, else compute here
    const prog =
      typeof res?.progress === "number"
        ? res.progress
        : computeProgressFromLists(lists);

    return { lists, title, progress: prog };
  }

  async function load() {
    if (!fkboardid) return;
    try {
      setLoading(true);
      const res = await fetchKanbanList(fkboardid);
      const norm = normalize(res);
      setLists(norm.lists);
      setBoardTitle(norm.title || "Kanban");
      setProgress(norm.progress ?? 0);
      resetVisible(norm.lists);

      // load members for assignee labels
      const m = await fetchAllMembers().catch(() => null);
      if (m?.data) setMembers(m.data);
    } catch {
      toast.error("Failed to load kanban");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fkboardid]);

  // === Add list (admin only, max 6) ===
  async function addList() {
    if (!isAdmin) return;
    if (lists.length >= 6) {
      toast.error("Max lists is 6");
      return;
    }
    const name = prompt("New list name", "New list");
    if (!name) return;
    try {
      const res = await AddKanbanList(
        name,
        fkboardid!,
        "205-Osama Ahmed",
        205,
        1001
      );
      // support both fake/real shapes
      const newList = {
        list_id: String(res?.data?.list_id ?? res?.data?.id),
        list_name: name,
        position: Number(res?.data?.position ?? res?.data?.seq ?? lists.length),
        cards: [] as Card[],
      };
      const next = [...lists, newList].sort((a, b) => a.position - b.position);
      setLists(next);
      setVisibleMap((m) => ({ ...m, [newList.list_id]: 10 }));
      toast.success("List added");
    } catch {
      toast.error("Failed to add list");
    }
  }

  // === Add card (admin only) ===
  async function addCard(list_id: string) {
    if (!isAdmin) return;
    const title = prompt("Card title", "New card");
    if (!title) return;
    try {
      const listNum = Number(list_id);
      const payloadListId = Number.isFinite(listNum)
        ? listNum
        : ((list_id as unknown) as any);

      const res = await AddCard(
        title,
        payloadListId,
        "205-Osama Ahmed",
        205,
        fkboardid as any,
        1001 as any
      );

      const newCard: Card = {
        card_id: String(res?.data?.card_id ?? res?.data?.id),
        list_id,
        title,
        description: "",
        position: Number(res?.data?.position ?? res?.data?.seq ?? 0),
        imageUrl: null,
        tasks: [],
      };

      setLists((prev) =>
        prev.map((l) =>
          l.list_id === list_id
            ? {
                ...l,
                cards: [...l.cards, newCard].sort(
                  (a, b) => a.position - b.position
                ),
              }
            : l
        )
      );
      toast.success("Card added");
    } catch {
      toast.error("Failed to add card");
    }
  }

  // === File upload ≤ 5MB (admin or assigned employee) ===
  async function uploadImage(list_id: string, card: Card, file: File) {
    if (!canWrite || !canEditCard(card)) return;
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("fkboardid", fkboardid as string);
      fd.append("listid", list_id);
      fd.append("kanbanCardId", card.card_id);
      fd.append("uploadImage", file);
      const res = await EditCard(fd);
      if ((res as any)?.status === 413) {
        toast.error("File too large (max 5MB)");
        return;
      }
      await load(); // refresh to show preview
    } catch {
      toast.error("Image upload failed");
    }
  }

  // === Subtasks (assignments) ===
  async function addSubtask(card: Card, list_id: string) {
    if (!canWrite || !canEditCard(card)) return;
    const taskName = prompt("Subtask name", "New task");
    if (!taskName) return;

    // quick assignee select (prompt). Replace with a select UI later
    const assignee =
      prompt(
        `Assignee ID\n${members
          .map((m) => `${m.id} = ${m.name}`)
          .join("\n")}`,
        String(currentUserId)
      ) || String(currentUserId);

    try {
      await AddTask(
        taskName,
        Number(card.card_id) || ((card.card_id as unknown) as any),
        "User",
        currentUserId,
        assignee, // API expects string
        fkboardid as any,
        1001 as any
      );
      await load();
    } catch {
      toast.error("Failed to add subtask");
    }
  }

  async function toggleSubtask(card: Card, task: Task) {
    const canEdit =
      isAdmin || (!!task.assigneeId && task.assigneeId === currentUserId);
    if (!canWrite || !canEdit) return;
    try {
      const fd = new FormData();
      fd.append("fkboardid", fkboardid as string);
      fd.append("cardId", String(card.card_id));
      fd.append("taskId", String(task.task_id));
      fd.append("completed", String(task.status !== "done"));
      await SubmitTask(fd);
      await load();
    } catch {
      toast.error("Failed to update subtask");
    }
  }

  async function deleteSubtask(taskId: string) {
    if (!canWrite) return;
    try {
      await DeleteTask(Number(taskId) || ((taskId as unknown) as any));
      await load();
    } catch {
      toast.error("Failed to delete subtask");
    }
  }

  // === Share (public read-only) ===
  async function share() {
    try {
      let publicPath = `/kanbanList/${fkboardid}?view=public`;
      try {
        const anyFn = getShareLinkApi as any;
        if (typeof anyFn === "function") {
          const r = await anyFn(fkboardid);
          if (r?.data) publicPath = r.data;
        }
      } catch {}
      await navigator.clipboard.writeText(location.origin + publicPath);
      toast.success("Share link copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  // === Close board (admin-only when 100%) ===
  async function closeBoard() {
    if (!isAdmin || progress < 100) return;
    try {
      const anyFn = closeBoardApi as any;
      if (typeof anyFn === "function") await anyFn(fkboardid);
      toast.success("Board closed");
      await load();
    } catch {
      toast.error("Failed to close");
    }
  }

  // === Drag & Drop ===
  async function onDragEnd(result: DropResult) {
    if (!isAdmin) return;
    const { destination, source, draggableId, type } = result;
    if (!destination) return;

    // reorder lists
    if (type === "COLUMN") {
      const srcIndex = source.index;
      const dstIndex = destination.index;
      if (srcIndex === dstIndex) return;

      const next = Array.from(lists);
      const [moved] = next.splice(srcIndex, 1);
      next.splice(dstIndex, 0, moved);
      const reindexed = next.map((l, i) => ({ ...l, position: i }));
      setLists(reindexed);

      try {
        await useOnDragEndList(
          moved.list_id as any,
          srcIndex,
          reindexed[dstIndex].list_id as any,
          dstIndex,
          "Admin",
          "reorder",
          fkboardid as any,
          1001 as any
        );
      } catch {
        toast.error("List reorder failed");
        load();
      }
      return;
    }

    // move cards
    const start = lists.find((l) => l.list_id === source.droppableId)!;
    const finish = lists.find((l) => l.list_id === destination.droppableId)!;

    // same list reorder
    if (start.list_id === finish.list_id) {
      if (source.index === destination.index) return;

      const newCards = Array.from(start.cards);
      const [moved] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, moved);
      newCards.forEach((c, i) => (c.position = i));

      setLists((prev) =>
        prev.map((l) =>
          l.list_id === start.list_id ? { ...l, cards: newCards } : l
        )
      );

      try {
        await useOnDragEndCard(
          start.list_id as any,
          finish.list_id as any,
          draggableId as any,
          moved.title,
          "Admin",
          source.index,
          destination.index,
          fkboardid as any,
          1001 as any
        );
      } catch {
        toast.error("Card reorder failed");
        load();
      }
      return;
    }

    // across lists
    const startCards = Array.from(start.cards);
    const [moved] = startCards.splice(source.index, 1);
    const finishCards = Array.from(finish.cards);
    finishCards.splice(destination.index, 0, moved);

    startCards.forEach((c, i) => (c.position = i));
    finishCards.forEach((c, i) => (c.position = i));

    setLists((prev) =>
      prev.map((l) =>
        l.list_id === start.list_id
          ? { ...l, cards: startCards }
          : l.list_id === finish.list_id
          ? {
              ...l,
              cards: finishCards.map((c) =>
                c.card_id === moved.card_id
                  ? { ...c, list_id: finish.list_id }
                  : c
              ),
            }
          : l
      )
    );

    try {
      await useOnDragEndCard(
        start.list_id as any,
        finish.list_id as any,
        draggableId as any,
        moved.title,
        "Admin",
        source.index,
        destination.index,
        fkboardid as any,
        1001 as any
      );
    } catch {
      toast.error("Card move failed");
      load();
    }
  }

  const headerProgressBar = useMemo(() => {
    const p = progress ?? 0;
    const color =
      p < 30 ? "bg-red-500" : p < 70 ? "bg-yellow-500" : "bg-green-600";
    return (
      <div className="flex items-center gap-3">
        <div className="h-3 w-40 rounded bg-gray-200">
          <div className={`h-3 rounded ${color}`} style={{ width: `${p}%` }} />
        </div>
        <span className="text-xs text-gray-600">{p}%</span>
      </div>
    );
  }, [progress]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{boardTitle}</h1>
        <div className="flex items-center gap-2">
          {headerProgressBar}
          <button
            onClick={share}
            className="rounded border px-3 py-1 text-xs hover:bg-gray-50"
          >
            Share
          </button>
          <button
            onClick={closeBoard}
            disabled={!isAdmin || progress < 100}
            className={`rounded border px-3 py-1 text-xs ${
              !isAdmin || progress < 100
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-gray-50"
            }`}
          >
            Close board
          </button>
          <button
            onClick={addList}
            disabled={!isAdmin || lists.length >= 6}
            className={`rounded border px-3 py-1 text-xs ${
              !isAdmin || lists.length >= 6
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-gray-50"
            }`}
          >
            + Add list
          </button>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="text-sm text-gray-500">loading…</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="COLUMN">
            {(provided) => (
              <div
                className="flex gap-4 overflow-x-auto pb-4"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {lists.map((list, li) => (
                  <Draggable
                    draggableId={list.list_id}
                    index={li}
                    key={list.list_id}
                    isDragDisabled={!isAdmin}
                  >
                    {(p) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        className="w-72 shrink-0 rounded-lg border bg-white"
                      >
                        <div
                          className="flex items-center justify-between border-b px-3 py-2"
                          {...p.dragHandleProps}
                        >
                          <div className="font-medium">{list.list_name}</div>
                          <button
                            onClick={() => addCard(list.list_id)}
                            disabled={!isAdmin}
                            className={`text-xs ${
                              !isAdmin ? "opacity-50" : "hover:underline"
                            }`}
                          >
                            + Card
                          </button>
                        </div>

                        {/* Per-list infinite scroll */}
                        <Droppable droppableId={list.list_id} type="CARD">
                          {(drop) => (
                            <div
                              ref={drop.innerRef}
                              {...drop.droppableProps}
                              className="space-y-2 p-3 max-h-[70vh] overflow-y-auto"
                              onScroll={(e) => {
                                const el = e.currentTarget;
                                if (
                                  el.scrollTop + el.clientHeight >=
                                  el.scrollHeight - 6
                                ) {
                                  showMore(list.list_id, list.cards.length);
                                }
                              }}
                            >
                              {list.cards
                                .slice(0, visibleMap[list.list_id] ?? 10)
                                .map((c, ci) => (
                                  <Draggable
                                    key={c.card_id}
                                    draggableId={c.card_id}
                                    index={ci}
                                    isDragDisabled={!isAdmin}
                                  >
                                    {(dp) => (
                                      <div
                                        ref={dp.innerRef}
                                        {...dp.draggableProps}
                                        {...dp.dragHandleProps}
                                        className="rounded border bg-white p-2 shadow-sm"
                                      >
                                        <div className="text-sm font-medium">
                                          {c.title}
                                        </div>
                                        {c.description ? (
                                          <div className="mt-1 text-xs text-gray-600">
                                            {c.description}
                                          </div>
                                        ) : null}

                                        {/* image preview */}
                                        {c.imageUrl ? (
                                          <img
                                            src={c.imageUrl}
                                            className="mt-2 w-full rounded"
                                            alt=""
                                          />
                                        ) : null}

                                        {/* upload (admin or assigned employee) */}
                                        {(isAdmin || canEditCard(c)) &&
                                        !readOnly ? (
                                          <label className="mt-2 inline-block cursor-pointer text-[11px] text-blue-600 hover:underline">
                                            Upload image
                                            <input
                                              type="file"
                                              accept="image/*"
                                              className="hidden"
                                              onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f)
                                                  uploadImage(
                                                    list.list_id,
                                                    c,
                                                    f
                                                  );
                                              }}
                                            />
                                          </label>
                                        ) : null}

                                        {/* Subtasks */}
                                        {c.tasks && c.tasks.length > 0 && (
                                          <div className="mt-2 space-y-1">
                                            {c.tasks.map((t) => {
                                              const canToggle =
                                                isAdmin ||
                                                t.assigneeId === currentUserId;
                                              return (
                                                <div
                                                  key={t.task_id}
                                                  className="flex items-center justify-between"
                                                >
                                                  <label className="flex items-center gap-2 text-xs">
                                                    <input
                                                      type="checkbox"
                                                      checked={
                                                        t.status === "done"
                                                      }
                                                      onChange={() =>
                                                        toggleSubtask(c, t)
                                                      }
                                                      disabled={
                                                        readOnly || !canToggle
                                                      }
                                                    />
                                                    <span>
                                                      {t.task_name}
                                                    </span>
                                                  </label>
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-[11px] text-gray-500">
                                                      {members.find(
                                                        (m) =>
                                                          m.id ===
                                                          t.assigneeId
                                                      )?.name ||
                                                        "Unassigned"}
                                                    </span>
                                                    {canToggle && !readOnly ? (
                                                      <button
                                                        className="text-[11px] text-red-600 hover:underline"
                                                        onClick={() =>
                                                          deleteSubtask(
                                                            t.task_id
                                                          )
                                                        }
                                                      >
                                                        delete
                                                      </button>
                                                    ) : null}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}

                                        {/* Add subtask */}
                                        {(isAdmin || canEditCard(c)) &&
                                        !readOnly ? (
                                          <button
                                            className="mt-2 text-[11px] text-blue-600 hover:underline"
                                            onClick={() =>
                                              addSubtask(c, list.list_id)
                                            }
                                          >
                                            + Add subtask
                                          </button>
                                        ) : null}

                                        {/* mini subtask progress */}
                                        {c.tasks && c.tasks.length > 0 ? (
                                          <div className="mt-2 flex items-center gap-2">
                                            <div className="h-2 grow rounded bg-gray-200">
                                              <div
                                                className="h-2 rounded bg-green-500"
                                                style={{
                                                  width: `${Math.round(
                                                    (c.tasks.filter(
                                                      (t) =>
                                                        t.status === "done"
                                                    ).length /
                                                      c.tasks.length) *
                                                      100
                                                  )}%`,
                                                }}
                                              />
                                            </div>
                                            <div className="w-10 text-[10px] text-gray-600">
                                              {
                                                c.tasks.filter(
                                                  (t) => t.status === "done"
                                                ).length
                                              }
                                              /{c.tasks.length}
                                            </div>
                                          </div>
                                        ) : null}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              {drop.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}

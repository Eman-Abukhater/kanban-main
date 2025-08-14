// src/pages/kanbanList/[id].tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import * as kanbanApi from "@/services/kanbanApi";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { toast } from "react-toastify";
import CardDrawer from "@/components/kanban/CardDrawer";

// ==== Types (page-local, normalized) ====
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
  startDate?: string | null;
  endDate?: string | null;
  tags?: { id: string | number; title: string; color?: string }[];
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

  const fkboardid = id; // GUID in URL
  const role: Role = userGuid === "ADMIN-GUID" ? "admin" : "employee";
  const readOnly = view === "public";
  const isAdmin = role === "admin" && !readOnly;

  // Replace this with your real auth later
  const currentUserId = isAdmin ? 205 : 301;

  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<List[]>([]);
  const [boardTitle, setBoardTitle] = useState<string>("Kanban");
  const [progress, setProgress] = useState<number>(0);
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);

  // drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("edit");
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [createTargetListId, setCreateTargetListId] = useState<string | null>(
    null
  );

  // per-list infinite scroll
  const [visibleMap, setVisibleMap] = useState<Record<string, number>>({});

  // UI for adding list inline
  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");

  function resetVisible(ls: List[]) {
    const v: Record<string, number> = {};
    ls.forEach((l) => (v[l.list_id] = 10));
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
      (acc, c) =>
        acc + (c.tasks || []).filter((t) => t.status === "done").length,
      0
    );
    const done = doneCards + doneSubs;
    return total ? Math.round((done / total) * 100) : 0;
  }

  // Normalize service response to our List/Card shape
  function normalize(res: any): {
    lists: List[];
    title: string;
    progress: number;
  } {
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
          startDate: c.startDate ?? null,
          endDate: c.endDate ?? null,
          tags: Array.isArray(c.tags)
            ? c.tags.map((t: any) => ({
                id: t.id ?? t.tagid ?? String(t.title),
                title: String(t.title ?? t.name ?? ""),
                color: t.color,
              }))
            : [],
        }));
        return { list_id, list_name, position, cards };
      })
      .sort((a: List, b: List) => a.position - b.position)
      .map((l: List) => ({
        ...l,
        cards: l.cards.slice().sort((a: Card, b: Card) => a.position - b.position),
      }));

    const title = String(res?.board?.title ?? "Kanban");
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
      const res = await kanbanApi.fetchKanbanList(fkboardid);
      const norm = normalize(res);
      setLists(norm.lists);
      setBoardTitle(norm.title || "Kanban");
      setProgress(norm.progress ?? 0);
      resetVisible(norm.lists);

      const m = await kanbanApi.fetchAllMembers().catch(() => null as any);
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
  async function submitNewList() {
    if (!isAdmin || !newListName.trim()) return;
    if (lists.length >= 6) {
      toast.error("Max lists is 6");
      return;
    }
    try {
      const res = await kanbanApi.AddKanbanList(
        newListName.trim(),
        fkboardid!,
        "205-Osama Ahmed",
        205,
        1001
      );
      const newList: List = {
        list_id: String(res?.data?.list_id ?? "default-list-id"),
        list_name: newListName.trim(),
        position: Number(res?.data?.position ?? lists.length),
        cards: [],
      };
      const next = [...lists, newList].sort((a, b) => a.position - b.position);
      setLists(next);
      setVisibleMap((m) => ({ ...m, [newList.list_id]: 10 }));
      setNewListName("");
      setAddingList(false);
      toast.success("List added");
    } catch {
      toast.error("Failed to add list");
    }
  }

  // === Delete list ===
  async function deleteList(list_id: string) {
    if (!isAdmin) return;

    try {
      if (typeof (kanbanApi as any).DeleteKanbanList === "function") {
        await (kanbanApi as any).DeleteKanbanList(list_id, fkboardid);
      }
      setLists((prev) => prev.filter((l) => l.list_id !== list_id));
      toast.success("List deleted");
    } catch {
      toast.error("Failed to delete list");
    }
  }

  // === Open drawer in CREATE mode ===
  function openCreateDrawer(list_id: string) {
    if (!isAdmin) return;
    setCreateTargetListId(list_id);
    setActiveCard(null);
    setDrawerMode("create");
    setDrawerOpen(true);
  }

  // === Called by Drawer on "Save" in create mode ===
  async function createCardFromDrawer(payload: {
    title: string;
    description?: string;
    startDate?: string | null;
    endDate?: string | null;
    imageFile?: File | null;
    tags?: { title: string; color?: string }[];
  }) {
    if (!isAdmin || !createTargetListId) return;
    try {
      // 1) Create the card (title only)
      const created = await kanbanApi.AddCard(
        payload.title.trim() || "New card",
        createTargetListId,
        "205-Osama Ahmed",
        205,
        fkboardid as any
      );

      const newCardId = String(created?.data?.card_id ?? created?.data?.id);
      const newCard: Card = {
        card_id: newCardId,
        list_id: createTargetListId,
        title: payload.title.trim() || "New card",
        description: payload.description || "",
        position: Number(created?.data?.position ?? created?.data?.seq ?? 0),
        imageUrl: null,
        tasks: [],
        startDate: payload.startDate ?? null,
        endDate: payload.endDate ?? null,
        tags: [],
      };

      // 2) Apply desc/dates/image via EditCard
      const fd = new FormData();
      fd.append("fkboardid", fkboardid as string);
      fd.append("listid", createTargetListId);
      fd.append("kanbanCardId", newCardId);
      if (newCard.title) fd.append("title", newCard.title);
      if (newCard.description) fd.append("desc", newCard.description);
      if (newCard.startDate) fd.append("startDate", newCard.startDate);
      if (newCard.endDate) fd.append("endDate", newCard.endDate);
      if (payload.imageFile) fd.append("uploadImage", payload.imageFile);

      await kanbanApi.EditCard(fd);

      // 3) Tags (optional)
      if (payload.tags?.length && typeof (kanbanApi as any).AddTag === "function") {
        for (const t of payload.tags) {
          await (kanbanApi as any).AddTag(
            t.title,
            t.color || "#a3a3a3",
            newCardId,
            "User",
            205
          );
        }
      }

      // 4) Update UI & close
      setLists((prev) =>
        prev.map((l) =>
          l.list_id === createTargetListId
            ? {
                ...l,
                cards: [...l.cards, newCard].sort(
                  (a, b) => a.position - b.position
                ),
              }
            : l
        )
      );
      setDrawerOpen(false);
      setCreateTargetListId(null);
      toast.success("Card created");
    } catch {
      toast.error("Failed to create card");
    }
  }

  // === Open drawer in EDIT mode ===
  function openEditDrawer(card: Card) {
    setActiveCard(card);
    setDrawerMode("edit");
    setDrawerOpen(true);
  }

  // === Save edits from drawer ===
  async function afterEditSaved() {
    await load();
  }

  // === Delete card ===
  async function deleteCard(cardId: string, list_id: string) {
    try {
      if (typeof (kanbanApi as any).DeleteCard === "function") {
        await (kanbanApi as any).DeleteCard(cardId, fkboardid);
      }
      setLists((prev) =>
        prev.map((l) =>
          l.list_id === list_id
            ? { ...l, cards: l.cards.filter((c) => c.card_id !== cardId) }
            : l
        )
      );
      toast.success("Card deleted");
    } catch {
      toast.error("Failed to delete card");
    }
  }

  // === Share / Close ===
  async function share() {
    try {
      let publicPath = `/kanbanList/${fkboardid}?view=public`;
      try {
        const r =
          typeof (kanbanApi as any).getShareLink === "function"
            ? await (kanbanApi as any).getShareLink(fkboardid)
            : null;
        if (r?.data) publicPath = r.data;
      } catch {}
      await navigator.clipboard.writeText(location.origin + publicPath);
      toast.success("Share link copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  async function closeBoard() {
    if (!isAdmin || progress < 100) return;
    try {
      if (typeof (kanbanApi as any).closeBoard === "function") {
        await (kanbanApi as any).closeBoard(fkboardid);
      }
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
        await kanbanApi.useOnDragEndList(
          moved.list_id as any,
          srcIndex,
          reindexed[dstIndex].list_id as any,
          dstIndex,
          "Admin",
          "reorder",
          fkboardid as any
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
        await kanbanApi.useOnDragEndCard(
          start.list_id as any,
          finish.list_id as any,
          draggableId as any,
          moved.title,
          "Admin",
          source.index,
          destination.index,
          fkboardid as any
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
      await kanbanApi.useOnDragEndCard(
        start.list_id as any,
        finish.list_id as any,
        draggableId as any,
        moved.title,
        "Admin",
        source.index,
        destination.index,
        fkboardid as any
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

  // NEW: When drawer picks a file, instantly update that card’s cover
  // below your other functions
function handleLocalCoverPreview(p: { cardId?: string; listId?: string; dataUrl: string }) {
  if (!p.cardId || !p.listId) return;
  setLists(prev =>
    prev.map(l =>
      l.list_id === p.listId
        ? {
            ...l,
            cards: l.cards.map(c =>
              c.card_id === p.cardId ? { ...c, imageUrl: p.dataUrl } : c
            ),
          }
        : l
    )
  );
}




  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold sm:text-xl">{boardTitle}</h1>
        <div className="flex flex-wrap items-center gap-2">
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

          {/* Add list inline (max 6) */}
          {!addingList ? (
            <button
              onClick={() => {
                if (!isAdmin || lists.length >= 6) return;
                setAddingList(true);
              }}
              disabled={!isAdmin || lists.length >= 6}
              className={`rounded border px-3 py-1 text-xs ${
                !isAdmin || lists.length >= 6
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-gray-50"
              }`}
            >
              + Add list
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="New list name"
                className="w-40 rounded border px-2 py-1 text-xs"
              />
              <button
                onClick={submitNewList}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setNewListName("");
                  setAddingList(false);
                }}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
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
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-wrap items-start gap-4"  
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
                        className="flex min-w-[280px] flex-1 basis-[320px] max-w-[420px] flex-col rounded-lg border bg-white"
                      >
                        {/* List header with drag-handle + ⋯ menu */}
                        <div
                          className="flex items-center justify-between border-b px-3 py-2"
                          {...p.dragHandleProps}
                        >
                          <div className="font-medium">{list.list_name}</div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openCreateDrawer(list.list_id)}
                              disabled={!isAdmin}
                              className={`text-xs ${
                                !isAdmin ? "opacity-50" : "hover:underline"
                              }`}
                            >
                              + Card
                            </button>

                            {/* ⋯ menu */}
                            <div className="relative">
                              <details className="group">
                                <summary
                                  className="cursor-pointer rounded px-1 py-0.5 text-xl leading-none hover:bg-gray-100"
                                  title="More"
                                >
                                  ⋯
                                </summary>
                                <div className="absolute right-0 z-10 mt-1 w-36 rounded border bg-white p-1 text-sm shadow">
                                  <button
                                    onClick={() => deleteList(list.list_id)}
                                    disabled={!isAdmin}
                                    className="block w-full rounded px-2 py-1 text-left hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    Delete list
                                  </button>
                                </div>
                              </details>
                            </div>
                          </div>
                        </div>

                        {/* Cards – per-list infinite scroll */}
                        <Droppable droppableId={list.list_id} type="CARD">
                          {(drop) => (
                            <div
                              ref={drop.innerRef}
                              {...drop.droppableProps}
                              className="max-h-[70vh] space-y-2 overflow-y-auto p-3"
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
                                        onClick={() => openEditDrawer(c)}
                                        className="cursor-pointer rounded border bg-white p-2 shadow-sm hover:bg-gray-50"
                                      >
                                        <div className="text-sm font-medium">
                                          {c.title}
                                        </div>
                                        {c.description ? (
                                          <div className="mt-1 line-clamp-2 text-xs text-gray-600">
                                            {c.description}
                                          </div>
                                        ) : null}
                                        {c.imageUrl ? (
                                          <img
                                            src={c.imageUrl}
                                            className="mt-2 w-full rounded object-cover"
                                            style={{ height: 160 }}    // <-- clamp cover so it can't stretch other lists
                                            alt=""
                                          />
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

      {/* Drawer */}
      <CardDrawer
        open={drawerOpen}
        mode={drawerMode}
        card={
          drawerMode === "edit" && activeCard
            ? lists
                .flatMap((l) => l.cards)
                .find((c) => c.card_id === activeCard.card_id) || activeCard
            : null
        }
        listIdForCreate={drawerMode === "create" ? createTargetListId : null}
        onClose={() => {
          setDrawerOpen(false);
          setActiveCard(null);
          setCreateTargetListId(null);
        }}
        onCreate={createCardFromDrawer}
        onSaved={afterEditSaved}
        onDelete={(cid, lid) => deleteCard(cid, lid)}
        members={members}
        readOnly={false}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        EditCard={kanbanApi.EditCard}
        AddTask={kanbanApi.AddTask}
        SubmitTask={kanbanApi.SubmitTask}
        DeleteTask={kanbanApi.DeleteTask}
        AddTag={(kanbanApi as any).AddTag}
        DeleteTag={(kanbanApi as any).DeleteTag}
        fkboardid={fkboardid as string}
        // NEW: instant cover update on file choose
        onLocalCoverPreview={handleLocalCoverPreview}
        />
    </div>
  );
}

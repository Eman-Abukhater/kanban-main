import { v4 as uuid } from "uuid";

/** ======= Seed + Types ======= */
const FAKE_MEMBERS = [
  { id: 205, name: "Osama Ahmed" },
  { id: 301, name: "Abeer F." },
  { id: 302, name: "Badr N." },
  { id: 303, name: "Carim K." },
];

type Member = { id: number; name: string };

export type BoardRow = {
  boardid: number;
  fkboardid: string;       // GUID (used in URL)
  title: string;           // project name
  description?: string;
  members: Member[];
  status: "open" | "closed";
  progress: number;        // 0..100
  createdAt: string;       // ISO
  addedby: string;
  addedbyid: number | null;
  fkpoid: number | null;   // fake “project/org” id
};

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

export type KbList = {
  list_id: string;
  list_name: string;
  position: number;
  cards: Card[];
};

type Resp<T> = { status: number; data: T };

const KEY_BOARDS = "kanban-fake-boardlist-v1";
const KEY_KANBAN_PREFIX = "kanban-fake-board-"; // + fkboardid

/** ======= Helpers ======= */
function loadBoards(): BoardRow[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY_BOARDS);
  if (raw) return JSON.parse(raw);
  // seed one project
  const seed: BoardRow[] = [
    {
      boardid: 1,
      fkboardid: uuid(),
      title: "ESAP ERP – Pilot",
      description: "تحليل و بناء المطبخ",
      members: [FAKE_MEMBERS[2], FAKE_MEMBERS[3]],
      status: "open",
      progress: 48,
      createdAt: new Date().toISOString(),
      addedby: "205-Osama Ahmed",
      addedbyid: 205,
      fkpoid: 1001,
    },
  ];
  localStorage.setItem(KEY_BOARDS, JSON.stringify(seed));
  // also seed its kanban
  const kbKey = KEY_KANBAN_PREFIX + seed[0].fkboardid;
  const lists: KbList[] = [
    { list_id: uuid(), list_name: "To-do", position: 0, cards: [] },
    { list_id: uuid(), list_name: "In-progress", position: 1, cards: [] },
    { list_id: uuid(), list_name: "Done", position: 2, cards: [] },
  ];
  localStorage.setItem(kbKey, JSON.stringify(lists));
  return seed;
}
function saveBoards(rows: BoardRow[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_BOARDS, JSON.stringify(rows));
}

function kbKeyFor(fkboardid: string) {
  return KEY_KANBAN_PREFIX + fkboardid;
}
function loadKanban(fkboardid: string): KbList[] {
  const raw = localStorage.getItem(kbKeyFor(fkboardid));
  if (raw) return JSON.parse(raw);
  const lists: KbList[] = [
    { list_id: uuid(), list_name: "To-do", position: 0, cards: [] },
    { list_id: uuid(), list_name: "In-progress", position: 1, cards: [] },
    { list_id: uuid(), list_name: "Done", position: 2, cards: [] },
  ];
  localStorage.setItem(kbKeyFor(fkboardid), JSON.stringify(lists));
  return lists;
}
function saveKanban(fkboardid: string, lists: KbList[]) {
  localStorage.setItem(kbKeyFor(fkboardid), JSON.stringify(lists));
}

function findCard(
  lists: KbList[],
  cardId: string
): { listIndex: number; cardIndex: number } | null {
  for (let i = 0; i < lists.length; i++) {
    const ci = lists[i].cards.findIndex((c) => c.card_id === cardId);
    if (ci !== -1) return { listIndex: i, cardIndex: ci };
  }
  return null;
}

function computeProgress(lists: KbList[]) {
  const done = lists.find(
    (l) => l.list_name.trim().toLowerCase() === "done"
  );
  const totalCards = lists.reduce((n, l) => n + l.cards.length, 0);
  return totalCards
    ? Math.round(((done?.cards.length || 0) / totalCards) * 100)
    : 0;
}

function updateBoardProgress(fkboardid: string) {
  const boards = loadBoards();
  const board = boards.find((b) => b.fkboardid === fkboardid);
  if (!board) return;
  const lists = loadKanban(fkboardid);
  board.progress = computeProgress(lists);
  saveBoards(boards);
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/** ======= Board List APIs ======= */
export async function fetchInitialBoards(
  fkpoid: number | null
): Promise<Resp<BoardRow[]>> {
  const rows = loadBoards().filter((r) => fkpoid == null || r.fkpoid === fkpoid);
  return { status: 200, data: rows };
}

export async function AddBoard(
  projectName: string,
  fkpoid: number | null,
  addedbyid: number | null,
  addedby: string,
  options?: { description?: string; memberIds?: number[] }
): Promise<Resp<BoardRow>> {
  const rows = loadBoards();
  const fkboardid = uuid();
  const members =
    (options?.memberIds || [])
      .map((id) => FAKE_MEMBERS.find((m) => m.id === id))
      .filter(Boolean) as Member[];
  const row: BoardRow = {
    boardid: rows.length ? Math.max(...rows.map((r) => r.boardid)) + 1 : 1,
    fkboardid,
    title: projectName,
    description: options?.description || "",
    members,
    status: "open",
    progress: 0,
    createdAt: new Date().toISOString(),
    addedby,
    addedbyid,
    fkpoid,
  };
  saveBoards([row, ...rows]);
  // seed default lists for this board
  saveKanban(fkboardid, [
    { list_id: uuid(), list_name: "To-do", position: 0, cards: [] },
    { list_id: uuid(), list_name: "In-progress", position: 1, cards: [] },
    { list_id: uuid(), list_name: "Done", position: 2, cards: [] },
  ]);
  return { status: 200, data: row };
}

export async function EditBoard(
  title: string,
  boardid: number | null,
  updatedby: string
): Promise<Resp<{ boardid: number | null; updatedBy: string }>> {
  const rows = loadBoards();
  const idx = rows.findIndex((r) => r.boardid === boardid);
  if (idx >= 0) rows[idx].title = title;
  saveBoards(rows);
  return { status: 200, data: { boardid, updatedBy: updatedby } };
}

export async function DeleteBoard(boardid: number) {
  const rows = loadBoards();
  const row = rows.find((r) => r.boardid === boardid);
  const next = rows.filter((r) => r.boardid !== boardid);
  saveBoards(next);
  if (row) localStorage.removeItem(kbKeyFor(row.fkboardid));
  return { status: 200, data: { deleted: boardid } };
}

export async function fetchProjects() {
  // derive unique project titles
  const titles = Array.from(new Set(loadBoards().map((r) => r.title)));
  return { status: 200, data: titles.map((t, i) => ({ id: i + 1, name: t })) };
}

export async function fetchAllMembers(): Promise<Resp<Member[]>> {
  return { status: 200, data: FAKE_MEMBERS };
}

export async function UpdateBoardFields(
  boardid: number,
  patch: Partial<
    Pick<BoardRow, "title" | "description" | "members" | "progress">
  > & { memberIds?: number[] }
) {
  const rows = loadBoards();
  const idx = rows.findIndex((r) => r.boardid === boardid);
  if (idx === -1) return { status: 404, data: null as any };

  if (patch.memberIds) {
    patch.members = patch.memberIds
      .map((id) => FAKE_MEMBERS.find((m) => m.id === id))
      .filter(Boolean) as Member[];
    delete patch.memberIds;
  }
  rows[idx] = { ...rows[idx], ...patch };
  saveBoards(rows);
  return { status: 200, data: rows[idx] };
}

/** ======= Kanban APIs (lists + cards) ======= */
export async function fetchKanbanList(fkboardid: string) {
  const all = loadBoards();
  const board = all.find((b) => b.fkboardid === fkboardid);
  const lists = loadKanban(fkboardid).sort((a, b) => a.position - b.position);

  // compute progress: percent of cards in "Done"
  const progress = computeProgress(lists);

  // keep board.progress roughly in sync (not required, but useful)
  if (board && board.progress !== progress) {
    board.progress = progress;
    saveBoards(all);
  }

  return {
    lists,
    board: { title: board?.title || "Kanban", fkboardid, status: board?.status || "open" },
    progress,
  };
}

export async function AddKanbanList(
  title: string,
  fkboardid: string,
  addedby: string,
  addedbyid: number,
  fkpoid?: number
) {
  const lists = loadKanban(fkboardid);
  const next = [
    ...lists,
    { list_id: uuid(), list_name: title, position: lists.length, cards: [] },
  ];
  saveKanban(fkboardid, next);
  const created = next[next.length - 1];
  return { status: 200, data: created };
}

export async function AddCard(
  title: string,
  list_id: string,
  addedby: string,
  addedbyid: number,
  fkboardid: string
) {
  const lists = loadKanban(fkboardid);
  const idx = lists.findIndex((l) => l.list_id === list_id);
  if (idx === -1) return { status: 404, data: null as any };

  const newCard: Card = {
    card_id: uuid(),
    list_id,
    title,
    description: "",
    position: lists[idx].cards.length,
    imageUrl: null,
    tasks: [],
  };
  lists[idx] = { ...lists[idx], cards: [...lists[idx].cards, newCard] };
  saveKanban(fkboardid, lists);
  updateBoardProgress(fkboardid);
  return { status: 200, data: newCard };
}

export async function useOnDragEndList(
  draggedId: string,
  draggedSeqNo: number,
  destId: string,
  destSeqNo: number,
  updatedBy: string,
  action: string,
  fkboardid: string
) {
  const lists = loadKanban(fkboardid);
  const from = lists.findIndex((l) => l.list_id === draggedId);
  const to = lists.findIndex((l) => l.list_id === destId);
  if (from === -1 || to === -1) return { status: 404, data: null as any };

  const next = Array.from(lists);
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  next.forEach((l, i) => (l.position = i));
  saveKanban(fkboardid, next);
  return { status: 200, data: next };
}

export async function useOnDragEndCard(
  sourceListId: string,
  destinationListId: string,
  cardId: string,
  cardTitle: string,
  updatedBy: string,
  oldSeqNo: number,
  newSeqNo: number,
  fkboardid: string
) {
  const lists = loadKanban(fkboardid);
  const si = lists.findIndex((l) => l.list_id === sourceListId);
  const di = lists.findIndex((l) => l.list_id === destinationListId);
  if (si === -1 || di === -1) return { status: 404, data: null as any };

  const source = { ...lists[si] };
  const dest = { ...lists[di] };
  const srcCards = Array.from(source.cards);
  const [moved] = srcCards.splice(oldSeqNo, 1);
  const dstCards = Array.from(dest.cards);
  dstCards.splice(newSeqNo, 0, { ...moved, list_id: destinationListId });

  srcCards.forEach((c, i) => (c.position = i));
  dstCards.forEach((c, i) => (c.position = i));

  lists[si] = { ...source, cards: srcCards };
  lists[di] = { ...dest, cards: dstCards };
  saveKanban(fkboardid, lists);
  updateBoardProgress(fkboardid);
  return { status: 200, data: lists };
}

/** ======= NEW: EditCard (title/desc/completed/image ≤ 5MB) ======= */
export async function EditCard(editVM: FormData): Promise<Resp<Card> | { status: 413; data: null }> {
  const fkboardid = String(editVM.get("fkboardid") ?? "");
  const listId = String(editVM.get("listid") ?? "");
  const cardId = String(editVM.get("kanbanCardId") ?? "");

  const title = editVM.get("title");
  const desc = editVM.get("desc");
  const completed = editVM.get("completed"); // "true"/"false"
  const file = editVM.get("uploadImage") as File | null;

  const lists = loadKanban(fkboardid);
  const li = lists.findIndex((l) => l.list_id === listId);
  if (li === -1) return { status: 404, data: null as any };

  const ci = lists[li].cards.findIndex((c) => c.card_id === cardId);
  if (ci === -1) return { status: 404, data: null as any };

  const card = { ...lists[li].cards[ci] };

  // 5MB validation
  if (file && file.size > 5 * 1024 * 1024) {
    return { status: 413, data: null };
  }
  if (file) {
    const dataUrl = await readFileAsDataURL(file);
    card.imageUrl = dataUrl;
  }
  if (typeof title === "string") card.title = title;
  if (typeof desc === "string") card.description = desc;

  // completed flag: if provided and true & card has tasks, mark all done
  if (typeof completed === "string") {
    const isDone = completed === "true";
    if (card.tasks && card.tasks.length) {
      card.tasks = card.tasks.map((t) => ({
        ...t,
        status: isDone ? "done" : t.status,
      }));
    }
  }

  lists[li].cards[ci] = card;
  saveKanban(fkboardid, lists);
  updateBoardProgress(fkboardid);
  return { status: 200, data: card };
}

/** ======= NEW: AddTask (subtask with assignee) ======= */
export async function AddTask(
  title: string,
  fkKanbanCardId: number | string,
  addedby: string,
  addedbyid: number | null,
  selectedOptions: string, // assigneeId as string
  fkboardid: number | string,
  fkpoid?: number | string
): Promise<Resp<Task>> {
  const boardId = String(fkboardid);
  const lists = loadKanban(boardId);
  const cardId = String(fkKanbanCardId);

  const loc = findCard(lists, cardId);
  if (!loc) return { status: 404, data: null as any };

  const assigneeId = Number(selectedOptions);
  const task: Task = {
    task_id: uuid(),
    task_name: title,
    status: "todo",
    assigneeId: Number.isFinite(assigneeId) ? assigneeId : undefined,
  };

  const target = lists[loc.listIndex].cards[loc.cardIndex];
  target.tasks = [...(target.tasks || []), task];

  saveKanban(boardId, lists);
  updateBoardProgress(boardId);
  return { status: 200, data: task };
}

/** ======= NEW: SubmitTask (toggle completed) ======= */
export async function SubmitTask(submitVM: FormData): Promise<Resp<Task>> {
  const fkboardid = String(submitVM.get("fkboardid") ?? "");
  const cardId = String(submitVM.get("cardId") ?? "");
  const taskId = String(submitVM.get("taskId") ?? "");
  const completed = String(submitVM.get("completed") ?? "false") === "true";

  const lists = loadKanban(fkboardid);
  const loc = findCard(lists, cardId);
  if (!loc) return { status: 404, data: null as any };

  const card = lists[loc.listIndex].cards[loc.cardIndex];
  const ti = (card.tasks || []).findIndex((t) => t.task_id === taskId);
  if (ti === -1) return { status: 404, data: null as any };

  const updated = { ...(card.tasks as Task[])[ti] };
  updated.status = completed ? "done" : "todo";
  (card.tasks as Task[])[ti] = updated;

  saveKanban(fkboardid, lists);
  updateBoardProgress(fkboardid);
  return { status: 200, data: updated };
}

/** ======= NEW: DeleteTask ======= */
export async function DeleteTask(taskid: number | string): Promise<Resp<{ deleted: string }>> {
  const tid = String(taskid);

  // We must search all boards? No—caller passes fkboardid in page flow before reload.
  // Search all boards' kanban stores could be expensive; we’ll scan current open board in UI.
  // Here, we’ll try all boards (safe for fake/local).
  const boards = loadBoards();
  for (const b of boards) {
    const lists = loadKanban(b.fkboardid);
    let changed = false;
    for (let li = 0; li < lists.length; li++) {
      const l = lists[li];
      const before = (l.cards || []).map((c) => c.tasks?.length || 0).reduce((a, n) => a + n, 0);
      lists[li] = {
        ...l,
        cards: l.cards.map((c) => ({
          ...c,
          tasks: (c.tasks || []).filter((t) => t.task_id !== tid),
        })),
      };
      const after = lists[li].cards.map((c) => c.tasks?.length || 0).reduce((a, n) => a + n, 0);
      if (after !== before) changed = true;
    }
    if (changed) {
      saveKanban(b.fkboardid, lists);
      updateBoardProgress(b.fkboardid);
      return { status: 200, data: { deleted: tid } };
    }
  }
  return { status: 404, data: { deleted: tid } };
}

/** ======= NEW: Share link (public read-only) ======= */
export async function getShareLink(
  fkboardid: string
): Promise<Resp<string>> {
  // In real backend, you might create a tokenized URL. Here, we just return public view path.
  return { status: 200, data: `/kanbanList/${fkboardid}?view=public` };
}

/** ======= NEW: Close board ======= */
export async function closeBoard(
  fkboardid: string
): Promise<Resp<{ status: "closed" }>> {
  const boards = loadBoards();
  const idx = boards.findIndex((b) => b.fkboardid === fkboardid);
  if (idx === -1) return { status: 404, data: null as any };
  boards[idx].status = "closed";
  boards[idx].progress = 100;
  saveBoards(boards);
  return { status: 200, data: { status: "closed" } };
}

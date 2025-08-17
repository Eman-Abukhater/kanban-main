import { v4 as uuid } from "uuid";


const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

async function http<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers || {}),
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

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

export type Task = {
  task_id: string;
  task_name: string;
  status: "todo" | "done";
  assigneeId?: number;
};

export type Tag = { id: string; title: string; color?: string };

export type Comment = {
  id: string;
  author: string;     // can be "Anonymous"
  message: string;
  createdAt: string;  // ISO
};

export type Card = {
  card_id: string;
  list_id: string;
  title: string;
  description?: string;
  position: number;
  imageUrl?: string | null;
  tasks?: Task[];
  startDate?: string | null;
  endDate?: string | null;
  tags?: Tag[];
  comments?: Comment[];
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
  if (fkpoid == null) return { status: 200, data: [] as BoardRow[] };
  const data = await http<BoardRow[]>(`/projects/${fkpoid}/boards`);
  return { status: 200, data };
}
export async function AddBoard(
  projectName: string,
  fkpoid: number | null,
  addedbyid: number | null,
  addedby: string,
  options?: { description?: string; memberIds?: number[] }
): Promise<Resp<BoardRow>> {
  const body = {
    projectName,
    fkpoid,
    addedbyid,
    addedby,
    description: options?.description || "",
    memberIds: options?.memberIds || []
  };
  const data = await http<BoardRow>(`/boards`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { status: 200, data };
}

export async function EditBoard(
  title: string,
  boardid: number | null,
  updatedby: string
): Promise<Resp<{ boardid: number | null; updatedBy: string }>> {
  if (boardid == null) return { status: 400, data: { boardid, updatedBy: updatedby } as any };
  // just reuse the same PATCH endpoint you already built
  await http(`/boards/${boardid}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
  return { status: 200, data: { boardid, updatedBy: updatedby } };
}


export async function DeleteBoard(boardid: number) {
  const data = await http<{ deleted: number }>(`/boards/${boardid}`, {
    method: "DELETE",
  });
  return { status: 200, data };
}
export async function fetchProjects() {
  const data = await http<{ id: number; name: string }[]>(`/projects`);
  return { status: 200, data };
}


export async function fetchAllMembers(): Promise<Resp<Member[]>> {
  const data = await http<Member[]>(`/members`);
  return { status: 200, data };
}

export async function UpdateBoardFields(
  boardid: number,
  patch: Partial<Pick<BoardRow, "title" | "description" | "members" | "progress">> & { memberIds?: number[] }
) {
  // The backend ignores "members" array and expects "memberIds"
  const body: any = {};
  if (typeof patch.title === "string") body.title = patch.title;
  if (typeof patch.description === "string") body.description = patch.description;
  if (typeof patch.progress === "number") body.progress = patch.progress;
  if (Array.isArray((patch as any).memberIds)) body.memberIds = (patch as any).memberIds;

  const data = await http<BoardRow>(`/boards/${boardid}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return { status: 200, data };
}

/** ======= Kanban APIs (lists + cards) ======= */
export async function fetchKanbanList(fkboardid: string) {
  return http<any>(`/boards/${fkboardid}/kanban`);
}
// Add list
export async function AddKanbanList(title: string, fkboardid: string, addedby: string, addedbyid: number) {
  const data = await http(`/boards/${fkboardid}/lists`, {
    method: "POST",
    body: JSON.stringify({ list_name: title }),
  });
  return { status: 200, data };
}

// Delete list
export async function DeleteKanbanList(list_id: string, fkboardid: string) {
  const data = await http(`/lists/${list_id}`, { method: "DELETE" });
  return { status: 200, data };
}

// Add card
export async function AddCard(title: string, list_id: string, addedby: string, addedbyid: number, fkboardid: string) {
  const data = await http(`/lists/${list_id}/cards`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  return { status: 200, data };
}

// Delete card
export async function DeleteCard(card_id: string, fkboardid: string) {
  const data = await http(`/cards/${card_id}`, { method: "DELETE" });
  return { status: 200, data };
}

// Drag lists
export async function useOnDragEndList(draggedId: string, draggedSeqNo: number, destId: string, destSeqNo: number, updatedBy: string, action: string, fkboardid: string) {
  // need board_id; fetch once or pass from UI. Quick way: call board by fk to get numeric id.
  // For now front-end already reorders locally; backend just needs PATCH to persist if you have board_id.
  // Optional: look up board_id server-side by fkboardid in /lists/reorder route.
  return { status: 200, data: null as any };
}

// Drag/move card
export async function useOnDragEndCard(sourceListId: string, destinationListId: string, cardId: string, cardTitle: string, updatedBy: string, oldSeqNo: number, newSeqNo: number, fkboardid: string) {
  const data = await http(`/cards/move`, {
    method: "PATCH",
    body: JSON.stringify({
      card_id: cardId,
      source_list_id: sourceListId,
      dest_list_id: destinationListId,
      source_index: oldSeqNo,
      dest_index: newSeqNo
    }),
  });
  return { status: 200, data };
}


/** ======= EditCard (title/desc/completed/image ≤ 5MB + dates) ======= */
// Edit card (with file)
export async function EditCard(fd: FormData) {
  const cardId = String(fd.get("kanbanCardId") || "");
  const res = await fetch(`${API_BASE}/cards/${cardId}`, {
    method: "PUT",
    body: fd,          // NOTE: don't set Content-Type; browser sets multipart boundary
    credentials: "include",
  });
  if (res.status === 413) return { status: 413, data: null as any };
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return { status: 200, data };
}

/** ======= Subtasks ======= */
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

export async function DeleteTask(
  taskid: number | string
): Promise<Resp<{ deleted: string }>> {
  const tid = String(taskid);
  const boards = loadBoards();
  for (const b of boards) {
    const lists = loadKanban(b.fkboardid);
    let changed = false;
    for (let li = 0; li < lists.length; li++) {
      const l = lists[li];
      const newCards = l.cards.map((c) => {
        const before = (c.tasks || []).length;
        const afterTasks = (c.tasks || []).filter((t) => t.task_id !== tid);
        if (before !== afterTasks.length) changed = true;
        return { ...c, tasks: afterTasks };
      });
      lists[li] = { ...l, cards: newCards };
    }
    if (changed) {
      saveKanban(b.fkboardid, lists);
      updateBoardProgress(b.fkboardid);
      return { status: 200, data: { deleted: tid } };
    }
  }
  return { status: 404, data: { deleted: tid } };
}

/** ======= Tags ======= */
export async function AddTag(
  title: string,
  color: string,
  fkKanbanCardId: number | string,
  addedby: string,
  addedbyid: number | null
): Promise<Resp<Tag>> {
  const boards = loadBoards();
  for (const b of boards) {
    const lists = loadKanban(b.fkboardid);
    const loc = findCard(lists, String(fkKanbanCardId));
    if (!loc) continue;

    const tag: Tag = { id: uuid(), title, color };
    const target = lists[loc.listIndex].cards[loc.cardIndex];
    target.tags = [...(target.tags || []), tag];

    saveKanban(b.fkboardid, lists);
    return { status: 200, data: tag };
  }
  return { status: 404, data: null as any };
}

export async function DeleteTag(
  tagid: number | string
): Promise<Resp<{ deleted: string }>> {
  const tid = String(tagid);
  const boards = loadBoards();
  for (const b of boards) {
    const lists = loadKanban(b.fkboardid);
    let changed = false;
    for (let li = 0; li < lists.length; li++) {
      const l = lists[li];
      const newCards = l.cards.map((c) => {
        const before = (c.tags || []).length;
        const afterTags = (c.tags || []).filter((t) => String(t.id) !== tid);
        if (before !== afterTags.length) changed = true;
        return { ...c, tags: afterTags };
      });
      lists[li] = { ...l, cards: newCards };
    }
    if (changed) {
      saveKanban(b.fkboardid, lists);
      return { status: 200, data: { deleted: tid } };
    }
  }
  return { status: 404, data: { deleted: tid } };
}

/** ======= Comments ======= */
export async function AddComment(
  fkboardid: string,
  cardId: string,
  author: string,
  message: string
): Promise<Resp<Comment>> {
  const lists = loadKanban(fkboardid);
  const loc = findCard(lists, cardId);
  if (!loc) return { status: 404, data: null as any };
  const c: Comment = {
    id: uuid(),
    author: author?.trim() || "Anonymous",
    message,
    createdAt: new Date().toISOString(),
  };
  const target = lists[loc.listIndex].cards[loc.cardIndex];
  target.comments = [...(target.comments || []), c];
  saveKanban(fkboardid, lists);
  return { status: 200, data: c };
}

/** ======= Share & Close ======= */
export async function getShareLink(
  fkboardid: string
): Promise<Resp<string>> {
  return { status: 200, data: `/kanbanList/${fkboardid}?view=public` };
}

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

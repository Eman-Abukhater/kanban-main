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

type Card = {
  card_id: string;
  list_id: string;
  title: string;
  description?: string;
  position: number;
  tasks?: { task_id: string; task_name: string; status: "todo" | "done" }[];
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

/** ======= Board List APIs ======= */
export async function fetchInitialBoards(fkpoid: number | null): Promise<Resp<BoardRow[]>> {
  const rows = loadBoards().filter(r => fkpoid == null || r.fkpoid === fkpoid);
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
      .map(id => FAKE_MEMBERS.find(m => m.id === id))
      .filter(Boolean) as Member[];
  const row: BoardRow = {
    boardid: rows.length ? Math.max(...rows.map(r => r.boardid)) + 1 : 1,
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
  const idx = rows.findIndex(r => r.boardid === boardid);
  if (idx >= 0) rows[idx].title = title;
  saveBoards(rows);
  return { status: 200, data: { boardid, updatedBy: updatedby } };
}

export async function DeleteBoard(boardid: number) {
  const rows = loadBoards();
  const row = rows.find(r => r.boardid === boardid);
  const next = rows.filter(r => r.boardid !== boardid);
  saveBoards(next);
  if (row) localStorage.removeItem(kbKeyFor(row.fkboardid));
  return { status: 200, data: { deleted: boardid } };
}

export async function fetchProjects() {
  // derive unique project titles
  const titles = Array.from(new Set(loadBoards().map(r => r.title)));
  return { status: 200, data: titles.map((t, i) => ({ id: i + 1, name: t })) };
}

export async function fetchAllMembers(): Promise<Resp<Member[]>> {
  return { status: 200, data: FAKE_MEMBERS };
}

export async function UpdateBoardFields(
  boardid: number,
  patch: Partial<Pick<BoardRow, "title" | "description" | "members" | "progress">> & { memberIds?: number[] }
) {
  const rows = loadBoards();
  const idx = rows.findIndex(r => r.boardid === boardid);
  if (idx === -1) return { status: 404, data: null as any };

  if (patch.memberIds) {
    patch.members = patch.memberIds
      .map(id => FAKE_MEMBERS.find(m => m.id === id))
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
  const board = all.find(b => b.fkboardid === fkboardid);
  const lists = loadKanban(fkboardid).sort((a, b) => a.position - b.position);
  // compute progress: percent of cards in "Done"
  const done = lists.find(l => l.list_name.toLowerCase() === "done");
  const totalCards = lists.reduce((n, l) => n + l.cards.length, 0);
  const progress = totalCards ? Math.round(((done?.cards.length || 0) / totalCards) * 100) : 0;
  return { lists, board: { title: board?.title || "Kanban", fkboardid }, progress };
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
  const idx = lists.findIndex(l => l.list_id === list_id);
  if (idx === -1) return { status: 404, data: null as any };

  const newCard: Card = {
    card_id: uuid(),
    list_id,
    title,
    description: "",
    position: lists[idx].cards.length,
    tasks: [],
  };
  lists[idx] = { ...lists[idx], cards: [...lists[idx].cards, newCard] };
  saveKanban(fkboardid, lists);
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
  const from = lists.findIndex(l => l.list_id === draggedId);
  const to = lists.findIndex(l => l.list_id === destId);
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
  const si = lists.findIndex(l => l.list_id === sourceListId);
  const di = lists.findIndex(l => l.list_id === destinationListId);
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
  return { status: 200, data: lists };
}

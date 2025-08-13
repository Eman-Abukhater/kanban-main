import { v4 as uuid } from "uuid";

type Member = { id: number; name: string };
type Card = {
  id: number;
  title: string;
  desc?: string;
  completed: boolean;
  seq: number;
  imageDataUrl?: string;
  createdAt: string;
  updatedAt: string;
};
type List = { id: number; title: string; seq: number; cards: Card[] };
type Board = {
  boardid: number;
  fkboardid: string; // GUID used in URL
  title: string;
  description?: string;
  members: Member[];
  status: "open" | "closed";
  progress: number; // 0..100
  createdAt: string;
  addedby: string;
  addedbyid: number | null;
  fkpoid: number | null;
  lists: List[];
};

type Resp<T> = { status: number; data: T };

const KEY = "kanban-fake-boards-v2";
const MEMBERS: Member[] = [
  { id: 205, name: "Osama Ahmed" },
  { id: 301, name: "Abeer F." },
  { id: 302, name: "Badr N." },
  { id: 303, name: "Carim K." },
];

function load(): Board[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  const seed: Board[] = [
    {
      boardid: 1,
      fkboardid: uuid(),
      title: "ESAP ERP – Pilot",
      description: "تحليل و بناء المطبخ",
      members: [MEMBERS[2], MEMBERS[3]],
      status: "open",
      progress: 20,
      createdAt: new Date().toISOString(),
      addedby: "205-Osama Ahmed",
      addedbyid: 205,
      fkpoid: 1001,
      lists: [
        { id: 11, title: "Backlog", seq: 0, cards: [
          { id: 111, title: "Define schema", completed: false, seq: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 112, title: "Design UI",     completed: false, seq: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ]},
        { id: 12, title: "In Progress", seq: 1, cards: [
          { id: 121, title: "Build board list", completed: false, seq: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ]},
        { id: 13, title: "Done", seq: 2, cards: [] },
      ],
    },
  ];
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}
function save(bs: Board[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(bs));
}
function findBoardByGuid(fid: string): Board | undefined {
  return load().find(b => b.fkboardid === fid);
}
function nextId(arr: { id: number }[]) {
  return arr.length ? Math.max(...arr.map(a => a.id)) + 1 : 1;
}
function recomputeProgress(b: Board) {
  const all = b.lists.flatMap(l => l.cards);
  const done = all.filter(c => c.completed).length;
  b.progress = all.length ? Math.round((done / all.length) * 100) : 0;
  b.status = b.progress === 100 ? "closed" : "open";
}

// ===== API surface (mirror of real ones you use) =====

// used by page SSR/client
export async function fetchKanbanList(fkboardid: string): Promise<any> {
  const b = findBoardByGuid(fkboardid);
  if (!b) return [];
  return b.lists.map(l => ({
    id: l.id,
    title: l.title,
    seq: l.seq,
    kanbanCards: l.cards.map(c => ({
      id: c.id,
      title: c.title,
      desc: c.desc ?? "",
      completed: c.completed,
      seq: c.seq,
      imageUrl: c.imageDataUrl ?? null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  }));
}

// add a list
export async function AddKanbanList(
  title: string,
  fkboardid: string | null,
  addedby: string,
  addedbyid: number | null,
  fkpoid: number | null
): Promise<Resp<any> | null> {
  if (!fkboardid) return { status: 400, data: null as any };
  const boards = load();
  const b = boards.find(x => x.fkboardid === fkboardid);
  if (!b) return { status: 404, data: null as any };
  const id = nextId(b.lists);
  b.lists.push({ id, title, seq: b.lists.length, cards: [] });
  save(boards);
  return { status: 200, data: { id, title, seq: b.lists.length - 1 } };
}

// add a card
export async function AddCard(
  title: string,
  fkKanbanListId: number | null,
  addedby: string,
  addedbyid: number | null,
  fkboardid: string | null,
  fkpoid: number | null
): Promise<Resp<any> | null> {
  if (!fkboardid || !fkKanbanListId) return { status: 400, data: null as any };
  const boards = load();
  const b = boards.find(x => x.fkboardid === fkboardid);
  if (!b) return { status: 404, data: null as any };
  const l = b.lists.find(x => x.id === fkKanbanListId);
  if (!l) return { status: 404, data: null as any };
  const id = nextId(l.cards);
  const card: Card = {
    id,
    title,
    desc: "",
    completed: false,
    seq: l.cards.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  l.cards.push(card);
  recomputeProgress(b);
  save(boards);
  return { status: 200, data: { id, title, seq: card.seq } };
}

// drag list
export async function useOnDragEndList(
  draggedId: number,
  draggedSeqNo: number,
  destId: number,
  destSeqNo: number,
  updatedBy: string,
  action: string,
  fkBoardId: string,
  fkpoid: number
): Promise<Resp<any> | null> {
  const boards = load();
  const b = boards.find(x => x.fkboardid === fkBoardId);
  if (!b) return { status: 404, data: null as any };

  // reorder by moving list at draggedSeqNo to destSeqNo
  const fromIdx = b.lists.findIndex(l => l.id === draggedId);
  const toIdx = b.lists.findIndex(l => l.id === destId);
  if (fromIdx === -1 || toIdx === -1) return { status: 400, data: null as any };

  const [moved] = b.lists.splice(fromIdx, 1);
  b.lists.splice(toIdx, 0, moved);
  b.lists.forEach((l, i) => (l.seq = i));

  save(boards);
  return { status: 200, data: true as any };
}

// drag card
export async function useOnDragEndCard(
  sourceListId: number,
  destinationListId: number,
  kanbanCardId: number,
  cardTitle: string,
  updatedBy: string,
  oldSeqNo: number,
  newSeqNo: number,
  fkBoardId: string,
  fkpoid: number
): Promise<Resp<any> | null> {
  const boards = load();
  const b = boards.find(x => x.fkboardid === fkBoardId);
  if (!b) return { status: 404, data: null as any };
  const src = b.lists.find(l => l.id === sourceListId);
  const dst = b.lists.find(l => l.id === destinationListId);
  if (!src || !dst) return { status: 404, data: null as any };

  const idx = src.cards.findIndex(c => c.id === kanbanCardId);
  if (idx === -1) return { status: 404, data: null as any };

  const [card] = src.cards.splice(idx, 1);
  // insert at newSeqNo (bounded)
  const insertAt = Math.max(0, Math.min(newSeqNo, dst.cards.length));
  dst.cards.splice(insertAt, 0, card);

  // reindex seq
  src.cards.forEach((c, i) => (c.seq = i));
  dst.cards.forEach((c, i) => (c.seq = i));

  recomputeProgress(b);
  save(boards);
  return { status: 200, data: true as any };
}

// "EditCard" that accepts FormData-like object, including file (<=5MB)
export async function EditCard(editVM: FormData): Promise<Resp<any> | null> {
  // Expected fields (you used on real API):
  // title, kanbanCardId, updatedby, desc, uploadImage(File), completed(bool),
  // startDate, endDate, fkboardid, listid
  const map = new Map<string, any>();
  editVM.forEach((v, k) => map.set(k, v));

  const fid = String(map.get("fkboardid"));
  const cardId = Number(map.get("kanbanCardId"));
  const listId = Number(map.get("listid"));
  const title = map.get("title") ? String(map.get("title")) : undefined;
  const desc = map.get("desc") ? String(map.get("desc")) : undefined;
  const completed = map.get("completed") != null ? map.get("completed") === "true" || map.get("completed") === true : undefined;
  const file = map.get("uploadImage") as File | null;

  const boards = load();
  const b = boards.find(x => x.fkboardid === fid);
  if (!b) return { status: 404, data: null as any };
  const l = b.lists.find(x => x.id === listId);
  if (!l) return { status: 404, data: null as any };
  const c = l.cards.find(x => x.id === cardId);
  if (!c) return { status: 404, data: null as any };

  if (title !== undefined) c.title = title;
  if (desc !== undefined) c.desc = desc;
  if (completed !== undefined) c.completed = completed;

  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return { status: 413, data: { error: "File too large (max 5MB)" } as any };
    }
    const dataUrl = await fileToDataUrl(file);
    c.imageDataUrl = dataUrl;
  }
  c.updatedAt = new Date().toISOString();

  recomputeProgress(b);
  save(boards);
  return { status: 200, data: { ok: true } as any };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// Meta helpers (optional for your UI)
export async function getShareLink(fkboardid: string) {
  // simple readonly link flag
  return { status: 200, data: `/kanbanList/${fkboardid}?view=public` };
}
export async function closeBoard(fkboardid: string) {
  const boards = load();
  const b = boards.find(x => x.fkboardid === fkboardid);
  if (!b) return { status: 404, data: null as any };
  b.progress = 100;
  b.status = "closed";
  save(boards);
  return { status: 200, data: true as any };
}

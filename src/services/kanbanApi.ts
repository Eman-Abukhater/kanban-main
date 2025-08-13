import { v4 as uuid } from "uuid";

// ---- Members (used for assignees / roles) ----
type Member = { id: number; name: string };
const MEMBERS: Member[] = [
  { id: 205, name: "Osama Ahmed" },
  { id: 301, name: "Abeer F." },
  { id: 302, name: "Badr N." },
  { id: 303, name: "Carim K." },
];

// ---- Data model (local only) ----
type Subtask = {
  id: number;
  title: string;
  assigneeId: number | null;
  completed: boolean;
};

type Card = {
  id: number;
  title: string;
  desc?: string;
  seq: number;                  // position in list
  imageDataUrl?: string | null; // uploaded image (<=5MB) as Data URL
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
};

type List = { id: number; title: string; seq: number; cards: Card[] };

type Board = {
  boardid: number;          // human-friendly
  fkboardid: string;        // GUID in URL
  title: string;
  description?: string;
  members: Member[];
  status: "open" | "closed";
  progress: number;         // 0..100 (computed)
  createdAt: string;
  addedby: string;
  addedbyid: number | null;
  fkpoid: number | null;
  lists: List[];
};

type Resp<T> = { status: number; data: T };
const KEY = "kanban-fake-boards-v3";

// ---- Storage helpers ----
function load(): Board[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);

  // Seed one board with 3 lists and some cards
  const seed: Board[] = [{
    boardid: 1,
    fkboardid: uuid(),
    title: "ESAP ERP – Pilot",
    description: "تحليل و بناء المطبخ",
    members: [MEMBERS[2], MEMBERS[3]],
    status: "open",
    progress: 0,
    createdAt: new Date().toISOString(),
    addedby: "205-Osama Ahmed",
    addedbyid: 205,
    fkpoid: 1001,
    lists: [
      { id: 11, title: "To do",       seq: 0, cards: [] },
      { id: 12, title: "In-Progress", seq: 1, cards: [] },
      { id: 13, title: "Done",        seq: 2, cards: [] },
    ],
  }];

  // Add a few demo cards
  seed[0].lists[0].cards = Array.from({length: 24}).map((_,i)=>({
    id: 1000+i, title: `Backlog #${i+1}`, desc: "", seq: i, imageDataUrl: null,
    subtasks: [
      { id: 1, title: "spec",  assigneeId: 205, completed: i%3===0 },
      { id: 2, title: "review",assigneeId: 301, completed: false },
    ],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }));
  recomputeProgress(seed[0]);
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}
function save(bs: Board[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(bs));
}
function findBoard(fid: string) { return load().find(b => b.fkboardid === fid); }
function nextId(arr: {id:number}[]) { return arr.length ? Math.max(...arr.map(a=>a.id))+1 : 1; }
function recomputeProgress(b: Board) {
  const all = b.lists.flatMap(l => l.cards);
  const total = all.length + all.reduce((acc,c)=>acc + c.subtasks.length, 0);
  const doneCards = all.filter(c => isCardDone(c)).length;
  const doneSubs  = all.reduce((acc,c)=>acc + c.subtasks.filter(s=>s.completed).length, 0);
  const done = doneCards + doneSubs;
  b.progress = total ? Math.round((done/total)*100) : 0;
  b.status = b.progress === 100 ? "closed" : "open";
}
function isCardDone(c: Card) {
  // a card is considered done if ALL subtasks are completed OR it has no subtasks and is placed in a "Done" list
  return c.subtasks.length > 0
    ? c.subtasks.every(s => s.completed)
    : false;
}
async function fileToDataUrl(file: File) {
  return new Promise<string>((res, rej)=>{
    const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ================= API (mirrors your real names) =================

// BOARD LIST (you already have a separate fake for listing; keeping for completeness)
export async function fetchInitialBoards(fkpoid: number): Promise<Resp<Board[]>> {
  const rows = load().filter(r => r.fkpoid === fkpoid || fkpoid == null);
  return { status: 200, data: rows };
}
export async function fetchAllMembers(): Promise<Resp<Member[]>> {
  return { status: 200, data: MEMBERS };
}

// 1) BOARD PAGE DATA
export async function fetchKanbanList(fkboardid: string): Promise<any> {
  const b = findBoard(fkboardid);
  if (!b) return [];
  // shape matches your components: each list has id/title/seq + kanbanCards array
  return b.lists
    .sort((a,b)=>a.seq-b.seq)
    .map(l => ({
      id: l.id,
      title: l.title,
      seq: l.seq,
      kanbanCards: l.cards.sort((a,b)=>a.seq-b.seq).map(c => ({
        id: c.id,
        title: c.title,
        desc: c.desc ?? "",
        imageUrl: c.imageDataUrl ?? null,
        seq: c.seq,
        subtasks: c.subtasks,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    }));
}

// 2) ADD LIST  (max 6 lists)
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
  if (b.lists.length >= 6) return { status: 409, data: { error: "Max lists is 6" } as any };

  const id = nextId(b.lists);
  b.lists.push({ id, title, seq: b.lists.length, cards: [] });
  save(boards);
  return { status: 200, data: { id, title, seq: b.lists.length-1 } };
}

// 3) ADD CARD (initially without image; use EditCard to attach)
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
    id, title, desc: "", seq: l.cards.length,
    imageDataUrl: null, subtasks: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  l.cards.push(card);
  recomputeProgress(b);
  save(boards);
  return { status: 200, data: { id, title, seq: card.seq } };
}

// 4) DRAG LIST
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
  const fromIdx = b.lists.findIndex(l => l.id === draggedId);
  const toIdx   = b.lists.findIndex(l => l.id === destId);
  if (fromIdx === -1 || toIdx === -1) return { status: 400, data: null as any };

  const [moved] = b.lists.splice(fromIdx, 1);
  b.lists.splice(toIdx, 0, moved);
  b.lists.forEach((l,i)=> l.seq = i);

  save(boards);
  return { status: 200, data: true as any };
}

// 5) DRAG CARD (between lists or in same list)
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
  const insertAt = Math.max(0, Math.min(newSeqNo, dst.cards.length));
  dst.cards.splice(insertAt, 0, card);

  src.cards.forEach((c,i)=> c.seq = i);
  dst.cards.forEach((c,i)=> c.seq = i);

  recomputeProgress(b);
  save(boards);
  return { status: 200, data: true as any };
}

// 6) EDIT CARD (title/desc/completed/image ≤ 5MB)
export async function EditCard(editVM: FormData): Promise<Resp<any> | null> {
  const map = new Map<string, any>(); editVM.forEach((v,k)=>map.set(k,v));

  const fid   = String(map.get("fkboardid"));
  const listId= Number(map.get("listid"));
  const cardId= Number(map.get("kanbanCardId"));
  const title = map.get("title") ? String(map.get("title")) : undefined;
  const desc  = map.get("desc")  ? String(map.get("desc"))  : undefined;
  const completed = map.get("completed") != null ? (map.get("completed")==="true"||map.get("completed")===true) : undefined;
  const file  = map.get("uploadImage") as File | null;

  const boards = load();
  const b = boards.find(x => x.fkboardid === fid);
  if (!b) return { status: 404, data: null as any };
  const l = b.lists.find(x => x.id === listId);
  if (!l) return { status: 404, data: null as any };
  const c = l.cards.find(x => x.id === cardId);
  if (!c) return { status: 404, data: null as any };

  if (title !== undefined) c.title = title;
  if (desc  !== undefined) c.desc  = desc;
  if (completed !== undefined) c.subtasks.length ? c.subtasks.forEach(s=>s.completed=completed) : null;

  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return { status: 413, data: { error: "File too large (max 5MB)" } as any };
    }
    c.imageDataUrl = await fileToDataUrl(file);
  }
  c.updatedAt = new Date().toISOString();
  recomputeProgress(b);
  save(boards);
  return { status: 200, data: { ok: true } as any };
}

// 7) SUBTASKS (assignments)
export async function AddTask(
  title: string,
  fkKanbanCardId: number | null,
  addedby: string,
  addedbyid: number | null,
  selectedOptions: string,      // assigneeId as string (keep signature)
  fkboardid: string | null,
  fkpoid: number | null
): Promise<Resp<any> | null> {
  if (!fkboardid || !fkKanbanCardId) return { status: 400, data: null as any };
  const boards = load(); const b = boards.find(x => x.fkboardid === fkboardid);
  if (!b) return { status: 404, data: null as any };
  const l = b.lists.find(L => L.cards.some(c => c.id === fkKanbanCardId));
  if (!l) return { status: 404, data: null as any };
  const c = l.cards.find(C => C.id === fkKanbanCardId)!;

  const id = nextId(c.subtasks);
  const assigneeId = selectedOptions ? Number(selectedOptions) : null;
  c.subtasks.push({ id, title, assigneeId, completed: false });
  c.updatedAt = new Date().toISOString();
  recomputeProgress(b); save(boards);
  return { status: 200, data: { id } as any };
}
export async function DeleteTask(taskid: number): Promise<Resp<any> | null> {
  const boards = load();
  for (const b of boards) {
    for (const l of b.lists) {
      for (const c of l.cards) {
        const i = c.subtasks.findIndex(s => s.id === taskid);
        if (i > -1) {
          c.subtasks.splice(i,1); recomputeProgress(b); save(boards);
          return { status: 200, data: true as any };
        }
      }
    }
  }
  return { status: 404, data: null as any };
}
export async function SubmitTask(submitVM: FormData): Promise<Resp<any> | null> {
  // expects: fkboardid, cardId, taskId, completed
  const m = new Map<string, any>(); submitVM.forEach((v,k)=>m.set(k,v));
  const fid = String(m.get("fkboardid"));
  const cardId = Number(m.get("cardId"));
  const taskId = Number(m.get("taskId"));
  const completed = m.get("completed")==="true"||m.get("completed")===true;

  const boards = load(); const b = boards.find(x => x.fkboardid === fid);
  if (!b) return { status: 404, data: null as any };
  for (const l of b.lists) {
    const c = l.cards.find(cc => cc.id === cardId);
    if (c) {
      const t = c.subtasks.find(s=>s.id===taskId);
      if (!t) return { status: 404, data: null as any };
      t.completed = completed; c.updatedAt = new Date().toISOString();
      recomputeProgress(b); save(boards);
      return { status: 200, data: true as any };
    }
  }
  return { status: 404, data: null as any };
}

// 8) Share (public read-only) & Close
export async function getShareLink(fkboardid: string) {
  return { status: 200, data: `/kanbanList/${fkboardid}?view=public` };
}
export async function closeBoard(fkboardid: string) {
  const boards = load(); const b = boards.find(x => x.fkboardid === fkboardid);
  if (!b) return { status: 404, data: null as any };
  b.progress = 100; b.status = "closed"; save(boards);
  return { status: 200, data: true as any };
}

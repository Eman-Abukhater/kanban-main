import { v4 as uuid } from "uuid";

type BoardRow = {
  boardid: number;          // #id
  fkboardid: string;        // GUID (used in URL)
  title: string;            // project name
  description?: string;
  members: { name: string }[];
  status: "open" | "closed";
  progress: number;         // 0..100 for the bar
  createdAt: string;        // ISO date
  addedby: string;
  addedbyid: number | null;
  fkpoid: number | null;
};

type Resp<T> = { status: number; data: T };

const KEY = "kanban-fake-boardlist-v1";

function load(): BoardRow[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  // seed data
  const seed: BoardRow[] = [
    {
      boardid: 1,
      fkboardid: uuid(),
      title: "ESAP ERP – Pilot",
      description: "تحليل و بناء المطبخ",
      members: [{ name: "AA" }, { name: "BM" }, { name: "CK" }],
      status: "open",
      progress: 48,
      createdAt: new Date().toISOString(),
      addedby: "205-Osama Ahmed",
      addedbyid: 205,
      fkpoid: 1001,
    },
  ];
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}
function save(rows: BoardRow[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(rows));
}

// ========== API (same names you’ll use later with the real backend) ==========
export async function fetchInitialBoards(
  fkpoid: number
): Promise<Resp<BoardRow[]>> {
  const rows = load().filter((r) => r.fkpoid === fkpoid || fkpoid == null);
  return { status: 200, data: rows };
}

export async function AddBoard(
  title: string,
  fkpoid: number | null,
  addedbyid: number | null,
  addedby: string
): Promise<Resp<BoardRow>> {
  const rows = load();
  const row: BoardRow = {
    boardid: rows.length ? Math.max(...rows.map((r) => r.boardid)) + 1 : 1,
    fkboardid: uuid(),
    title,
    description: "",
    members: [],
    status: "open",
    progress: 0,
    createdAt: new Date().toISOString(),
    addedby,
    addedbyid,
    fkpoid,
  };
  const next = [row, ...rows];
  save(next);
  return { status: 200, data: row };
}

export async function EditBoard(
  title: string,
  boardid: number | null,
  updatedby: string
): Promise<Resp<{ boardid: number | null; updatedBy: string }>> {
  const rows = load();
  const idx = rows.findIndex((r) => r.boardid === boardid);
  if (idx >= 0) rows[idx].title = title;
  save(rows);
  return { status: 200, data: { boardid, updatedBy: updatedby } };
}

// OPTIONAL for later table polish
export async function fetchAllMembers(): Promise<Resp<any[]>> {
  return { status: 200, data: [{ user_id: 1, name: "AA" }] };
}

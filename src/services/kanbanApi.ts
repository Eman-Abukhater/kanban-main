import { v4 as uuid } from "uuid";

const FAKE_PROJECTS = [
  { id: 1, name: "ESAP ERP – Pilot" },
  { id: 2, name: "Warehouse Upgrade" },
  { id: 3, name: "Cafe Branch – Najran" },
];

const FAKE_MEMBERS = [
  { id: 205, name: "Osama Ahmed" },
  { id: 301, name: "Abeer F." },
  { id: 302, name: "Badr N." },
  { id: 303, name: "Carim K." },
];

type BoardRow = {
  boardid: number;
  fkboardid: string;
  title: string; // project name
  description?: string;
  members: { id: number; name: string }[];   // ← add id
  status: "open" | "closed";
  progress: number;
  createdAt: string;
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

  // seed data (with member ids)
  const seed: BoardRow[] = [
    {
      boardid: 1,
      fkboardid: uuid(),
      title: "ESAP ERP – Pilot",
      description: "تحليل و بناء المطبخ",
      members: [
        { id: 302, name: "Badr N." },
        { id: 303, name: "Carim K." }
      ],
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

// ------- API -------

export async function fetchInitialBoards(
  fkpoid: number
): Promise<Resp<BoardRow[]>> {
  const rows = load().filter(r => r.fkpoid === fkpoid || fkpoid == null);
  return { status: 200, data: rows };
}

// UPDATED: accept description + memberIds
export async function AddBoard(
  projectName: string,
  fkpoid: number | null,
  addedbyid: number | null,
  addedby: string,
  options?: { description?: string; memberIds?: number[] }
): Promise<Resp<BoardRow>> {
  const rows = load();

  const selectedMembers =
    (options?.memberIds || [])
      .map(id => FAKE_MEMBERS.find(m => m.id === id))
      .filter(Boolean) as { id: number; name: string }[];

  const row: BoardRow = {
    boardid: rows.length ? Math.max(...rows.map(r => r.boardid)) + 1 : 1,
    fkboardid: uuid(),
    title: projectName,
    description: options?.description || "",
    members: selectedMembers,
    status: "open",
    progress: 0,
    createdAt: new Date().toISOString(),
    addedby,
    addedbyid,
    fkpoid,
  };
  save([row, ...rows]);
  return { status: 200, data: row };
}

export async function EditBoard(
  title: string,
  boardid: number | null,
  updatedby: string
): Promise<Resp<{ boardid: number | null; updatedBy: string }>> {
  const rows = load();
  const idx = rows.findIndex(r => r.boardid === boardid);
  if (idx >= 0) rows[idx].title = title;
  save(rows);
  return { status: 200, data: { boardid, updatedBy: updatedby } };
}

export async function DeleteBoard(boardid: number) {
  const rows = load();
  const next = rows.filter(r => r.boardid !== boardid);
  save(next);
  return { status: 200, data: { deleted: boardid } };
}

// UPDATED: return fixed lists
export async function fetchProjects() {
  return { status: 200, data: FAKE_PROJECTS };
}

export async function fetchAllMembers(): Promise<Resp<{ id: number; name: string }[]>> {
  return { status: 200, data: FAKE_MEMBERS };
}

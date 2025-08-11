import { useEffect, useState } from "react";
import { fetchProjects } from "@/services/kanbanApi";
import { ChevronDoubleRightIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

type Props = {
  onSelectProject?: (name: string) => void;
};

export default function CollapsedSidebar({ onSelectProject }: Props) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetchProjects();
      setProjects(res.data);
    })();
  }, []);

  const filtered = projects.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <aside
      className={`sticky top-0 h-[calc(100vh-0px)] shrink-0 border-r bg-white transition-all ${
        open ? "w-64 p-3" : "w-10 p-1"
      }`}
    >
      <button
        className="mb-2 flex h-8 w-8 items-center justify-center rounded-full border hover:bg-gray-50"
        title={open ? "collapse" : "expand"}
        onClick={() => setOpen(o => !o)}
      >
        <ChevronDoubleRightIcon className={`h-4 w-4 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div>
          <div className="mb-1 text-xs font-semibold uppercase">projects</div>
          <div className="mb-2 flex items-center gap-2 rounded border px-2">
            <MagnifyingGlassIcon className="h-4 w-4" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="search"
              className="w-full py-1 text-sm outline-none"
            />
          </div>

          <div className="space-y-1 overflow-auto">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject?.(p.name)}
                className="block w-full rounded px-2 py-2 text-left text-sm hover:bg-gray-50"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

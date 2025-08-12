import { useEffect, useMemo, useState } from "react";

type ColumnKey = "boardid" | "title" | "description" | "createdAt" | "addedby" | "progress";
type Filter = { column: ColumnKey; op: string; value: string };

const COLS: { key: ColumnKey; label: string; type: "number" | "string" | "date" }[] = [
  { key: "boardid", label: "#id", type: "number" },
  { key: "title", label: "project", type: "string" },
  { key: "description", label: "description", type: "string" },
  { key: "progress", label: "status %", type: "number" },
  { key: "createdAt", label: "createdAt", type: "date" },
  { key: "addedby", label: "added by", type: "string" },
];

const OPS = {
  number: ["=", "!=", ">", ">=", "<", "<="],
  string: ["contains", "equals", "startsWith", "endsWith", "!="],
  date: ["is", "before", "after", "onOrBefore", "onOrAfter", "!="],
};

export type FilterToolbarProps = {
  open: boolean;
  onClose: () => void;
  onApply: (filters: Filter[]) => void;
  initial?: Filter[];
};

export default function FilterToolbar({ open, onClose, onApply, initial = [] }: FilterToolbarProps) {
  const [filters, setFilters] = useState<Filter[]>(initial);
  useEffect(() => setFilters(initial), [initial]);

  const addRow = () => setFilters((prev) => [...prev, { column: "title", op: "contains", value: "" }]);
  const removeRow = (idx: number) => setFilters((prev) => prev.filter((_, i) => i !== idx));
  const setRow = (idx: number, patch: Partial<Filter>) =>
    setFilters((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));

  const rows = useMemo(() => filters, [filters]);
  if (!open) return null;

  return (
    <div className="sticky top-0 z-20 mb-3 rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Minimal header: title + close */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <div className="text-sm font-semibold text-gray-800">Filters</div>
        <button onClick={onClose} className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-50">
          ✕
        </button>
      </div>

      <div className="space-y-2 p-3">
        {rows.length === 0 && (
          <div className="text-xs text-gray-500">No filters. Click “Add filter”.</div>
        )}

        {rows.map((row, idx) => {
          const colMeta = COLS.find((c) => c.key === row.column)!;
          const ops = OPS[colMeta.type];

          return (
            <div key={idx} className="flex items-center gap-2">
              {/* column */}
              <select
                value={row.column}
                onChange={(e) => {
                  const nextCol = e.target.value as ColumnKey;
                  const meta = COLS.find((c) => c.key === nextCol)!;
                  setRow(idx, { column: nextCol, op: OPS[meta.type][0], value: "" });
                }}
                className="w-44 rounded border border-gray-300 px-2 py-1 text-sm text-gray-800"
              >
                {COLS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* operator */}
              <select
                value={row.op}
                onChange={(e) => setRow(idx, { op: e.target.value })}
                className="w-36 rounded border border-gray-300 px-2 py-1 text-sm text-gray-800"
              >
                {ops.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              {/* value */}
              {colMeta.type === "date" ? (
                <input
                  type="date"
                  value={row.value}
                  onChange={(e) => setRow(idx, { value: e.target.value })}
                  className="w-56 rounded border border-gray-300 px-2 py-1 text-sm text-gray-800"
                />
              ) : (
                <input
                  value={row.value}
                  onChange={(e) => setRow(idx, { value: e.target.value })}
                  placeholder="Filter value"
                  className="w-56 rounded border border-gray-300 px-2 py-1 text-sm text-gray-800"
                />
              )}

              <button
                onClick={() => removeRow(idx)}
                className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                title="Remove"
              >
                ✕
              </button>
            </div>
          );
        })}

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={addRow}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-800 hover:bg-gray-50"
          >
            + Add filter
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters([])}
              className="rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={() => onApply(filters)}
              className="rounded bg-black px-3 py-1 text-xs font-medium text-white hover:opacity-90"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

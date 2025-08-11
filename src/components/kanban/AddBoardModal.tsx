import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string }) => Promise<void> | void;
};

export default function AddBoardModal({ open, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <h3 className="mb-3 text-lg font-semibold">Add Board</h3>

        <label className="mb-1 block text-xs font-medium">project</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project name"
          className="mb-4 w-full rounded border px-3 py-2 outline-none focus:ring"
        />

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!title.trim()) return;
              await onSubmit({ title: title.trim() });
              setTitle("");
              onClose();
            }}
            className="rounded bg-black px-3 py-2 text-sm text-white hover:opacity-90"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

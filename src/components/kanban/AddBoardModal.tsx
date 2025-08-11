import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { fetchProjects, fetchAllMembers } from "@/services/kanbanApi";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    projectName: string;
    description?: string;
    memberIds: number[];
  }) => Promise<void> | void;
};

export default function AddBoardModal({ open, onClose, onSubmit }: Props) {
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [members, setMembers] = useState<Array<{ id: number; name: string }>>(
    []
  );

  const [project, setProject] = useState<{ value: number; label: string } | null>(null);
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Array<{ value: number; label: string }>>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const p = await fetchProjects();
      const m = await fetchAllMembers();
      setProjects(p.data);
      setMembers(m.data);
    })();
  }, [open]);

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects]
  );

  const memberOptions = useMemo(
    () => members.map((m) => ({ value: m.id, label: m.name })),
    [members]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">Add Board</h3>

        {/* project (dropdown list) */}
        <label className="mb-1 block text-xs font-semibold uppercase">project</label>
        <Select
          className="mb-4 text-sm"
          options={projectOptions}
          value={project}
          onChange={(opt) => setProject(opt as any)}
          placeholder="dropdown list"
        />

        {/* description */}
        <label className="mb-1 block text-xs font-semibold uppercase">description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder=""
          className="mb-4 w-full rounded border px-3 py-2 text-sm outline-none focus:ring"
        />

        {/* members (multi select) */}
        <label className="mb-1 block text-xs font-semibold uppercase">members</label>
        <Select
          isMulti
          className="mb-4 text-sm"
          options={memberOptions}
          value={selectedMembers}
          onChange={(opts) => setSelectedMembers((opts || []) as any)}
          placeholder="multi select"
        />

        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!project) return;
              await onSubmit({
                projectName: project.label,
                description: description.trim(),
                memberIds: selectedMembers.map((m) => m.value),
              });
              setProject(null);
              setDescription("");
              setSelectedMembers([]);
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

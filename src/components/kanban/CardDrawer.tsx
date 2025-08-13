import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type Task = {
  task_id: string;
  task_name: string;
  status: "todo" | "done";
  assigneeId?: number;
};

export type DrawerCard = {
  card_id: string;
  list_id: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  tasks?: Task[];
  // optional date range if your real API supports
  startDate?: string | null;
  endDate?: string | null;
};

type Member = { id: number; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  card: DrawerCard | null;
  members: Member[];
  readOnly: boolean;
  isAdmin: boolean;
  currentUserId: number;

  // service fns already available on your page
  EditCard: (fd: FormData) => Promise<any>;
  AddTask: (
    title: string,
    fkKanbanCardId: number | string,
    addedby: string,
    addedbyid: number | null,
    selectedOptions: string,
    fkboardid: number | string,
    fkpoid?: number | string
  ) => Promise<any>;
  SubmitTask: (fd: FormData) => Promise<any>;
  DeleteTask: (taskId: number | string) => Promise<any>;

  // needed context pieces from page
  fkboardid: string;
};

export default function CardDrawer({
  open,
  onClose,
  card,
  members,
  readOnly,
  isAdmin,
  currentUserId,
  EditCard,
  AddTask,
  SubmitTask,
  DeleteTask,
  fkboardid,
}: Props) {
  const [title, setTitle] = useState(card?.title || "");
  const [desc, setDesc] = useState(card?.description || "");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    setTitle(card?.title || "");
    setDesc(card?.description || "");
    setStartDate(card?.startDate ?? null);
    setEndDate(card?.endDate ?? null);
  }, [card]);

  const canEditThisCard =
    !!card &&
    (isAdmin ||
      (card.tasks || []).some((t) => t.assigneeId === currentUserId));

  const saveBasics = async () => {
    if (!card) return;
    if (readOnly || !canEditThisCard) return;
    try {
      const fd = new FormData();
      fd.append("fkboardid", fkboardid);
      fd.append("listid", card.list_id);
      fd.append("kanbanCardId", card.card_id);
      fd.append("title", title);
      fd.append("desc", desc);
      if (startDate) fd.append("startDate", startDate);
      if (endDate) fd.append("endDate", endDate);
      await EditCard(fd);
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    }
  };

  const uploadImage = async (file: File) => {
    if (!card) return;
    if (readOnly || !canEditThisCard) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("fkboardid", fkboardid);
      fd.append("listid", card.list_id);
      fd.append("kanbanCardId", card.card_id);
      fd.append("uploadImage", file);
      const res = await EditCard(fd);
      if (res?.status === 413) {
        toast.error("File too large (max 5MB)");
        return;
      }
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    }
  };

  const addSubtask = async () => {
    if (!card) return;
    if (readOnly || !canEditThisCard) return;
    const taskName = prompt("Subtask name", "New task");
    if (!taskName) return;
    const assignee =
      prompt(
        `Assignee ID\n${members.map((m) => `${m.id} = ${m.name}`).join("\n")}`,
        String(currentUserId)
      ) || String(currentUserId);
    try {
      await AddTask(
        taskName,
        card.card_id,
        "User",
        currentUserId,
        assignee,
        fkboardid
      );
      toast.success("Task added");
    } catch {
      toast.error("Add task failed");
    }
  };

  const toggleTask = async (t: Task) => {
    if (!card) return;
    const canToggle = isAdmin || t.assigneeId === currentUserId;
    if (!canToggle || readOnly) return;
    try {
      const fd = new FormData();
      fd.append("fkboardid", fkboardid);
      fd.append("cardId", card.card_id);
      fd.append("taskId", t.task_id);
      fd.append("completed", String(t.status !== "done"));
      await SubmitTask(fd);
    } catch {
      toast.error("Update task failed");
    }
  };

  const deleteTask = async (t: Task) => {
    const canDel = isAdmin || t.assigneeId === currentUserId;
    if (!canDel || readOnly) return;
    try {
      await DeleteTask(t.task_id);
    } catch {
      toast.error("Delete task failed");
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[360px] transform border-l bg-white shadow-xl transition-transform ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ zIndex: 60 }}
      aria-hidden={!open}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={readOnly || !canEditThisCard}
          className="w-full rounded border px-2 py-1 text-sm outline-none focus:ring"
        />
        <button
          onClick={onClose}
          className="ml-2 rounded border px-2 py-1 text-xs hover:bg-gray-50"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto p-4">
        {/* Date range */}
        <div>
          <div className="mb-1 text-xs font-medium text-gray-600">Date</div>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate ?? ""}
              onChange={(e) => setStartDate(e.target.value || null)}
              disabled={readOnly || !canEditThisCard}
              className="w-1/2 rounded border px-2 py-1 text-sm"
            />
            <input
              type="date"
              value={endDate ?? ""}
              onChange={(e) => setEndDate(e.target.value || null)}
              disabled={readOnly || !canEditThisCard}
              className="w-1/2 rounded border px-2 py-1 text-sm"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="mb-1 text-xs font-medium text-gray-600">
            Description
          </div>
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={readOnly || !canEditThisCard}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>

        {/* Image */}
        <div>
          <div className="mb-1 text-xs font-medium text-gray-600">Image</div>
          {card?.imageUrl ? (
            <img src={card.imageUrl} className="mb-2 w-full rounded" alt="" />
          ) : null}
          {!readOnly && canEditThisCard && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadImage(f);
              }}
              className="text-xs"
            />
          )}
        </div>

        {/* Tags (scaffold; wire to AddTag/DeleteTag when ready) */}
        <div>
          <div className="mb-1 text-xs font-medium text-gray-600">Tag</div>
          <div className="flex items-center gap-2">
            <input
              placeholder="(optional) add tag via backend later"
              className="w-full rounded border px-2 py-1 text-sm"
              disabled
            />
            <button
              className="rounded border px-2 py-1 text-xs opacity-40"
              title="Connect to AddTag/DeleteTag later"
              disabled
            >
              +
            </button>
          </div>
        </div>

        {/* Tasks */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium text-gray-600">Tasks</div>
            {!readOnly && canEditThisCard && (
              <button
                onClick={addSubtask}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
              >
                + Add task
              </button>
            )}
          </div>

          {card?.tasks && card.tasks.length > 0 ? (
            <div className="space-y-2">
              {card.tasks.map((t) => {
                const assigneeName =
                  members.find((m) => m.id === t.assigneeId)?.name ||
                  "Unassigned";
                const canToggle = isAdmin || t.assigneeId === currentUserId;
                return (
                  <div
                    key={t.task_id}
                    className="flex items-center justify-between rounded border px-2 py-1"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={t.status === "done"}
                        onChange={() => toggleTask(t)}
                        disabled={readOnly || !canToggle}
                      />
                      <span>{t.task_name}</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-500">
                        {assigneeName}
                      </span>
                      {canToggle && !readOnly && (
                        <button
                          onClick={() => deleteTask(t)}
                          className="text-[11px] text-red-600 hover:underline"
                        >
                          delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-500">No tasks</div>
          )}
        </div>

        {/* Save */}
        {!readOnly && canEditThisCard && (
          <div className="pt-2">
            <button
              onClick={saveBasics}
              className="w-full rounded border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Save changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

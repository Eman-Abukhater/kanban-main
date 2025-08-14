import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type Member = { id: number; name: string };
type Task = {
  task_id: string;
  task_name: string;
  status: "todo" | "done";
  assigneeId?: number;
};
type Tag = { id: string | number; title: string; color?: string };

export type DrawerCard = {
  card_id: string;
  list_id: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  tasks?: Task[];
  startDate?: string | null;
  endDate?: string | null;
  tags?: Tag[];
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  card: DrawerCard | null;             // edit mode
  listIdForCreate: string | null;      // create mode
  onClose: () => void;

  onCreate: (payload: {
    title: string;
    description?: string;
    startDate?: string | null;
    endDate?: string | null;
    imageFile?: File | null;
    tags?: { title: string; color?: string }[];
    tasks?: { task_name: string; assigneeId?: number }[];
  }) => Promise<void>;

  onSaved: () => Promise<void>;
  onDelete: (cardId: string, listId: string) => Promise<void>;

  members: Member[];
  readOnly: boolean;
  isAdmin: boolean;
  currentUserId: number;

  // services
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
  AddTag?: (
    title: string,
    color: string,
    fkKanbanCardId: number | string,
    addedby: string,
    addedbyid: number | null
  ) => Promise<any>;
  DeleteTag?: (tagid: number | string) => Promise<any>;

  fkboardid: string;
  fkpoid?: number | string;
  addedbyName?: string;
  addedbyId?: number | null;

  // NEW: lets the board update the card cover immediately
  onLocalCoverPreview?: (p: { cardId?: string; listId?: string; dataUrl: string }) => void;
};

export default function CardDrawer(props: Props) {
  const {
    open,
    mode,
    card,
    listIdForCreate,
    onClose,
    onCreate,
    onSaved,
    onDelete,
    members,
    readOnly,
    isAdmin,
    currentUserId,
    EditCard,
    AddTask,
    SubmitTask,
    DeleteTask,
    AddTag,
    DeleteTag,
    fkboardid,
    fkpoid = 1001,
    addedbyName = "User",
    addedbyId = currentUserId,
    onLocalCoverPreview, // NEW
  } = props;

  // ----- form fields -----
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // tags
  const [localTags, setLocalTags] = useState<{ title: string; color?: string }[]>([]);
  const [newTagTitle, setNewTagTitle] = useState("");
  const [newTagColor, setNewTagColor] = useState("#2563eb");

  // tasks
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<number | "">("");
  const [localCreateTasks, setLocalCreateTasks] = useState<
    { task_name: string; assigneeId?: number }[]
  >([]);

  // comments (local)
  const [comments, setComments] = useState<
    { id: string; author: string; text: string; ts: number }[]
  >([]);
  const [newComment, setNewComment] = useState("");

  const allowEdit =
    mode === "create"
      ? true
      : !!card &&
        !readOnly &&
        (isAdmin ||
          (card.tasks || []).some((t) => t.assigneeId === currentUserId));

  // load on open
  useEffect(() => {
    if (mode === "edit" && card) {
      setTitle(card.title || "");
      setDesc(card.description || "");
      setStartDate(card.startDate ?? null);
      setEndDate(card.endDate ?? null);
      setImageFile(null);
      setImagePreview(card.imageUrl ?? null);
      setLocalTags([]);
      setLocalCreateTasks([]);
      loadComments(card.card_id);
    } else {
      // create
      setTitle("");
      setDesc("");
      setStartDate(null);
      setEndDate(null);
      setImageFile(null);
      setImagePreview(null);
      setLocalTags([]);
      setNewTagTitle("");
      setNewTagColor("#2563eb");
      setLocalCreateTasks([]);
      setComments([]);
      setNewComment("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, card, open]);

  // comments storage
  function commentsKey(cardId: string) {
    return `kanban-comments-${fkboardid}-${cardId}`;
  }
  function loadComments(cardId: string) {
    try {
      const raw = localStorage.getItem(commentsKey(cardId));
      setComments(raw ? JSON.parse(raw) : []);
    } catch {
      setComments([]);
    }
  }
  function saveComments(cardId: string, arr: any[]) {
    localStorage.setItem(commentsKey(cardId), JSON.stringify(arr));
  }

  const memberOptions = useMemo(
    () => members.map((m) => ({ value: m.id, label: m.name })),
    [members]
  );

  // image preview (instant) + notify board
  function handleImageChoose(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }
    setImageFile(file);
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = String(r.result);
      setImagePreview(dataUrl);
      // notify parent so the card on the board updates immediately
      onLocalCoverPreview?.({
        cardId: card?.card_id,
        listId: card?.list_id,
        dataUrl,
      });
    };
    r.readAsDataURL(file);
  }

  // ----- CREATE -----
  async function handleCreateSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!listIdForCreate) return;
    try {
      await onCreate({
        title: title.trim(),
        description: desc.trim(),
        startDate,
        endDate,
        imageFile,
        tags: localTags,
        tasks: localCreateTasks,
      });
    } catch {}
  }

  // ----- EDIT Save -----
  async function handleEditSave() {
    if (!card || !allowEdit) return;
    try {
      const fd = new FormData();
      fd.append("fkboardid", fkboardid);
      fd.append("listid", card.list_id);
      fd.append("kanbanCardId", card.card_id);
      fd.append("title", title);
      fd.append("desc", desc);
      if (startDate) fd.append("startDate", startDate);
      if (endDate) fd.append("endDate", endDate);
      if (imageFile) fd.append("uploadImage", imageFile);
      const res = await EditCard(fd);
      if (res?.status === 413) {
        toast.error("Image too large (max 5MB)");
        return;
      }
      toast.success("Saved");
      await onSaved();
    } catch {
      toast.error("Save failed");
    }
  }

  // Tasks — EDIT
  async function addSubtask() {
    if (!card || !allowEdit) return;
    if (!newTaskName.trim()) {
      toast.error("Task name required");
      return;
    }
    const assigneeId =
      newTaskAssignee === "" ? currentUserId : Number(newTaskAssignee);
    try {
      await AddTask(
        newTaskName.trim(),
        card.card_id,
        addedbyName || "User",
        addedbyId ?? null,
        String(assigneeId),
        fkboardid,
        fkpoid
      );
      setNewTaskName("");
      setNewTaskAssignee("");
      toast.success("Task added");
      await onSaved();
    } catch {
      toast.error("Add task failed");
    }
  }
  async function toggleTask(t: Task) {
    if (!card) return;
    const canToggle = isAdmin || t.assigneeId === currentUserId;
    if (!canToggle) return;
    try {
      const fd = new FormData();
      fd.append("fkboardid", fkboardid);
      fd.append("cardId", card.card_id);
      fd.append("taskId", t.task_id);
      fd.append("completed", String(t.status !== "done"));
      await SubmitTask(fd);
      await onSaved();
    } catch {
      toast.error("Update task failed");
    }
  }
  async function deleteTask(t: Task) {
    const canDel = isAdmin || t.assigneeId === currentUserId;
    if (!canDel) return;
    try {
      await DeleteTask(t.task_id);
      await onSaved();
    } catch {
      toast.error("Delete task failed");
    }
  }

  // Tasks — CREATE (local list)
  function addCreateTask() {
    if (!newTaskName.trim()) {
      toast.error("Task name required");
      return;
    }
    const assigneeId =
      newTaskAssignee === "" ? undefined : Number(newTaskAssignee);
    setLocalCreateTasks((prev) => [
      ...prev,
      { task_name: newTaskName.trim(), assigneeId },
    ]);
    setNewTaskName("");
    setNewTaskAssignee("");
  }
  function removeCreateTask(idx: number) {
    setLocalCreateTasks((prev) => prev.filter((_, i) => i !== idx));
  }

  // Tags
  function addLocalTag() {
    if (!newTagTitle.trim()) {
      toast.error("Tag title required");
      return;
    }
    setLocalTags((prev) => [
      ...prev,
      { title: newTagTitle.trim(), color: newTagColor },
    ]);
    setNewTagTitle("");
  }
  async function addTagEditMode() {
    if (!card || !AddTag) return;
    if (!newTagTitle.trim()) {
      toast.error("Tag title required");
      return;
    }
    try {
      await AddTag(
        newTagTitle.trim(),
        newTagColor,
        card.card_id,
        addedbyName || "User",
        addedbyId ?? null
      );
      setNewTagTitle("");
      toast.success("Tag added");
      await onSaved();
    } catch {
      toast.error("Add tag failed");
    }
  }
  async function removeTagEditMode(tagId: string | number) {
    if (!card || !DeleteTag) return;
    try {
      await DeleteTag(tagId);
      toast.success("Tag removed");
      await onSaved();
    } catch {
      toast.error("Remove tag failed");
    }
  }

  // Comments (local)
  function addComment() {
    const author =
      (typeof window !== "undefined" &&
        (sessionStorage.getItem("userName") || "Anonymous")) ||
      "Anonymous";
    const text = newComment.trim();
    if (!card || !text) return;
    const c = { id: crypto.randomUUID(), author, text, ts: Date.now() };
    const next = [c, ...comments];
    setComments(next);
    saveComments(card.card_id, next);
    setNewComment("");
  }


  return (
    <div
      className={`fixed top-0 right-0 h-full w-[400px] transform border-l bg-white shadow-xl transition-transform ${
        open ? "translate-x-0" : "translate-x-full"
      } flex flex-col`}   // <-- make drawer a column so middle can scroll
      style={{ zIndex: 60 }}
      aria-hidden={!open}
    >
      {/* Header (fixed) */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!allowEdit}
          placeholder={mode === "create" ? "Card title" : undefined}
          className="w-full rounded border px-2 py-1 text-sm outline-none focus:ring"
        />
        <button
          onClick={onClose}
          className="ml-2 rounded border px-2 py-1 text-xs hover:bg-gray-50"
        >
          ✕
        </button>
      </div>

      {/* Content (scrolls) */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Date range */}
        <div>
          <div className="mb-1 text-xs font-medium text-gray-600">Date</div>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate ?? ""}
              onChange={(e) => setStartDate(e.target.value || null)}
              disabled={!allowEdit}
              className="w-1/2 rounded border px-2 py-1 text-sm"
            />
            <input
              type="date"
              value={endDate ?? ""}
              onChange={(e) => setEndDate(e.target.value || null)}
              disabled={!allowEdit}
              className="w-1/2 rounded border px-2 py-1 text-sm"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="mb-1 text-xs font-medium text-gray-600">Description</div>
          <textarea
            rows={4}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={!allowEdit}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>

        {/* Image */}
        <div>
          <div className="mb-1 text-xs font-medium text-gray-600">Image</div>
          {imagePreview ? (
            <img
              src={imagePreview}
              className="mb-2 w-full rounded object-cover"
              style={{ maxHeight: 180 }}
              alt=""
            />
          ) : null}
          {allowEdit && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChoose(e.target.files?.[0])}
              className="text-xs"
            />
          )}
          <div className="mt-1 text-[11px] text-gray-500">
            Max size 5MB. JPG/PNG recommended.
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="mb-1 text-xs font-medium text-gray-600">Tags</div>

          {mode === "edit" && card?.tags && card.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {card.tags.map((t) => (
                <span
                  key={String(t.id)}
                  className="inline-flex items-center gap-1 rounded px-2 py-[2px] text-[11px]"
                  style={{ background: t.color ?? "#e5e7eb" }}
                >
                  {t.title}
                  {DeleteTag && allowEdit && (
                    <button
                      onClick={() => removeTagEditMode(t.id)}
                      className="ml-1 text-[11px] text-gray-700"
                      title="Remove tag"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              value={newTagTitle}
              onChange={(e) => setNewTagTitle(e.target.value)}
              placeholder="Tag name"
              disabled={!allowEdit}
              className="w-full rounded border px-2 py-1 text-sm"
            />
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              disabled={!allowEdit}
              className="h-8 w-10 cursor-pointer rounded border"
              title="Tag color"
            />
            {mode === "create" ? (
              <button
                onClick={addLocalTag}
                disabled={!allowEdit}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
              >
                Add
              </button>
            ) : (
              <button
                onClick={addTagEditMode}
                disabled={!allowEdit || !AddTag}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
              >
                Add
              </button>
            )}
          </div>

          {mode === "create" && localTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {localTags.map((t, i) => (
                <span
                  key={`${t.title}-${i}`}
                  className="rounded px-2 py-[2px] text-[11px]"
                  style={{ background: t.color ?? "#e5e7eb" }}
                >
                  {t.title}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        {mode === "edit" ? (
          <div>
            <div className="mb-2 text-xs font-medium text-gray-600">Tasks</div>

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
                          disabled={!canToggle}
                        />
                        <span>{t.task_name}</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-500">
                          {assigneeName}
                        </span>
                        {canToggle && (
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

            {allowEdit && (
              <div className="mt-3 rounded border p-2">
                <div className="mb-1 text-xs font-medium">Add task</div>
                <div className="flex items-center gap-2">
                  <input
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Task name"
                    className="w-full rounded border px-2 py-1 text-sm"
                  />
                  <select
                    value={newTaskAssignee}
                    onChange={(e) =>
                      setNewTaskAssignee(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="rounded border px-2 py-1 text-sm"
                    title="Assign to"
                  >
                    <option value="">Assign…</option>
                    {memberOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addSubtask}
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // CREATE MODE tasks
          <div>
            <div className="mb-2 text-xs font-medium text-gray-600">Tasks</div>

            {localCreateTasks.length > 0 ? (
              <div className="space-y-2">
                {localCreateTasks.map((t, i) => {
                  const assigneeName =
                    t.assigneeId != null
                      ? members.find((m) => m.id === t.assigneeId)?.name || "Unassigned"
                      : "Unassigned";
                  return (
                    <div
                      key={`${t.task_name}-${i}`}
                      className="flex items-center justify-between rounded border px-2 py-1"
                    >
                      <div className="text-sm">{t.task_name}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-500">
                          {assigneeName}
                        </span>
                        <button
                          onClick={() => removeCreateTask(i)}
                          className="text-[11px] text-red-600 hover:underline"
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-gray-500">No tasks</div>
            )}

            <div className="mt-3 rounded border p-2">
              <div className="mb-1 text-xs font-medium">Add task</div>
              <div className="flex items-center gap-2">
                <input
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Task name"
                  className="w-full rounded border px-2 py-1 text-sm"
                />
                <select
                  value={newTaskAssignee}
                  onChange={(e) =>
                    setNewTaskAssignee(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="rounded border px-2 py-1 text-sm"
                  title="Assign to"
                >
                  <option value="">Assign…</option>
                  {memberOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addCreateTask}
                  className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments (anonymous, local) */}
        {mode === "edit" && card && (
          <div>
            <div className="mb-2 text-xs font-medium text-gray-600">Comments</div>

            <div className="space-y-2">
              {comments.length === 0 ? (
                <div className="text-xs text-gray-500">No comments yet</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded border p-2">
                    <div className="mb-1 text-[11px] text-gray-500">
                      {c.author} • {new Date(c.ts).toLocaleString()}
                    </div>
                    <div className="text-sm">{c.text}</div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment…"
                className="w-full rounded border px-2 py-1 text-sm"
              />
              <button
                onClick={addComment}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
              >
                Post
              </button>
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              Posts are stored locally and allow anonymous users.
            </div>
          </div>
        )}
      </div>

      {/* Footer (fixed) */}
      <div className="border-t p-3">
        {mode === "create" ? (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSave}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            {card ? (
              <button
                onClick={() => onDelete(card.card_id, card.list_id)}
                className="rounded border px-3 py-1 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={!allowEdit}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

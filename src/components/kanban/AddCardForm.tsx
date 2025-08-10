import { AddCard } from "@/services/kanbanApi";
import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export interface IAddFormProps {
  text: string;
  placeholder: string;
  onSubmit: (
    name: string,
    kanbanCardId: number,
    seqNo: number,
    fkKanbanListId: number
  ) => void;
  userInfo: any;
  fkKanbanListId: number;
}

export function AddCardForm(props: IAddFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowForm(false);
        setName("");
      }
    };
    formRef.current?.addEventListener("keydown", handleKeyDown);
    return () => {
      formRef.current?.removeEventListener("keydown", handleKeyDown);
    };
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (name) {
      setShowForm(false);
      //add new list in db
      const customResponse = await AddCard(
        name,
        props.fkKanbanListId,
        props.userInfo.username,
        props.userInfo.userid,
        props.userInfo.fkboardid,
        props.userInfo.fkpoid,
      );

      if (customResponse?.status === 200) {
        props.onSubmit(
          name,
          customResponse?.data.kanbanCardId,
          customResponse?.data.seqNo,
          props.fkKanbanListId
        );
        toast.success(
          `Card ID: ${customResponse?.data.kanbanCardId} Created Successfully`,
          {
            position: toast.POSITION.TOP_CENTER,
          }
        );
      }

      if (customResponse?.status != 200 || customResponse?.data == null) {
        toast.error(
          `something went wrong could not add the Card, please try again later` +
            customResponse,
          {
            position: toast.POSITION.TOP_CENTER,
          }
        );
      }

      setName("");
    } else return;
    setShowForm(false);
  };

  return (
    <div>
      {showForm ? (
        <form
          ref={formRef}
          autoComplete="off"
          onSubmit={handleSubmit}
          onBlur={() => {
            if (name) return;
            setShowForm(false);
          }}
        >
          <div className="w-64 appearance-none rounded-lg border border-slate-300 bg-slate-200 p-3   dark:border-slate-700 dark:bg-slate-900">
            <input
              className="w-full rounded-lg dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
              placeholder={props.placeholder}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <div className="mt-4 flex items-center justify-between">
              <button className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-sm text-white transition-colors duration-150 ease-in-out hover:bg-emerald-500">
                <CheckIcon className="h-5 w-5" />
                Add
              </button>
              <button
                onClick={() => {
                  setName("");
                  setShowForm(false);
                }}
                className="rounded-md p-2 text-red-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="flex min-w-[256px] items-center justify-center gap-1 rounded-lg border border-slate-300 bg-slate-200 px-3 py-2 text-sm font-semibold transition-colors duration-200 focus:border-none focus:border-indigo-600 focus:outline-none focus:ring focus:ring-indigo-600 hover:border-indigo-600 hover:bg-indigo-100/50 dark:border-slate-500 dark:bg-slate-600 dark:text-white dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20"
        >
          <PlusIcon className="h-4 w-5" />
          {props.text}
        </button>
      )}
    </div>
  );
}

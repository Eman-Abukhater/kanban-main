import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { KanbanTask } from "./KanbanTypes";

export interface IAddFormProps {
  taskInfo: KanbanTask | undefined;
  onSubmit: (
    kanbanTaskId: number,
    completed: boolean,
    file: File | null
  ) => void;
  index: number | undefined;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
}

export function DetailsTaskForm(props: IAddFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState<string>("");
  //const [showForm, setShowForm] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        props.setShowForm(false);
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
      //  props.onSubmit(name);
      setName("");
    } else return;
    props.setShowForm(false);
  };

  return (
    <>
      <div>
        {props.showForm && (
          <form
            ref={formRef}
            autoComplete="off"
            onSubmit={handleSubmit}
            // onBlur={() => {
            //   if (name) return;
            //   setShowForm(false);
            // }}
          >
            <div className="w-64 appearance-none rounded-lg border border-slate-300 bg-slate-200 p-3   dark:border-slate-700 dark:bg-slate-900">
              {/* <input
                className="w-full rounded-lg dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                placeholder={''}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                //autoFocus
                maxLength={50}
                minLength={5}
              /> */}
              <div className="mt-4 flex items-center justify-between"></div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-sm text-white transition-colors duration-150 ease-in-out hover:bg-emerald-500"
                  type="submit"
                >
                  <CheckIcon className="h-5 w-5" />
                  Submit Task
                </button>
                <button
                  onClick={() => {
                    setName("");
                    props.setShowForm(false);
                  }}
                  className="rounded-md p-2 text-red-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </form>
        ) }
      </div>
    </>
  );
}

import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import chroma from "chroma-js";
//import { ColourOption, } from "../data";
import { MultiValue, StylesConfig } from "react-select";
import CreatableSelect from "react-select/creatable";
import { fetchAllMembers, AddTask } from "@/services/kanbanApi";

export interface IAddFormProps {
  text: string;
  placeholder: string;
  onSubmit: (name: string, handleCreateTask: any[]) => void;
  userInfo: any;
}

interface Option {
  value: string;
  label: string;
}

interface ColourOption {
  readonly value: string;
  readonly label: string;
  readonly color: string;
  readonly isFixed?: boolean;
  readonly isDisabled?: boolean;
  readonly __isNew__?: boolean;
}
export function AddTaskForm(props: IAddFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(false);

  const [fetchedOptions, setfetchedOptions] = useState<any[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<any[]>([]);

  const handleOnChange = (option: any, actionMeta: any) => {
    setSelectedOptions(option);
  };

  useEffect(() => {
    async function fetchData() {
      const customResponse = await fetchAllMembers();

      if (customResponse?.status === 200) {
        setfetchedOptions(customResponse.data);
      }

      if (customResponse?.status != 200 || customResponse?.data == null) {
        toast.error(`something went wrong could not get the users list`, {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    }
    fetchData();
  }, []);

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
    if (name && selectedOptions.length > 0) {
      props.onSubmit(name, selectedOptions);
      setName("");
    } else return;
    setShowForm(false);
  };

  const colourOptions: readonly ColourOption[] = [
    { value: "ocean", label: "Ocean", color: "#00B8D9", isFixed: true },
    { value: "blue", label: "Blue", color: "#0052CC", isDisabled: true },
    { value: "purple", label: "Purple", color: "#5243AA" },
    { value: "red", label: "Red", color: "#FF5630", isFixed: true },
    { value: "orange", label: "Orange", color: "#FF8B00" },
    { value: "yellow", label: "Yellow", color: "#FFC400" },
    { value: "green", label: "Green", color: "#36B37E" },
    { value: "forest", label: "Forest", color: "#00875A" },
    { value: "slate", label: "Slate", color: "#253858" },
    { value: "silver", label: "Silver", color: "#666666" },
  ];

  //const [colourOptions, setcolourOptions] = useState<any>(options);
  //selectList
  const colourStyles: StylesConfig<ColourOption, true> = {
    control: (styles) => ({ ...styles, backgroundColor: "white" }),
    option: (styles, { data, isDisabled, isFocused, isSelected }) => {
      let colorstr = "";
      if (data.__isNew__) {
        colorstr = "#0052CC";
      } else {
        colorstr = data?.color;
      }

      const color = chroma(colorstr);
      return {
        ...styles,
        backgroundColor: isDisabled
          ? undefined
          : isSelected
          ? data.color
          : isFocused
          ? color.alpha(0.1).css()
          : undefined,
        color: isDisabled
          ? "#ccc"
          : isSelected
          ? chroma.contrast(color, "white") > 2
            ? "white"
            : "black"
          : data.color,
        cursor: isDisabled ? "not-allowed" : "default",

        ":active": {
          ...styles[":active"],
          backgroundColor: !isDisabled
            ? isSelected
              ? data.color
              : color.alpha(0.3).css()
            : undefined,
        },
      };
    },
    multiValue: (styles, { data }) => {
      let colorstr2 = "";
      if (data.__isNew__) {
        colorstr2 = "#0052CC";
      } else {
        colorstr2 = data?.color;
      }

      const color = chroma(colorstr2);
      return {
        ...styles,
        backgroundColor: color.alpha(0.1).css(),
      };
    },
    multiValueLabel: (styles, { data }) => ({
      ...styles,
      color: data.color,
    }),
    multiValueRemove: (styles, { data }) => ({
      ...styles,
      color: data.color,
      ":hover": {
        backgroundColor: data.color,
        color: "white",
      },
    }),
  };

  return (
    <>
      <div>
        {showForm ? (
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
              <input
                className="w-full rounded-lg dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                placeholder={props.placeholder}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                //autoFocus
                maxLength={50}
                minLength={5}
              />
              <div className="mt-4 flex items-center justify-between">
                <CreatableSelect
                  isClearable
                  className="w-full rounded-lg dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                  placeholder={"Assigned To"}
                  closeMenuOnSelect={false}
                  //defaultValue={[colourOptions[0], colourOptions[1]]}
                  isMulti
                  options={fetchedOptions}
                  onChange={handleOnChange}
                  styles={colourStyles}
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-sm text-white transition-colors duration-150 ease-in-out hover:bg-emerald-500"
                  type="submit"
                >
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
    </>
  );
}

import { Fragment, useContext, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  CheckIcon,
  DocumentCheckIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import KanbanContext from "../../context/kanbanContext";
import useAutosizeTextArea from "../../hooks/useAutosizeTextarea";
import { KanbanCard, KanbanTask } from "../kanban/KanbanTypes";
import Datepicker from "react-tailwindcss-datepicker";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";
import { CreateTagModal, tagColors } from "./CreateTagModal";
import { AddTaskForm } from "../kanban/AddTaskForm";
import { DetailsTaskForm } from "../kanban/DetailsTaskForm";
import { classNames } from "../../utility/css";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import {
  DeleteTask,
  DeleteTag,
  AddTag,
  EditCard,
  AddTask,
  SubmitTask,
} from "@/services/kanbanApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GetCardImagePath } from "@/utility/baseUrl";

import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/20/solid";

export interface CardModalProps {
  listIndex: number;
  cardIndex: number;
  card: KanbanCard;
}

export function CardModal(props: CardModalProps) {
  const imageTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const descTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState<string>(props.card.title);
  const [desc, setDesc] = useState(props.card.desc);
  const [date, setDate] = useState<DateValueType | null>({
    startDate: props.card.startDate,
    endDate: props.card.endDate,
  });
  const [completed, setCompleted] = useState(props.card.completed);
  const CardImagePath = GetCardImagePath();
  const [displayImage, setImageUrl] = useState(
    props.card.imageUrl
      ? CardImagePath +
          "/" +
          props.card.kanbanCardId +
          "/" +
          props.card.imageUrl
      : ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileSizeExceeded, setFileSizeExceeded] = useState(false);
  const [kanbanTags, setTags] = useState(props.card.kanbanTags);
  const [kanbanTasks, setTasks] = useState(props.card.kanbanTasks);
  const [openTagModal, setOpenTagModal] = useState<boolean>(false);
  const [submit, setSubmit] = useState<boolean>(false);

  //set update and submit Kanban Task on detail
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);
  const [taskFile, setTaskFile] = useState<File | null>(null);
  const [taskFileSizeExceeded, setTaskFileSizeExceeded] = useState(false);
  const [submitTask, setSubmitTask] = useState<boolean>(false);

  //set File maxumum Length
  const maxFileSize = 5000000;
  // // check if file name has undefined non alphanumaric

  //getFile Name
  let imageUrl = file?.name;
  if (!file || file === undefined || file.length < 1) {
    if (props.card.imageUrl) {
      imageUrl = props.card.imageUrl;
    }
  }

  const {
    handleDeleteCard,
    handleUpdateCard,
    handleCloseModal,
    modalState,
    userInfo,
  } = useContext(KanbanContext);

  //useAutosizeTextArea(imageTextAreaRef, imageUrl);
  useAutosizeTextArea(descTextAreaRef, desc);

  //react quesry mutation for EditCard
  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        //add new list in db
        const customResponse = await EditCard(formData);

        if (customResponse?.status === 200) {
          handleUpdateCard(props.listIndex, props.cardIndex, {
            ...props.card,
            title,
            desc,
            completed,
            imageUrl,
            kanbanTags,
            kanbanTasks,
            date,
            startDate: date?.startDate as Date,
            endDate: date?.endDate as Date,
          });
          handleCloseModal();
          setSubmit(false);
          toast.success(`Card ID: ${customResponse?.data}`, {
            position: toast.POSITION.TOP_CENTER,
          });
        }

        if (customResponse?.status != 200 || customResponse?.data == null) {
          toast.error(
            `something went wrong could not Edit the Card, please try again later` +
              customResponse,
            {
              position: toast.POSITION.TOP_CENTER,
            }
          );
          setSubmit(false);
        }
      } catch (err: any) {
        toast.error(err, {
          position: "top-center",
        });
        setSubmit(false);
        return err.response;
      }
    },
  });

  //react quesry mutation for Add Tag
  // const mutationTag = useMutation({
  //   mutationFn: async (formData: FormData) => {
  //     try {
  //       //add new list in db
  //       const customResponse = await EditCard(formData);

  //       if (customResponse?.status === 200) {
  //         handleUpdateCard(props.listIndex, props.cardIndex, {
  //           ...props.card,
  //           title,
  //           desc,
  //           completed,
  //           imageUrl,
  //           kanbanTags,
  //           kanbanTasks,
  //           date,
  //         });
  //         handleCloseModal();
  //         setSubmit(false);
  //         toast.success(`Card ID: ${customResponse?.data}`, {
  //           position: toast.POSITION.TOP_CENTER,
  //         });
  //       }

  //       if (customResponse?.status != 200 || customResponse?.data == null) {
  //         toast.error(
  //           `something went wrong could not Edit the Card, please try again later` +
  //             customResponse,
  //           {
  //             position: toast.POSITION.TOP_CENTER,
  //           }
  //         );
  //         setSubmit(false);
  //       }
  //     } catch (err: any) {
  //       toast.error(err, {
  //         position: "top-center",
  //       });
  //       setSubmit(false);
  //       return err.response;
  //     }
  //   },
  // });

  const handleSave = () => {
    if (title === "") {
      return;
    }
    setSubmit(true);
    // handleUpdateCard(props.listIndex, props.cardIndex, {
    //   ...props.card,
    //   title,
    //   desc,
    //   completed,
    //   imageUrl,
    //   kanbanTags,
    //   kanbanTasks,
    //   date,
    //   startDate: date?.startDate as Date,
    //   endDate: date?.endDate as Date,
    // });
    // handleCloseModal();
    // setSubmit(false);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("kanbanCardId", props.card.kanbanCardId.toString());
    formData.append("updatedby", userInfo.username);
    formData.append("desc", desc ? desc : "....");
    if (file) {
      formData.append("uploadImage", file); // Use the third argument for filename
    }
    formData.append("completed", completed ? "true" : "false");
    if (date?.startDate) {
      formData.append("startDate", date.startDate.toString());
    }
    if (date?.endDate) {
      formData.append("endDate", date.endDate.toString());
    }
    formData.append("fkboardid", userInfo.fkboardid);
    formData.append("fkpoid", userInfo.fkpoid);
    mutation.mutate(formData);
    // handleUpdateCard(props.listIndex, props.cardIndex, {
    //   ...props.card,
    //   title,
    //   desc,
    //   completed,
    //   imageUrl,
    //   kanbanTags,
    //   kanbanTasks,
    //   date,
    // });
    //handleCloseModal();
  };

  const deleteCard = () => {
    toast.info(` Please Contact The Admin as you are not Authorized`, {
      position: toast.POSITION.TOP_CENTER,
    });
    //handleDeleteCard(props.listIndex, props.cardIndex);
    //handleCloseModal();
  };

  const handleDeleteTask = async (taskIndex: number, taskid: number) => {
    // delete task in db
    if (taskid) {
      const customResponse = await DeleteTask(taskid);
      if (customResponse?.status === 200) {
        const tempTask = [...kanbanTasks];
        tempTask.splice(taskIndex, 1);
        setTasks(tempTask);
        //update the card
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTasks: tempTask,
        });
        toast.success(` ${customResponse?.data}`, {
          position: toast.POSITION.TOP_CENTER,
        });
      }

      if (customResponse?.status != 200 || customResponse?.data == null) {
        toast.error(
          `something went wrong could not Remove the Task, please try again later` +
            customResponse,
          {
            position: toast.POSITION.TOP_CENTER,
          }
        );
      }
    } else {
      toast.error(`Task ID is Empty`, {
        position: toast.POSITION.TOP_CENTER,
      });
    }
    // const tempTask = [...kanbanTasks];
    // tempTask.splice(taskIndex, 1);
    // setTasks(tempTask);
  };

  const handleCreateTask = async (
    taskTitle: string,
    selectedOptions: any[]
  ) => {
    // add Tag in db
    if (taskTitle) {
      const assignToJoin = selectedOptions
        .map((option) => `${option.value}`)
        .join(" - ");
      const customResponse = await AddTask(
        taskTitle,
        props.card.kanbanCardId,
        userInfo.username,
        userInfo.userid,
        assignToJoin,
        userInfo.fkboardid,
        userInfo.fkpoid
      );
      if (customResponse?.status === 200) {
        const tempTask = [...kanbanTasks];
        tempTask.push({
          kanbanTaskId: customResponse?.data,
          id: "",
          title: taskTitle,
          completed: false,
          fkKanbanCardId: props.card.kanbanCardId,
          seqNo: 1,
          createdAt: new Date(),
          addedBy: userInfo.username,
          assignTo: assignToJoin,
          imageUrl: "",
          updatedBy: "",
        });
        setTasks(tempTask);
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTasks: tempTask,
        });
        toast.success(`Task ID: ${customResponse?.data} Created Successfully`, {
          position: toast.POSITION.TOP_CENTER,
        });
      }

      if (customResponse?.status != 200 || customResponse?.data == null) {
        toast.error(
          `something went wrong could not add the Task, please try again later` +
            customResponse,
          {
            position: toast.POSITION.TOP_CENTER,
          }
        );
      }
    } else {
      toast.error(`Task Title is Empty`, {
        position: toast.POSITION.TOP_CENTER,
      });
    }

    // const tempTask = [...kanbanTasks];
    // tempTask.push({
    //   KanbanTaskId: 1,
    //   id: "",
    //   title: taskTitle,
    //   completed: false,
    //   fkKanbanCardId: 1,
    //   seqNo: 1,
    //   createdAt: new Date(),
    //   addedBy: "",
    // });
    // setTasks(tempTask);
  };

  const handleCreateTag = async (tagName: string, colorIndex: number) => {
    // add Tag in db
    if (tagName) {
      const customResponse = await AddTag(
        tagName,
        tagColors[colorIndex],
        props.card.kanbanCardId,
        userInfo.username,
        userInfo.userid
      );

      if (customResponse?.status === 200) {
        const newTags = [...kanbanTags];
        newTags.push({
          kanbanTagId: customResponse?.data,
          id: "",
          color: tagColors[colorIndex],
          title: tagName,
          fkKanbanCardId: 1,
          seqNo: 1,
          createdAt: new Date(),
          addedBy: userInfo.username,
        });
        setTags(newTags);
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTags: newTags,
        });
        toast.success(`Tag ID: ${customResponse?.data} Created Successfully`, {
          position: toast.POSITION.TOP_CENTER,
        });
      }

      if (customResponse?.status != 200 || customResponse?.data == null) {
        toast.error(
          `something went wrong could not add the Tag, please try again later` +
            customResponse,
          {
            position: toast.POSITION.TOP_CENTER,
          }
        );
      }
    } else {
      toast.error(`Tag Name is Empty`, {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };

  const handleDeleteTag = async (tagIndex: number, tagid: number) => {
    // add Tag in db
    if (tagid) {
      const customResponse = await DeleteTag(tagid);
      if (customResponse?.status === 200) {
        const newTags = [...kanbanTags];
        newTags.splice(tagIndex, 1);
        setTags(newTags);
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTags: newTags,
        });
        toast.success(` ${customResponse?.data}`, {
          position: toast.POSITION.TOP_CENTER,
        });
      }

      if (customResponse?.status != 200 || customResponse?.data == null) {
        toast.error(
          `something went wrong could not Remove the Tag, please try again later` +
            customResponse,
          {
            position: toast.POSITION.TOP_CENTER,
          }
        );
      }
    } else {
      toast.error(`Tag ID is Empty`, {
        position: toast.POSITION.TOP_CENTER,
      });
    }
    // const newTags = [...kanbanTags];
    // newTags.splice(tagIndex, 1);
    // setTags(newTags);
  };

  // const handleDetailTask = (task: KanbanTask, index: number) => {
  //   // setSelectedTask(task);
  //   // setSelectedTaskIndex(index);
  //   // setShowForm(true);
  // };

  const handleSubmitTask = async (kanbanTaskId: number, index: number) => {
    if (!taskCompleted) return;
    try {
      setSubmitTask(true);
      const formData = new FormData();
      formData.append("KanbanTaskId", kanbanTaskId.toString());
      formData.append("updatedby", userInfo.username);
      if (taskFile) {
        formData.append("uploadFile", taskFile); // Use the third argument for filename
      }
      formData.append("completed", taskCompleted ? "true" : "false");
      formData.append("fkboardid", userInfo.fkboardid);
      formData.append("fkpoid", userInfo.fkpoid);

      //submit task list in db
      const customResponse = await SubmitTask(formData);

      if (customResponse?.status === 200) {
        const tempTask = [...kanbanTasks];
        tempTask[index].completed = !tempTask[index].completed;
        tempTask[index].updatedBy = userInfo.username;
        tempTask[index].imageUrl = taskFile?.name as string;
        setTasks(tempTask);
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTasks,
        });
        setSubmitTask(false);
        setTaskCompleted(false);
        setTaskFile(null);
        toast.success(`${customResponse?.data}`, {
          position: toast.POSITION.TOP_CENTER,
        });
      }

      if (customResponse?.status != 200 || customResponse?.data == null) {
        toast.error(
          `something went wrong could not Edit the Card, please try again later` +
            customResponse,
          {
            position: toast.POSITION.TOP_CENTER,
          }
        );
        setSubmit(false);
      }
    } catch (err: any) {
      toast.error(err, {
        position: "top-center",
      });
      setSubmit(false);
      return err.response;
    }
  };

  const handleToggleTaskCompleted = (index: number) => {
    setTaskCompleted(!taskCompleted);
    // const tempTask = [...kanbanTasks];
    // tempTask[index].completed = !tempTask[index].completed;
    // setTasks(tempTask);
  };

  const calculateTaskPercentage = () => {
    const totalTasks = kanbanTasks.length;
    let completedTask = 0;
    for (let i = 0; i < kanbanTasks.length; i++) {
      if (kanbanTasks[i].completed) {
        completedTask++;
      }
    }
    return Math.floor((completedTask * 100) / totalTasks);
  };

  return (
    <Transition appear show={modalState.isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={handleCloseModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-250"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-250"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-500 bg-opacity-40 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0">
          <div className="absolute inset-0">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-250 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-250 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl dark:bg-slate-900">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                        <input
                          className="flex-1 rounded-lg border-transparent pl-0 text-xl font-bold transition-all duration-150 ease-in focus:border focus:pl-3 hover:border-slate-500 hover:pl-3 hover:focus:border-blue-600 dark:bg-slate-900 dark:text-white dark:hover:border"
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          minLength={5}
                        />
                        <div className="flex h-7 items-center">
                          <button
                            className={classNames(
                              completed
                                ? "bg-emerald-700 text-white dark:bg-emerald-800"
                                : "bg-slate-300",
                              "inline-block rounded-lg px-3 py-1 text-sm font-semibold"
                            )}
                            onClick={() => setCompleted((prev) => !prev)}
                          >
                            {completed ? (
                              <span className="flex items-center gap-1">
                                <CheckIcon className="h-4 w-4" /> Completed
                              </span>
                            ) : (
                              <span className="">Mark complete</span>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                        <span className="w-28 text-sm dark:text-slate-500">
                          Date
                        </span>
                        <Datepicker
                          value={date}
                          onChange={setDate}
                          inputClassName="border-slate-500 text-inherit dark:bg-slate-900 dark:text-white focus:outline-blue-600 focus:ring-0 font-semibold"
                        />
                      </div>
                      <div className="text-inherit"></div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                        <span className="w-28 text-sm dark:text-slate-500">
                          Description
                        </span>
                        <textarea
                          ref={descTextAreaRef}
                          className="max-h-28 w-full rounded-lg placeholder:font-light dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 dark:hover:border"
                          placeholder="Description...."
                          value={desc}
                          onChange={(e) => setDesc(e.target.value)}
                          minLength={5}
                        ></textarea>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                        <span
                          className="w-28 text-sm dark:text-slate-500"
                          style={{ width: "92px" }}
                        >
                          Image
                        </span>
                        <input
                          className="focus:border-primary focus:shadow-te-primary dark:focus:border-primary relative m-0 block max-h-7 w-[50%] flex-auto cursor-pointer rounded border border-solid border-neutral-300 bg-clip-padding px-3 py-[0.32rem] text-xs font-normal text-neutral-700 transition duration-300 ease-in-out file:-mx-3 file:-my-[0.32rem] file:cursor-pointer file:overflow-hidden file:rounded-none file:border-0 file:border-solid file:border-inherit file:bg-neutral-100 file:px-3 file:py-[0.32rem] file:text-neutral-700 file:transition file:duration-150 file:ease-in-out file:[border-inline-end-width:1px] file:[margin-inline-end:0.75rem] focus:text-neutral-700 focus:outline-none hover:file:bg-neutral-200 dark:border-neutral-600 dark:text-neutral-200 dark:file:bg-neutral-700 dark:file:text-neutral-100"
                          //ref={imageTextAreaRef}
                          //className="max-h-16 w-[50%] rounded-lg placeholder:font-light dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 dark:hover:border"
                          placeholder="Image url...."
                          //value={imageUrl}
                          onChange={(e) => {
                            const selectedFile = e.target.files?.[0];

                            if (selectedFile) {
                              if (selectedFile.size > maxFileSize) {
                                setFileSizeExceeded(true);
                                setSubmit(true);
                                return; // do not process the file if it exceeds the size limit
                              }

                              setFileSizeExceeded(false);
                              setSubmit(false);
                              // Assuming you want to store the File object for later use
                              setFile(selectedFile);
                              // Generate a URL for the selected file and set it as the image URL
                              const imageURL =
                                URL.createObjectURL(selectedFile);
                              setImageUrl(imageURL);
                            } else {
                              setFile(null);
                              setImageUrl("");
                              setFileSizeExceeded(false);
                              setSubmit(false);
                            }
                          }}
                          type="file"
                          accept="image/*"
                          required
                        />
                        {displayImage != "" && (
                          <img
                            src={displayImage as string}
                            alt={"noImage"}
                            width={150}
                            height={100}
                          />
                        )}
                      </div>
                      {fileSizeExceeded && (
                        <div className="mt-4 flex flex-col gap-2 font-bold sm:flex-row sm:gap-3">
                          <span className="w-28 text-sm text-red-600">
                            ERROR:
                          </span>
                          <p className=" text-red-600 hover:text-red-500">
                            File size exceeded the limit of 5MB
                          </p>
                        </div>
                      )}
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                        <span className="w-28 text-sm dark:text-slate-500">
                          Tag
                        </span>
                        <div className="flex w-full flex-wrap gap-2">
                          {kanbanTags.map((tag, index) => (
                            <div
                              className={`flex items-center gap-1 rounded-lg py-1 pl-2 pr-1 text-sm font-semibold hover:bg-opacity-80 ${tag.color}`}
                              role="button"
                              aria-label="remove tag"
                              // key={index}
                              // onClick={() =>
                              //   handleDeleteTag(index, tag.kanbanTagId)
                              // }
                            >
                              <span className="">{tag.title}</span>

                              {tag.addedBy === userInfo.username && (
                                <button
                                  key={index}
                                  onClick={() =>
                                    handleDeleteTag(index, tag.kanbanTagId)
                                  }
                                  className={`flex items-center gap-1 rounded-lg py-1 pl-2 pr-1 text-sm font-semibold hover:bg-opacity-80 ${tag.color}`}
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          ))}
                          {kanbanTags.length < 6 && (
                            <button
                              role="button"
                              aria-label="create tag"
                              onClick={() => setOpenTagModal(true)}
                            >
                              <PlusIcon className="h-7 w-7 rounded-full border border-dashed border-slate-500 p-1 dark:border-white dark:stroke-slate-300" />
                            </button>
                          )}
                          <CreateTagModal
                            show={openTagModal}
                            handleClose={setOpenTagModal}
                            handleSubmit={handleCreateTag}
                          />
                        </div>
                      </div>
                      <div className="my-4 border-t-[1px] border-slate-200 dark:border-slate-700"></div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                        <span className="w-28 text-sm dark:text-slate-500">
                          Tasks
                        </span>

                        <div className="w-full">
                          {kanbanTasks.length > 0 && (
                            <div className="my-2 h-6 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-500">
                              {kanbanTasks.length > 0 && (
                                <div
                                  style={{
                                    width: `${calculateTaskPercentage()}%`,
                                  }}
                                  className="flex h-6 items-center justify-center bg-green-400 transition-transform duration-100 ease-in"
                                >
                                  {calculateTaskPercentage() > 0 &&
                                    `${calculateTaskPercentage()}%`}
                                </div>
                              )}
                            </div>
                          )}

                          {kanbanTasks.map((_t, index) => (
                            <Disclosure>
                              {({ open }) => (
                                <>
                                  <div
                                    key={index}
                                    className="mb-2 flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800 dark:text-white"
                                  >
                                    <div>
                                      {/* <input
                                  type="checkbox"
                                  className="h-5 w-5 rounded-md"
                                  value={_t.completed ? "on" : "off"}
                                  checked={_t.completed}
                                  onChange={() =>
                                    handleToggleTaskCompleted(index)
                                  }
                                ></input> */}
                                      {/* mine part for edit */}
                                      <span className="ml-2">{_t.title}</span>
                                    </div>
                                    <div>
                                      <Disclosure.Button>
                                        <button
                                          style={{ marginRight: "7px" }}
                                          role="button"
                                          aria-label="update task"
                                          // onClick={() =>
                                          //   handleDetailTask(_t, index)
                                          // }
                                        >
                                          <span className="sr-only">
                                            Submit task
                                          </span>

                                          {_t.completed ? (
                                            <span className="h-5 w-1 text-green-600 hover:text-green-500">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="h-6 w-6"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
                                                />
                                              </svg>
                                            </span>
                                          ) : (
                                            <span className="h-5 w-1 text-yellow-600 hover:text-yellow-500">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="h-6 w-6"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                                />
                                              </svg>
                                            </span>
                                          )}
                                        </button>
                                      </Disclosure.Button>
                                      {_t.addedBy === userInfo.username &&
                                        _t.completed === false && (
                                          <button
                                            role="button"
                                            aria-label="delete task"
                                            onClick={() =>
                                              handleDeleteTask(
                                                index,
                                                _t.kanbanTaskId
                                              )
                                            }
                                          >
                                            <span className="sr-only">
                                              Delete task
                                            </span>
                                            <TrashIcon className="h-5 w-5 text-red-600 hover:text-red-500" />
                                          </button>
                                        )}
                                    </div>
                                  </div>
                                  <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-black dark:text-white">
                                    <div className="mb-2 rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800 dark:text-white">
                                      <div
                                      // style={{
                                      //   display: "flex",
                                      //   flexDirection: "row",
                                      // }}
                                      >
                                        <div style={{ marginRight: "1rem" }}>
                                          <label htmlFor="createdAt">
                                            Created At:
                                          </label>
                                          <span
                                            style={{
                                              marginLeft: "4px",
                                              fontWeight: "bolder",
                                            }}
                                          >
                                            {new Date(
                                              _t.createdAt
                                            ).toLocaleDateString(undefined, {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                            })}
                                          </span>
                                        </div>
                                        <div>
                                          <label htmlFor="addedBy">
                                            Added By:
                                          </label>
                                          <span
                                            style={{
                                              marginLeft: "4px",
                                              fontWeight: "bolder",
                                            }}
                                          >
                                            {_t.addedBy}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <div style={{ marginRight: "1rem" }}>
                                          <label htmlFor="assignTo">
                                            Assign To:
                                          </label>
                                          <span
                                            style={{
                                              marginLeft: "4px",
                                              fontWeight: "bolder",
                                            }}
                                          >
                                            {_t.assignTo}
                                          </span>
                                        </div>
                                      </div>
                                      {_t.completed ? (
                                        <>
                                          <div>
                                            <div
                                              className="flex"
                                              style={{ marginRight: "1rem" }}
                                            >
                                              <label htmlFor="completed">
                                                Completed:
                                              </label>
                                              <div
                                                className="h-5 w-1 text-green-600 hover:text-green-500"
                                                style={{
                                                  marginLeft: "4px",
                                                  fontWeight: "bolder",
                                                }}
                                              >
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  strokeWidth={1.5}
                                                  stroke="currentColor"
                                                  className="h-6 w-6"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                  />
                                                </svg>
                                              </div>
                                            </div>
                                            <div
                                              className="flex"
                                              style={{ marginRight: "1rem" }}
                                            >
                                              <label htmlFor="imageUrl">
                                                Uploaded File:
                                              </label>
                                              <div
                                                style={{
                                                  marginLeft: "4px",
                                                  fontWeight: "bolder",
                                                }}
                                              >
                                                <a
                                                  href={`${CardImagePath}/${_t.fkKanbanCardId}/${_t.kanbanTaskId}/${_t.imageUrl}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className="h-6 w-6"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                                    />
                                                  </svg>
                                                </a>
                                              </div>
                                            </div>
                                          </div>
                                          <div
                                            className="flex"
                                            style={{ marginRight: "1rem" }}
                                          >
                                            <label htmlFor="completed">
                                              Submit By:
                                            </label>
                                            <span
                                              style={{
                                                marginLeft: "4px",
                                                fontWeight: "bolder",
                                              }}
                                            >
                                              {_t.updatedBy}
                                            </span>
                                          </div>
                                        </>
                                      ) : (
                                        <form>
                                          <div style={{ paddingTop: "5px" }}>
                                            <label htmlFor="completed">
                                              Completed:
                                            </label>
                                            <span
                                              className="h-5 w-1 text-green-600 hover:text-green-500"
                                              style={{
                                                marginLeft: "4px",
                                                fontWeight: "bolder",
                                              }}
                                            >
                                              <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded-md"
                                                value={
                                                  taskCompleted ? "on" : "off"
                                                }
                                                checked={taskCompleted}
                                                onChange={() =>
                                                  handleToggleTaskCompleted(
                                                    index
                                                  )
                                                }
                                                required
                                              />
                                            </span>
                                          </div>
                                          <div
                                            className="flex items-center"
                                            style={{ paddingTop: "7px" }}
                                          >
                                            <label htmlFor="imageUrl">
                                              Upload File:
                                            </label>
                                            <span
                                              //className="h-5 w-1 text-green-600 hover:text-green-500"
                                              style={{
                                                marginLeft: "4px",
                                                fontWeight: "bolder",
                                              }}
                                            >
                                              <input
                                                onChange={(e) => {
                                                  const selectedFile =
                                                    e.target.files?.[0];

                                                  if (selectedFile) {
                                                    if (
                                                      selectedFile.size >
                                                      maxFileSize
                                                    ) {
                                                      setTaskFileSizeExceeded(
                                                        true
                                                      );
                                                      return; // do not process the file if it exceeds the size limit
                                                    }
                                                    // Example usage:
                                                    // Assuming you want to store the File object for later use
                                                    setTaskFile(selectedFile);
                                                  } else {
                                                    setTaskFile(null);
                                                    setTaskFileSizeExceeded(
                                                      false
                                                    );
                                                  }
                                                }}
                                                style={{ paddingTop: "0px" }}
                                                className="focus:border-primary focus:shadow-te-primary dark:focus:border-primary relative m-0 block max-h-5 w-full min-w-0 flex-auto cursor-pointer rounded border border-solid border-neutral-300 bg-clip-padding px-3 py-[0.32rem] text-xs font-normal text-neutral-700 transition duration-300 ease-in-out file:-mx-3 file:-my-[0.32rem] file:cursor-pointer file:overflow-hidden file:rounded-none file:border-0 file:border-solid file:border-inherit file:bg-neutral-100 file:px-3 file:py-[0.32rem] file:text-neutral-700 file:transition file:duration-150 file:ease-in-out file:[border-inline-end-width:1px] file:[margin-inline-end:0.75rem] focus:text-neutral-700 focus:outline-none hover:file:bg-neutral-200 dark:border-neutral-600 dark:text-neutral-200 dark:file:bg-neutral-700 dark:file:text-neutral-100"
                                                type="file"
                                                accept=".xlsx,.xls,image/*,.doc, .docx,.ppt, .pptx,.txt,.pdf"
                                              />
                                              {taskFileSizeExceeded && (
                                                <div className="mt-4 flex flex-col gap-2 font-bold sm:flex-row sm:gap-3">
                                                  <span className="w-28 text-sm text-red-600">
                                                    ERROR:
                                                  </span>
                                                  <p className=" text-red-600 hover:text-red-500">
                                                    File size exceeded the limit
                                                    of 5MB
                                                  </p>
                                                </div>
                                              )}
                                            </span>
                                          </div>
                                          <div style={{ paddingTop: "18px" }}>
                                            <button
                                              onClick={() =>
                                                handleSubmitTask(
                                                  _t.kanbanTaskId,
                                                  index
                                                )
                                              }
                                              disabled={submitTask}
                                              type="submit"
                                              className=" font-small inline-flex items-center justify-center gap-1 rounded-md border border-transparent bg-emerald-700 px-3 py-1 text-base text-white transition-colors duration-150 hover:bg-emerald-600"
                                            >
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="h-6 w-6"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                              </svg>
                                              Submit
                                            </button>
                                          </div>
                                        </form>
                                      )}
                                    </div>
                                  </Disclosure.Panel>
                                </>
                              )}
                            </Disclosure>
                          ))}
                          {/* <DetailsTaskForm
                            onSubmit={() => {
                              handleSubmitTask;
                            }}
                            taskInfo={selectedTask}
                            index={selectedTaskIndex}
                            showForm={showForm}
                            setShowForm={setShowForm}
                          /> */}
                          {kanbanTasks.length < 21 && (
                            <AddTaskForm
                              text="Add task"
                              placeholder="Task name..."
                              onSubmit={handleCreateTask}
                              userInfo={userInfo}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between border-t-[1px] border-slate-700 px-4 py-6 backdrop-blur-sm">
                      <div className="">
                        <button
                          onClick={deleteCard}
                          type="button"
                          className="inline-flex items-center justify-center gap-1 rounded-md border border-transparent bg-red-700 px-3 py-1 text-base font-medium text-white transition-colors duration-150 hover:bg-red-600"
                        >
                          <TrashIcon className="h-5 w-5" />
                          Delete card
                        </button>
                      </div>
                      <div className="flex justify-end gap-2 sm:gap-3">
                        <button
                          disabled={submit}
                          onClick={handleSave}
                          type="button"
                          className="inline-flex items-center justify-center gap-1 rounded-md border border-transparent bg-emerald-700 px-3 py-1 text-base font-medium text-white transition-colors duration-150 hover:bg-emerald-600"
                        >
                          <DocumentCheckIcon className="h-5 w-5" />
                          Save
                        </button>
                        <button
                          onClick={handleCloseModal}
                          type="button"
                          className="inline-flex justify-center rounded-md border bg-transparent px-3 py-1 text-base font-medium transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-indigo-600 hover:border-indigo-600 hover:ring-1 hover:ring-indigo-600 dark:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

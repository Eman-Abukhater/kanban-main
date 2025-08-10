import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { memo, useContext } from "react";
import { Draggable } from "react-beautiful-dnd";
import KanbanContext from "../../context/kanbanContext";
//import { GetBaseURL } from "../../utility/baseUrl";
import { classNames } from "../../utility/css";
import { KanbanCard } from "./KanbanTypes";
import { GetCardImagePath } from "@/utility/baseUrl";

export interface IKanbanCardComponentProps {
  listIndex: number;
  cardIndex: number;
  card: KanbanCard;
}

export default function KanbanCardComponent(props: IKanbanCardComponentProps) {
  const { handleOpenModal, userInfo } = useContext(KanbanContext);

  const calculateTaskCompleted = () => {
    let completedTask = 0;
    for (let i = 0; i < props.card.kanbanTasks.length; i++) {
      if (props.card.kanbanTasks[i].completed) {
        completedTask++;
      }
    }
    return completedTask;
  };
  const CardImagePath = GetCardImagePath();
  return (
    <Draggable draggableId={props.card.id} index={props.cardIndex}>
      {(provided) => (
        <div
          className="mb-3 w-64 rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow duration-200 ease-in-out focus:border-indigo-600 focus:outline-none focus:ring focus:ring-indigo-600 hover:shadow-lg hover:ring-0 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:shadow-slate-800/60"
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          onClick={() =>
            handleOpenModal({
              type: "UPDATE_CARD",
              modalProps: {
                listIndex: props.listIndex,
                cardIndex: props.cardIndex,
                card: props.card,
              },
            })
          }
        >
          {props.card.imageUrl && (
            <div
              className={classNames(
                props.card.completed ? "opacity-50" : "opacity-100",
                "h-40 overflow-hidden rounded-t-md"
              )}
            >
              <img
                src={
                  CardImagePath +
                  "/" +
                  props.card.kanbanCardId +
                  "/" +
                  props.card.imageUrl
                }
                alt="task banner"
                className="bg-cover"
                // onError={({ currentTarget }) => {
                //   currentTarget.onerror = null;
                //   currentTarget.src = `http://localhost:3000/static/kanbanDefaultBanner.jpg`;
                // }}
              />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-center justify-between gap-5">
              <span
                className={classNames(
                  props.card.completed
                    ? "text-slate-400 dark:text-slate-500"
                    : "dark:text-white",
                  "truncate text-base font-semibold"
                )}
              >
                {props.card.title}
              </span>
              {!props.card.completed && props.card.kanbanTasks.length > 0 && (
                <div>{`${calculateTaskCompleted()}/${
                  props.card.kanbanTasks.length
                }`}</div>
              )}
              {props.card.completed && (
                <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
              )}
            </div>
            {props.card.completed === false && (
              <>
                {props.card.desc && (
                  <div className="mb-1 mt-2">
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {props.card.desc}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {props.card.kanbanTags.map((_tag, index) => (
                    <span
                      className={classNames(
                        props.card.kanbanTags.length > 0 ? "mt-1" : "",
                        `rounded-md px-3 py-1 text-sm font-semibold ${_tag.color}`
                      )}
                      key={index}
                    >
                      {_tag.title}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

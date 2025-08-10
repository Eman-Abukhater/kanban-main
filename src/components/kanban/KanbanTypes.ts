import { DateValueType } from "react-tailwindcss-datepicker/dist/types";

export type KanbanTask = {
  kanbanTaskId:number;//mine
  id: string; //mine
  title: string;
  completed: boolean;
  //mine
  fkKanbanCardId: number;
  seqNo: number;
  createdAt: Date;
  addedBy: string;
  assignTo:string;
  imageUrl:string;
  updatedBy:string;
};

export type KanbanTag = {
  kanbanTagId:number;//mine
  id: string; //mine
  color: string;
  title: string;
  //mine
  fkKanbanCardId: number;
  seqNo: number;
  createdAt: Date;
  addedBy: string;
};

export type KanbanCard = {
  kanbanCardId:number;//mine
  id: string;
  title: string;
  desc?: string;
  imageUrl?: string;
  completed: boolean;
  kanbanTags: KanbanTag[];
  kanbanTasks: KanbanTask[];
  date: DateValueType;
  startDate: Date;
  endDate: Date;
  //mine
  fkKanbanListId: number;
  seqNo: number;
  createdAt: Date;
  addedBy: string;
};

export type KanbanList = {
  kanbanListId:number;//mine
  id: string;
  title: string;
  kanbanCards: KanbanCard[];
  //mine
  fkBoardId: number;
  seqNo: number;
  createdAt: Date;
  addedBy: string;
};

export type KanbanBoardState = KanbanList[];

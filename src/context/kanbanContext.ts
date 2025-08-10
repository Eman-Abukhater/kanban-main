import { createContext } from "react";
import { KanbanBoardState } from "../components/kanban/KanbanTypes";
import { tagColors } from "../components/modal/CreateTagModal";
//import { GetBaseURL } from "../utility/baseUrl";
import { s4 } from "../utility/uuidGenerator";
import { KanbanContext, ModalContextState } from "./KanbanContextTypes";
import { HubConnection } from "@microsoft/signalr/dist/esm/HubConnection";
import { IStreamResult } from "@microsoft/signalr";

export const defaultKanbanBoardState: KanbanBoardState = [];

export const defaultModalContextState: ModalContextState = {
  type: null,
  isOpen: false,
  modalProps: null,
};

export const userInfo: any = {};
//export const signalRConnection: HubConnection ={};

const initialContextState: KanbanContext = {
  kanbanState: defaultKanbanBoardState,
  modalState: defaultModalContextState,
  userInfo: userInfo,
  signalRConnection: undefined,
  onlineUsers: [],
  handleCreateList: () => {},
  handleDeleteList: () => {},
  handleRenameList: () => {},
  handleCreateCard: () => {},
  handleDeleteCard: () => {},
  handleUpdateCard: () => {},
  handleDragEnd: () => {},
  handleOpenModal: () => {},
  handleCloseModal: () => {},
  setKanbanListState: () => {},
  handleSetUserInfo: () => {},
  setSignalRConnection: () => {},
  setUsersOnline: () => {},
};

const KanbanContext = createContext<KanbanContext>(initialContextState);

export const KanbanContextConsumer = KanbanContext.Consumer;
export const KanbanContextProvider = KanbanContext.Provider;

export default KanbanContext;

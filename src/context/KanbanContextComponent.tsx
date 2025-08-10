import { PropsWithChildren, useState, useEffect, useRef } from "react";
import { DropResult } from "react-beautiful-dnd";
import {
  KanbanBoardState,
  KanbanCard,
  KanbanList,
} from "../components/kanban/KanbanTypes";
import { CardModal, CardModalProps } from "../components/modal/CardModal";
import {
  DeleteListModal,
  DeleteListModalProps,
} from "../components/modal/DeleteListModal";
import RenameListModal, {
  RenameListModalProps,
} from "../components/modal/RenameListModal";
import useLocalStorage from "../hooks/useLocalStorage";
import { s4 } from "../utility/uuidGenerator";
import {
  defaultKanbanBoardState,
  defaultModalContextState,
  KanbanContextProvider,
} from "./kanbanContext";
import { hanbleOpenModalProps, ModalContextState } from "./KanbanContextTypes";
import { useOnDragEndCard, useOnDragEndList } from "@/services/kanbanApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { HubConnection } from "@microsoft/signalr";
import { debounceWithCardId } from "@/utility/debounce";

export interface IAppProps extends PropsWithChildren {}

export function KanbanContextComponent(props: IAppProps) {
  const { children } = props;

  // if (!isDataFetched) {
  //   return <div>Loading...</div>; // You can replace this with a loading indicator
  // }

  //set the default list on page load
  const [userInfo, setUserInfo] = useState<any>();

  //set Connection for signalR for websocket
  const [signalRConnection, setConnection] = useState<
    HubConnection | undefined
  >();

  //online users list
  const [onlineUsers, setOnlineUsers] = useState<any>([]);

  const [kanbanState, setKanbanState] = useLocalStorage<KanbanBoardState>(
    "kanban-state",
    defaultKanbanBoardState
  );

  const [modalState, setModalState] = useState<ModalContextState>(
    defaultModalContextState
  );

  const handleCreateList = (
    title: string,
    kanbanListId: number,
    seqNo: number,
    fkBoardId: number
  ) => {
    const tempList = [...kanbanState];
    tempList.push({
      kanbanListId: kanbanListId,
      id: s4(),
      title,
      kanbanCards: [],
      fkBoardId: fkBoardId,
      seqNo: seqNo,
      createdAt: new Date(),
      addedBy: "",
    });
    setKanbanState(tempList);
  };

  const handleDeleteList = (listIndex: number) => {
    const tempList = [...kanbanState];
    tempList.splice(listIndex, 1);
    setKanbanState(tempList);
  };

  const handleRenameList = (listIndex: number, title: string) => {
    const tempList = [...kanbanState];
    tempList[listIndex].title = title;
    setKanbanState(tempList);
  };

  const handleCreateCard = (
    listIndex: number,
    title: string,
    kanbanCardId: number,
    seqNo: number,
    fkKanbanListId: number
  ) => {
    const tempList = [...kanbanState];
    tempList[listIndex].kanbanCards.push({
      kanbanCardId: kanbanCardId,
      id: s4(),
      title,
      desc: title,
      completed: false,
      kanbanTasks: [],
      kanbanTags: [],
      date: null,
      fkKanbanListId: fkKanbanListId,
      seqNo: seqNo,
      createdAt: new Date(),
      addedBy: "",
      startDate: new Date(),
      endDate: new Date(),
    });
    setKanbanListState(tempList);
  };

  const handleDeleteCard = (listIndex: number, cardIndex: number) => {
    const tempList = [...kanbanState];
    tempList[listIndex].kanbanCards.splice(cardIndex, 1);
    setKanbanState(tempList);
  };

  const handleUpdateCard = (
    listIndex: number,
    cardIndex: number,
    updatedCard: KanbanCard
  ) => {
    const tempList = [...kanbanState];
    tempList[listIndex].kanbanCards[cardIndex] = updatedCard;
    setKanbanState(tempList);
  };

  const controller = new AbortController();
  let lastCardId: number | null = null;
  let intervalId: NodeJS.Timer | null = null;

  //API- ... post the updated card positions to the DB
  async function updateCardPosition(
    SourceListId: number,
    DestinationListId: number,
    kanbanCardId: number,
    cardTitle: string,
    oldSeqNo: number,
    newSeqNo: number
  ) {
    // Call the API here with the value
    const customResponse = await useOnDragEndCard(
      SourceListId,
      DestinationListId,
      kanbanCardId,
      cardTitle,
      userInfo.username,
      oldSeqNo,
      newSeqNo,
      userInfo.fkboardid,
      userInfo.fkpoid
    );
    if (customResponse?.status === 200) {
      toast.success(` ${customResponse?.data} `, {
        position: toast.POSITION.BOTTOM_LEFT,
      });
      //  lastCardId = null;
    }
    if (customResponse?.status != 200 || customResponse?.data == null) {
      toast.error(
        `something went wrong, could not save the changes for swaped Lists` +
          customResponse,
        {
          position: toast.POSITION.TOP_CENTER,
        }
      );
    }
  }

  const handleDragEnd = async (dropResult: DropResult) => {
    const { source, destination, type } = dropResult;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    //###### LIST  #########
    if (type === "all-lists") {
      const tempBoard = [...kanbanState];
      const draggedBoard = tempBoard[source.index];
      //get dragged board id and fkBoardId
      const draggedListId = draggedBoard.kanbanListId;
      const draggedListSeqNo = draggedBoard.seqNo;
      const fkBoardId = draggedBoard.fkBoardId;
      //get destination board id
      const destListId = tempBoard[destination.index].kanbanListId;
      const destListSeqNo = tempBoard[destination.index].seqNo;

      // set the action wther to add 1 or minus one based on grater then or less then condition of moving

      if (draggedListSeqNo < destListSeqNo) {
        // Item moved down, increment sequence numbers
        const minSeqNo = draggedListSeqNo;
        const maxSeqNo = destListSeqNo;

        // Update the sequence numbers for affected items
        for (let i = 0; i < tempBoard.length; i++) {
          const item = tempBoard[i];
          if (
            item.seqNo > minSeqNo &&
            item.seqNo <= maxSeqNo &&
            item.fkBoardId === fkBoardId
          ) {
            item.seqNo--;
          }
        }
      } else if (draggedListSeqNo > destListSeqNo) {
        // Item moved up, decrement sequence numbers
        const minSeqNo = destListSeqNo;
        const maxSeqNo = draggedListSeqNo;

        // Update the sequence numbers for affected items
        for (let i = 0; i < tempBoard.length; i++) {
          const item = tempBoard[i];
          if (
            item.seqNo >= minSeqNo &&
            item.seqNo < maxSeqNo &&
            item.fkBoardId === fkBoardId
          ) {
            item.seqNo++;
          }
        }
      }
      // Update the sequence number of the dragged item to the destination position
      draggedBoard.seqNo = destListSeqNo;

      let action = "";
      destListSeqNo < draggedListSeqNo ? (action = "Add") : (action = "Minus");

      tempBoard.splice(source.index, 1);
      tempBoard.splice(destination.index, 0, draggedBoard);
      setKanbanState(tempBoard);

      // //post the updates to db  for the LIST
      // const customResponse = await useOnDragEndList(
      //   draggedListId,
      //   draggedListSeqNo,
      //   destListId,
      //   destListSeqNo,
      //   userInfo.username,
      //   action,
      //   fkBoardId,
      //   userInfo.fkpoid
      // );
      // if (customResponse?.status === 200) {
      //   toast.success(` ${customResponse?.data} `, {
      //     position: toast.POSITION.BOTTOM_LEFT,
      //   });
      // }
      // if (customResponse?.status != 200 || customResponse?.data == null) {
      //   toast.error(
      //     `something went wrong, could not save the changes for swaped Lists` +
      //       customResponse,
      //     {
      //       position: toast.POSITION.TOP_CENTER,
      //     }
      //   );
      // }
    }

    let SourceListId = 0;
    let DestinationListId = 0;
    let kanbanCardId = 0;
    let oldSeqNo = 0;
    let newSeqNo = 0;

    // Handle card reordering logic
    if (source.droppableId === destination.droppableId) {
      // Moving within the same list
      const listIndex = kanbanState.findIndex(
        (list) => list.id === source.droppableId
      );

      if (listIndex !== -1) {
        const updatedList = { ...kanbanState[listIndex] };

        //$$$$ set source list id
        SourceListId = updatedList.kanbanListId;
        DestinationListId = updatedList.kanbanListId;

        const [draggedCard] = updatedList.kanbanCards.splice(source.index, 1);

        //$$$$ Get oldSeqNo
        oldSeqNo = draggedCard.seqNo;

        updatedList.kanbanCards.splice(destination.index, 0, draggedCard);

        // Update sequence numbers for cards within the same list
        updatedList.kanbanCards.forEach((card, index) => {
          card.seqNo = index + 1;
        });

        const updatedKanbanState = [...kanbanState];
        updatedKanbanState[listIndex] = updatedList;

        setKanbanState(updatedKanbanState);

        //$$$$ set draggedCard ID and  seqNo
        kanbanCardId = draggedCard.kanbanCardId;
        newSeqNo = draggedCard.seqNo;
        const cardTitle = draggedCard.title;

        //Post updates to the database as needed
        const [debouncedFunc, teardown] = debounceWithCardId(
          async () => {
            updateCardPosition(
              SourceListId,
              DestinationListId,
              kanbanCardId,
              cardTitle,
              oldSeqNo,
              newSeqNo
            );
          },
          2000 // 2 seconds debounce delay
        );
        //check if the same card is moved again to abort the api call
        if (lastCardId === kanbanCardId) {
          teardown(); // Cancel the API call using AbortController
        }
        //set last card id
        lastCardId = kanbanCardId;
        // Call the debounced API function with the extracted data and kanbanCardId
        debouncedFunc(
          {},
          kanbanCardId // Replace with the actual kanbanCardId
        );
      }
    } else {
      // Moving from one list to another
      const sourceListIndex = kanbanState.findIndex(
        (list) => list.id === source.droppableId
      );

      const destinationListIndex = kanbanState.findIndex(
        (list) => list.id === destination.droppableId
      );

      if (sourceListIndex !== -1 && destinationListIndex !== -1) {
        const sourceList = { ...kanbanState[sourceListIndex] };
        const destinationList = { ...kanbanState[destinationListIndex] };
        //$$$$ set source list id and destination list id
        SourceListId = sourceList.kanbanListId;
        DestinationListId = destinationList.kanbanListId;

        const [draggedCard] = sourceList.kanbanCards.splice(source.index, 1);

        //$$$$ Get oldSeqNo
        oldSeqNo = draggedCard.seqNo;

        destinationList.kanbanCards.splice(destination.index, 0, draggedCard);

        // Update sequence numbers for cards in the source list
        sourceList.kanbanCards.forEach((card, index) => {
          card.seqNo = index + 1;
        });

        // Update sequence numbers for cards in the destination list
        destinationList.kanbanCards.forEach((card, index) => {
          card.seqNo = index + 1;
        });

        const updatedKanbanState = [...kanbanState];
        updatedKanbanState[sourceListIndex] = sourceList;
        updatedKanbanState[destinationListIndex] = destinationList;

        setKanbanState(updatedKanbanState);

        //$$$$ set draggedCard ID and  seqNo
        kanbanCardId = draggedCard.kanbanCardId;
        newSeqNo = draggedCard.seqNo;
        const cardTitle = draggedCard.title;

        //Post updates to the database as needed
        const [debouncedFunc, teardown] = debounceWithCardId(
          async () => {
            updateCardPosition(
              SourceListId,
              DestinationListId,
              kanbanCardId,
              cardTitle,
              oldSeqNo,
              newSeqNo
            );
          },
          2000 // 2 seconds debounce delay
        );
        //check if the same card is moved again to abort the api call
        if (lastCardId === kanbanCardId) {
          teardown(); // Cancel the API call using AbortController
        }
        //set last card id
        lastCardId = kanbanCardId;
        // Call the debounced API function with the extracted data and kanbanCardId
        debouncedFunc(
          {},
          kanbanCardId // Replace with the actual kanbanCardId
        );
      }
    }
  };

  const handleCloseModal = () => {
    setModalState({ type: null, isOpen: false, modalProps: null });
  };

  const setKanbanListState = (KanbanList: KanbanBoardState) => {
    //setKanbanState(KanbanList);
    setKanbanState(KanbanList);
  };

  const setSignalRConnection = (
    SignalRConnection: HubConnection | undefined
  ) => {
    setConnection(SignalRConnection);
  };

  const setUsersOnline = (onlineUsesr: any) => {
    setOnlineUsers(onlineUsesr);
  };

  const handleSetUserInfo = (user: any) => {
    setUserInfo(user);
  };

  const handleOpenModal = (props: hanbleOpenModalProps) => {
    switch (props.type) {
      case "DELETE_LIST": {
        setModalState({
          type: "DELETE_LIST",
          isOpen: true,
          modalProps: props.modalProps,
        });
        break;
      }
      case "UPDATE_CARD": {
        setModalState({
          type: "UPDATE_CARD",
          isOpen: true,
          modalProps: props.modalProps,
        });
        break;
      }
      case "RENAME_LIST": {
        setModalState({
          type: "RENAME_LIST",
          isOpen: true,
          modalProps: props.modalProps,
        });
        break;
      }
      default: {
        return;
      }
    }
  };

  const renderModal = (state: ModalContextState) => {
    if (state.modalProps !== null) {
      switch (state.type) {
        case "DELETE_LIST": {
          return (
            <DeleteListModal {...(state.modalProps as DeleteListModalProps)} />
          );
        }
        case "UPDATE_CARD": {
          return <CardModal {...(state.modalProps as CardModalProps)} />;
        }
        case "RENAME_LIST": {
          return (
            <RenameListModal {...(state.modalProps as RenameListModalProps)} />
          );
        }
        default: {
          return null;
        }
      }
    }
  };

  return (
    <KanbanContextProvider
      value={{
        kanbanState,
        userInfo,
        signalRConnection,
        onlineUsers,
        modalState,
        handleCreateList,
        handleCreateCard,
        handleRenameList,
        handleDeleteList,
        handleDeleteCard,
        handleUpdateCard,
        handleDragEnd,
        handleOpenModal,
        handleCloseModal,
        setKanbanListState,
        handleSetUserInfo,
        setSignalRConnection,
        setUsersOnline,
      }}
    >
      {renderModal(modalState)}
      {children}
    </KanbanContextProvider>
  );
}

// // set default values for the list
// let defaultKanbanBoardState: KanbanBoardState = [];

// async function setInitialData(idAsNumber: number | null): Promise<any> {
//   defaultKanbanBoardState = await fetchKanbanList(idAsNumber);
//   console.log("🚀 ~ file: KanbanContextComponent.tsx:50 ~ setInitialData ~ defaultKanbanBoardState:", defaultKanbanBoardState)
// }

//  //check if the last po id in the local browser is the same as the passed from the peremeter
//  const lastSaveProjectId = localStorage.getItem(Pid_Key);
//  const lists = localStorage.getItem("kanban-state");
//  if (lists && lastSaveProjectId === id) {
//    defaultKanbanBoardState = JSON.parse(lists);
//  } else {
//    setInitialData(idAsNumber);
//    localStorage.setItem(Pid_Key, id);
//  }

// async function setInitialData(id: any): Promise<any> {
//   try {
//     const fetchUrl = `http://localhost:7260/api/ProjKanbanBoards/getkanbanlist?fkpoId=${id}`;
//     const response = await fetch(fetchUrl);

//     if (!response.ok) {
//       throw new Error("Network response was not ok");
//     }

//     defaultKanbanBoardState = await response.json();
//     return;
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return null; // Or any appropriate error handling
//   }
// }

// useEffect(() => {

// }, []);

import axios from "axios";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";

const Base_URL: string = "https://empoweringatt.ddns.net:4070/api"; // Replace with your API URL

// Define a custom response type
interface GetListCustomResponse<T> {
  status: number;
  data: T;
}

// Define a custom response type for adding
interface AddCustomResponse<T> {
  status: number;
  data: T;
}
// authentication and authorization by passing the userId
export async function authTheUserId(
  fkpoid: number | null,
  userid: number | null
): Promise<GetListCustomResponse<any> | null> {
  try {
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/authuser?fkpoid=${fkpoid}&userid=${userid}`;

    const response = await axios.get(fetchUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // if (!response.status) {
    //   throw new Error("Network response was not ok");
    // }

    const customResponse: GetListCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error: any) {
    console.error("Error fetching data:", error);
    return error;
    return null; // Or any appropriate error handling
  }
}

// useOnDragEnd
export async function updateBoards(boards: any): Promise<Response> {
  const response = await fetch(Base_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(boards),
  });
  return response;
}

// useOnDragEnd
export async function useOnDragEndColumns(
  mid: any,
  did: any
): Promise<Response> {
  const response = await fetch(`${Base_URL}/ProjBoards/useondragcolumns`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mid, did }),
  });
  return response;
}

// useOnDragEnd
export async function useOnDragEndTaskSameColumn(
  mid: any,
  did: any
): Promise<Response> {
  const response = await fetch(
    `${Base_URL}/ProjBoards/useondragtasksamecolumn`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mid, did }),
    }
  );
  return response;
}

// useOnDragEnd
export async function useOnDragEndTask(
  cmid: any,
  cdid: any,
  mid: any,
  did: any
): Promise<Response> {
  const response = await fetch(`${Base_URL}/ProjBoards/useondragtask`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cmid, cdid, mid, did }),
  });
  return response;
}

// on loading the page first check and fetch Board List
export async function fetchInitialBoards(
  id: any
): Promise<GetListCustomResponse<any> | null> {
  try {
    // const fetchUrl = `${Base_URL}/ProjKanbanBoards/getkanbanlist?fkpoId=${id}`;
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/getBoardlist?fkpoid=${id}`;
    const response = await axios.get(fetchUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const customResponse: GetListCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error: any) {
    console.error("Error fetching data:", error);
    return error; // Or any appropriate error handling
  }
}

// Add Board
export async function AddBoard(
  title: string,
  fkpoid: number | null,
  addedbyid: number | null,
  addedby: string
): Promise<AddCustomResponse<any> | null> {
  try {
    // const fetchUrl = `${Base_URL}/ProjKanbanBoards/addboard`;

    // const response = await fetch(fetchUrl, {
    //   method: "POST", // Assuming you want to send a POST request to add a board
    //   headers: {
    //     Accept: "application/json",
    //     "Content-Type": "application/json", // Set appropriate headers
    //   },
    //   body: JSON.stringify({ title: title, fkpoid: fkpoid }), // Convert data to JSON format
    // });

    const newBoard = {
      title: title,
      fkpoid: fkpoid,
      addedby: addedby,
      addedbyid: addedbyid,
    };
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/addboard`;

    const response = await axios.post(fetchUrl, newBoard, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };
    return customResponse;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or any appropriate error handling
  }
}

// Edit Board
export async function EditBoard(
  title: string,
  boardid: number | null,
  updatedby: string
): Promise<AddCustomResponse<any> | null> {
  try {
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/editboard`;

    const response = await axios.post(
      fetchUrl,
      { title: title, boardid: boardid, updatedby: updatedby },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };
    return customResponse;
  } catch (error: any) {
    console.error("Error fetching data:", error);
    return error;
    return null; // Or any appropriate error handling
  }
}

// on loading the page first check and fetch Board List
export async function fetchKanbanList(id: any): Promise<any> {
  try {
    // const fetchUrl = `${Base_URL}/ProjKanbanBoards/getkanbanlist?fkpoId=${id}`;
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/getkanbanlist?fkboardid=${id}`;

    const response = await axios.get(fetchUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response) {
      throw new Error("Network response was not ok");
    }

    const data = await response.data;
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or any appropriate error handling
  }
}

//add Kanban list by passing the fkboardid
export async function AddKanbanList(
  title: string,
  fkboardid: number | null,
  addedby: string,
  addedbyid: number | null,
  fkpoid: number | null
): Promise<AddCustomResponse<any> | null> {
  try {
    const newList = {
      title: title,
      fkboardid: fkboardid,
      addedby: addedby,
      addedbyid: addedbyid,
      fkpoid: fkpoid,
    };
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/addkanbanlist`;

    const response = await axios.post(fetchUrl, newList, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or any appropriate error handling
  }
}

//add card list by passing the fkboardid
export async function EditListName(
  title: string,
  listid: number | null,
  updatedby: string,
  fkboardid: number | null,
  fkpoid: number | null
): Promise<AddCustomResponse<any> | null> {
  try {
    const newList = {
      title: title,
      listid: listid,
      updatedby: updatedby,
      fkboardid: fkboardid,
      fkpoid: fkpoid,
    };
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/editlistname`;

    const response = await axios.post(fetchUrl, newList, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or any appropriate error handling
  }
}

//add card
export async function AddCard(
  title: string,
  fkKanbanListId: number | null,
  addedby: string,
  addedbyid: number | null,
  fkboardid: number | null,
  fkpoid: number | null
): Promise<AddCustomResponse<any> | null> {
  try {
    const newList = {
      title: title,
      fkKanbanListId: fkKanbanListId,
      addedby: addedby,
      addedbyid: addedbyid,
      fkboardid: fkboardid,
      fkpoid: fkpoid,
    };
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/addcard`;

    const response = await axios.post(fetchUrl, newList, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or any appropriate error handling
  }
}

//EDIT card

// title: string,
// kanbanCardId: number | null,
// updatedby: string,
// desc: string | null,
// uploadImage: File | null,
// completed: boolean | null,
// startEndDate: DateValueType | null,
export async function EditCard(
  editVM: FormData
): Promise<AddCustomResponse<any> | null> {
  try {
    // const newList = {
    //   title: title,
    //   kanbanCardId: kanbanCardId ,
    //   updatedby: updatedby,
    //   desc: desc,
    //   uploadImage: uploadImage,
    //   completed:completed,
    //   startDate:startEndDate?.startDate,
    //   endDate:startEndDate?.endDate,
    // };
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/editcard`;

    const response = await axios.post(fetchUrl, editVM, {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or any appropriate error handling
  }
}

//add Tag
export async function AddTag(
  title: string,
  color: string,
  fkKanbanCardId: number | null,
  addedby: string,
  addedbyid: number | null
): Promise<AddCustomResponse<any> | null> {
  try {
    const newList = {
      title: title,
      color: color,
      fkKanbanCardId: fkKanbanCardId,
      addedby: addedby,
      addedbyid: addedbyid,
    };
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/addTag`;

    const response = await axios.post(fetchUrl, newList, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or any appropriate error handling
  }
}

//delete Tag
export async function DeleteTag(
  tagid: number
): Promise<AddCustomResponse<any> | null> {
  try {
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/deletetag?tagid=${tagid}`;

    const response = await axios.get(fetchUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or any appropriate error handling
  }
}

// on loading the page first check and fetch Board List
export async function fetchAllMembers(): Promise<GetListCustomResponse<any> | null> {
  try {
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/getmembers`;
    const response = await axios.get(fetchUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const customResponse: GetListCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error: any) {
    console.error("Error fetching data:", error);
    return error; // Or any appropriate error handling
  }
}

//Add Task
export async function AddTask(
  title: string,
  fkKanbanCardId: number | null,
  addedby: string,
  addedbyid: number | null,
  selectedOptions: string,
  fkboardid: number | null,
  fkpoid: number | null
): Promise<AddCustomResponse<any> | null> {
  try {
    const newList = {
      title: title,
      fkKanbanCardId: fkKanbanCardId,
      addedby: addedby,
      addedbyid: addedbyid,
      selectedOptions: selectedOptions,
      fkboardid: fkboardid,
      fkpoid: fkpoid,
    };
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/addtask`;

    const response = await axios.post(fetchUrl, newList, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or any appropriate error handling
  }
}

//delete Task
export async function DeleteTask(
  taskid: number
): Promise<AddCustomResponse<any> | null> {
  try {
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/deletetask?taskid=${taskid}`;

    const response = await axios.get(fetchUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or any appropriate error handling
  }
}

//submit Task
export async function SubmitTask(
  submitVM: FormData
): Promise<AddCustomResponse<any> | null> {
  try {
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/submittask`;

    const response = await axios.post(fetchUrl, submitVM, {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or any appropriate error handling
  }
}

// useOnDragEnd List
export async function useOnDragEndList(
  draggedId: number,
  draggedSeqNo: number,
  destId: number,
  destSeqNo: number,
  updatedBy: string,
  action: string,
  fkBoardId: number,
  fkpoid: number
): Promise<AddCustomResponse<any> | null> {
  try {
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/useondraglist`;

    const response = await axios.post(
      fetchUrl,
      {
        draggedId,
        draggedSeqNo,
        destId,
        destSeqNo,
        updatedBy,
        action,
        fkBoardId,
        fkpoid,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or any appropriate error handling
  }
}

// useOnDragEnd Card
export async function useOnDragEndCard(
  sourceListId: number,
  destinationListId: number,
  kanbanCardId: number,
  cardTiltle: string,
  updatedBy: string,
  oldSeqNo: number,
  newSeqNo: number,
  fkBoardId: number,
  fkpoid: number
): Promise<AddCustomResponse<any> | null> {
  try {
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/useondragcard`;

    const response = await axios.post(
      fetchUrl,
      {
        sourceListId,
        destinationListId,
        kanbanCardId,
        cardTiltle,
        updatedBy,
        oldSeqNo,
        newSeqNo,
        fkBoardId,
        fkpoid
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        }
      }
    );

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or any appropriate error handling
  }
}

// on loading the page first check and fetch Board List then fetch online users
export async function fetchOnlineUsers(
  id: any
): Promise<GetListCustomResponse<any> | null> {
  try {
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/getonlineusers?fkpoid=${id}`;
    const response = await axios.get(fetchUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const customResponse: GetListCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error: any) {
    console.error("Error fetching data:", error);
    return error; // Or any appropriate error handling
  }
}

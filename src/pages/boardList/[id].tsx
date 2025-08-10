import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import AddEditBoardModal from "../../components/modal/AddEditBoardModal";
import { useRouter } from "next/router";
import {
  fetchInitialBoards,
  AddBoard,
  EditBoard,
} from "../../services/kanbanApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Lottie from "lottie-react";
//import animation_space from "../../../public/animation_space.json";
import animation_space from "../../../public/animationTeam2.json";
import animationSettings from "../../../public/animationNote.json";
import KanbanContext from "../../context/kanbanContext";
import { useContext } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import LoadingPage2 from "@/components/layout/LoadingPage2";

// Define a custom response type
interface GetListCustomResponse<T> {
  status: number;
  data: T;
}

export default function getBoardList() {
  const {
    userInfo,
    handleSetUserInfo,
    signalRConnection,
    setSignalRConnection,
    setUsersOnline,
  } = useContext(KanbanContext);

  const [boards, setBoards] = useState<any>(null);

  const router = useRouter();
  const { id } = router.query as { id: string | null };
  //parse id from route to type INT
  let idAsNumber: number | null = null;
  if (id !== null) {
    const parsedId = parseInt(id, 10); // Assuming base 10
    if (!isNaN(parsedId)) {
      idAsNumber = parsedId;
    }
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [board, setBoard] = useState(null);

  const [isLoading, setisLoading] = useState(true);

  //fetch the data
  const fetchData = async () => {
    if (idAsNumber !== null && idAsNumber !== null) {
      const customResponse = await fetchInitialBoards(id);
      //check if data not retrieved
      if (customResponse?.status === 200) {
        setBoards(customResponse.data);
      } else {
        toast.error(`could not fetch the data, something went wrong`, {
          position: toast.POSITION.TOP_CENTER,
        });
        setisLoading(false);
      }
    }
  };

  //Authenticate check if user is currently logged-in then fetch the data and check whter data return success or not
  useEffect(() => {
    //AUTH THE USER
    const checkUserExist = async () => {
      if (!userInfo) {
        const storeddata = window.sessionStorage.getItem("userData");
        if (!storeddata) return router.push(`/unauthorized`);
        const userInfo = JSON.parse(storeddata);
        return router.push(`/auth/${userInfo.fkpoid}/${userInfo.userid}`);
      }
    };

    checkUserExist();
    fetchData();

    setisLoading(false);

    //if no connection exist then connect

    if (!signalRConnection || signalRConnection === undefined) {
      if (!userInfo) return;
      console.log('this keeps hitting');
      //make signalR connection function
      const joinRoom = async (
        userid: string,
        fkpoid: string | null,
        userName: string
      ) => {
        try {
          const connection = new HubConnectionBuilder()
            .withUrl("https://empoweringatt.ddns.net:4070/board")
            .configureLogging(LogLevel.Information)
            .build();
          // Configure client timeout and keep-alive intervals
          connection.serverTimeoutInMilliseconds = 1800000; // 30 minutes
          connection.keepAliveIntervalInMilliseconds = 1800000; // 30 minutes
          await connection.start();

          connection.on("UserInOutMsg", (message) => {
            // refetch();
            toast.dark(`${message}`, {
              position: toast.POSITION.TOP_LEFT,
            });
          });

          connection.on("UsersInBoard", (users) => {
            setUsersOnline(users);
          });


          //join the board with the group of po id
          const param = {
            fkpoid: fkpoid?.toString(),
            userid: userid?.toString(),
            username: userName,
            userPic: userInfo.userpic,
          };
          await connection.invoke("JoinBoardGroup", param);

          // set context signalr connection
          setSignalRConnection(connection);
        } catch (e) {
          console.log(e);
        }
      };
      joinRoom(userInfo.userid, userInfo.fkpoid, userInfo.username); // Invoke the JoinBoardGroup method
    }

     // listen to ginalR for new Updates
     if (signalRConnection) {
      signalRConnection.on("addEditBoard", async (message) => {
        toast.info(`${message}`, {
          position: toast.POSITION.TOP_RIGHT,
        });
        // fetchData();
        const customResponse = await fetchInitialBoards(id);
        //check if data not retrieved
        if (customResponse?.status === 200) {
          setBoards(customResponse.data);
        } else {
          toast.error(`could not fetch the data, something went wrong`, {
            position: toast.POSITION.TOP_CENTER,
          });
          setisLoading(false);
        }
      });
    }
    // Cleanup: Remove the event listener when the component is unmounted
    return () => {
      if (signalRConnection) {
        signalRConnection.off("addEditBoard");
      }
    };

  }, []);

  const openEditModal = (board: any) => {
    setBoard(board);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setBoard(null);
    setIsModalOpen(false);
  };

  const handleEditTitle = async (newTitle: string, boardId: number) => {
    //post edited board to database
    const customResponse = await EditBoard(
      newTitle,
      boardId,
      userInfo.username
    );

    if (customResponse?.status != 200 || customResponse?.data == null) {
      toast.error(
        `something went wrong could not add the list, please try again later` +
          customResponse,
        {
          position: toast.POSITION.TOP_CENTER,
        }
      );
    }
    if (customResponse?.data) {
      //  toast.success(response, {
      //     position: toast.POSITION.TOP_RIGHT
      // });
      // Find the index of the board with the specified boardId
      const index = boards.findIndex((board: any) => board.boardId === boardId);

      if (index !== -1) {
        // Clone the boards array to avoid mutating state directly
        const updatedBoards = [...boards];

        // Update the title of the board at the found index
        updatedBoards[index].title = newTitle;

        // Update the state with the updated boards array
        setBoards(updatedBoards);
      }
      toast.success(`${customResponse?.data}`, {
        position: toast.POSITION.TOP_CENTER,
      });
    }
    closeEditModal();
  };

  const handleAddBoardClick = async (newTitle: string) => {
    //post new board to database
    const customResponse = await AddBoard(
      newTitle,
      idAsNumber,
      userInfo.userid,
      userInfo.username
    );

    if (customResponse?.status != 200 || customResponse?.data == null) {
      toast.error(
        `something went wrong could not add the list, please try again later` +
          customResponse,
        {
          position: toast.POSITION.TOP_CENTER,
        }
      );
    }

    if (customResponse?.data) {
      // Create a new board object with a unique ID
      const newBoard = {
        boardId: customResponse?.data, // Replace with your unique ID generation logic
        title: newTitle,
      };

      // Add the new board to the existing boards list
      const updatedBoards = [...boards, newBoard];

      // Update the state with the updated boards list  style={{ height: "300px", marginTop: "-128px" }}
      setBoards(updatedBoards);

      toast.success(`Board ID: ${customResponse?.data} Created Successfully`, {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };

  return (
    <>
      {isLoading && (
        <>
          <LoadingPage2 />
        </>
      )}
      {/* <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100"> */}

      {!isLoading && (
        <>
          <div className="flex h-screen flex-col bg-gray-100">
            <div
              className="flex  items-center justify-center bg-gray-100"
              style={{ marginTop: "-13px" }}
            >
              <div className="w-full max-w-md space-y-4 p-4">
                <div
                  className="flex items-center justify-center bg-gray-100"
                  style={{ height: "273px" }}
                >
                  {/* old height div avove 380px */}
                  <Lottie animationData={animation_space} loop={true} />
                </div>
              </div>
            </div>

            <div
              className="flex  items-center justify-center bg-gray-100"
              style={{ marginTop: "-33px" }}
            >
              <div className="w-full max-w-4xl space-y-4 p-4">
                <h1
                  className="rounded-lg bg-gradient-to-r from-white  to-blue-500 text-center text-3xl text-white shadow-lg"
                  style={{ position: "relative" }}
                >
                  <div
                    className="flex  items-center justify-center"
                    style={{
                      // height: "30px",
                      width: "67px",
                    }}
                  >
                    <Lottie animationData={animationSettings} loop={true} />
                  </div>
                  <div className="btn-shine">
                    <span>Board P.O {id} </span>
                    {/* <span>Board P.O {id} </span> */}
                  </div>
                  {/* P.O ID: {id} - Board List */}
                </h1>
                {/* Apply position: absolute to .contentwave */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {boards?.map((board: any, index: number) => (
                    <div
                      key={index}
                      className="relative flex items-center justify-between rounded-md bg-white p-4 shadow-md hover:shadow-lg"
                    >
                      <h2 className="... truncate text-lg font-semibold">
                        <span className="block text-xs text-gray-500">
                          ID: {board.boardId}
                        </span>
                        {board.title}
                      </h2>

                      <div className="right-2 top-2 flex items-center space-x-3">
                        <button
                          className="rounded-full bg-yellow-500 p-2 text-white focus:outline-none hover:bg-yellow-600"
                          onClick={() => openEditModal(board)}
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
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                            />
                          </svg>
                        </button>

                        <button
                          className="rounded-full bg-blue-500 p-2 text-white focus:outline-none hover:bg-blue-600"
                          onClick={() => {
                            setisLoading(true);
                            handleSetUserInfo({
                              ...userInfo,
                              boardTitle: board.title,
                              fkboardid: board.boardId,
                            });
                            router.push(`/kanbanList/${board.boardId}`);
                            // setTimeout(() => {
                            //   router.push(`/kanbanList/${board.boardId}`);
                            // }, 3000);
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
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Board Button (moved outside the list) */}
                {boards?.length < 21 && (
                  <button
                    className="fixed bottom-4 right-4 rounded-full bg-green-500 p-4 text-white focus:outline-none hover:bg-blue-600"
                    onClick={() => openEditModal("")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-8 w-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                )}

                {/* Edit Board Modal */}
                <AddEditBoardModal
                  isOpen={isModalOpen}
                  onClose={closeEditModal}
                  handleEditTitle={(newTitle: any, boardId: number) =>
                    handleEditTitle(newTitle, boardId)
                  }
                  handleAddBoardClick={handleAddBoardClick}
                  board={board}
                />
                {/* Add extra space at the bottom */}
                <div style={{ marginBottom: "72px" }}></div>
              </div>
              <ToastContainer />
            </div>
          </div>
        </>
      )}
    </>
  );
}
// return (
//     <div className="flex justify-center items-center h-screen bg-gray-100">
//       <div className="w-full max-w-md p-4 space-y-4">
//         <h1 className="text-2xl font-bold text-center">Board List</h1>
//         {boards.map((board, index) => (
//           <div
//             key={index}
//             className="relative p-4 bg-white rounded-md shadow-md"
//           >
//             {/* Board Info */}
//             <h2 className="text-lg font-semibold">{board.title}</h2>
//             <p className="text-gray-600">{board.description}</p>

//             {/* Add Board Button */}
//             <button
//               className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none"
//               //onClick={() =>()}
//             >
//               + Add
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );

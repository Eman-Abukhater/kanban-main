import React, { useState, useEffect } from "react";
import KanbanContext from "../../context/kanbanContext";
import { useContext } from "react";
import { GetUserImagePath } from "@/utility/baseUrl";
import { toast } from "react-toastify";

const OnlineUsersButton = () => {
  const { signalRConnection, setUsersOnline, onlineUsers } =
    useContext(KanbanContext);

  const [isExpanded, setIsExpanded] = useState(false);
  //const [onlineUsers, setonlineUsers] = useState([]);

  //fetch everytime someone new entrs the board
  useEffect(() => {
    ////
    if (signalRConnection) {
      signalRConnection.on("UsersInBoard", (users) => {
        setUsersOnline(users);
        //forthis component
        //setonlineUsers(users);
      });

      signalRConnection.on("ReceiveMessage", (message) => {
        toast.info(`${message}`, {
          position: toast.POSITION.TOP_RIGHT,
        });
      });
    }
  }, []);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const UserImagePath = GetUserImagePath();
  return (
    <>
      <div
        className={`fixed bottom-4 left-4 z-50 ${
          isExpanded ? "w-48" : "w-12"
        } flex w-fit cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-2 text-white transition-all duration-300 ease-in-out hover:shadow-lg`}
        onClick={toggleExpansion}
      >
        <div className="flex items-center space-x-2">
          <div className="absolute left-2 top-2 h-2 w-2 rounded-full bg-green-500" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6 animate-pulse"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
          <span className="text-lg font-semibold">{onlineUsers.length}</span>
        </div>
        {isExpanded && onlineUsers.length > 0 && (
          <div className="absolute bottom-12 left-0 w-72 rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-3xl font-extrabold text-white">
                Online Legends
              </h3>
            </div>
            <ul>
              {onlineUsers?.map((user: any, index: number) => (
                <li
                  key={user.userid}
                  className="mb-3 flex items-center space-x-4"
                >
                  <div className="relative h-14 w-14">
                    <img
                      src={`${UserImagePath}/${user.userid}/${user.userPic}`}
                      alt={`${user.username}'s Avatar`}
                      className="h-full w-full rounded-full shadow-md"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {user.username}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          // <div className="absolute bottom-12 left-0 w-72 rounded-lg bg-white p-4 shadow-lg">
          //   <h3 className="mb-4 border-b-2 border-gray-300 pb-2 text-xl font-bold text-gray-800">
          //     Online Legends
          //   </h3>
          //   <ul>
          //     {onlineUsers?.map((user: any, index: number) => (
          //       <li
          //         key={user.userid}
          //         className="mb-3 flex items-center space-x-3"
          //       >
          //         <img
          //           src={`${UserImagePath}/${user.userid}/${user.userPic}`}
          //           alt={`${user.username}'s Avatar`}
          //           className="h-10 w-10 rounded-full"
          //         />
          //         <span className="text-lg font-semibold text-gray-800">
          //           {user.username}
          //         </span>
          //       </li>
          //     ))}
          //   </ul>
          // </div>
        )}
      </div>
      {/* <div
        className={`fixed bottom-4 left-4 z-50 ${
          isExpanded ? "w-48" : "w-12"
        } flex cursor-pointer items-center justify-center rounded-full bg-blue-500 p-2 text-white transition-all duration-300 ease-in-out`}
        onClick={toggleExpansion}
      >
        <span className="text-lg">
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
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
          {onlineUsers.length}
          <div className="h-2 w-2 rounded-full bg-green-500" />
        </span>
        {isExpanded && onlineUsers.length > 0 && (
          <div className="absolute bottom-12 left-0 w-48 rounded-lg bg-white p-2 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">Online Users</h3>
            <ul>
              {onlineUsers?.map((user: any, index: number) => (
                <li key={index} className="flex items-center space-x-2">
                  <img
                    src={
                      UserImagePath + "/" + user.userid + "/" + user.userPic
                    }
                    alt={`${user.username}'s Avatar`}
                    className="h-8 w-8 rounded-full"
                  />
                  <span>{user.username}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div> */}
    </>
  );
};

export default OnlineUsersButton;

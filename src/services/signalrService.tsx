// import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

// const hubConnection = new HubConnectionBuilder()
//   .withUrl("http://localhost:7260/boardhub") // Specify the hub endpoint
//   .configureLogging(LogLevel.Information)
//   .withAutomaticReconnect()
//   .build();

// hubConnection.start();

// const startConnection = async () => {
//   try {
//     if (hubConnection.state === "Disconnected") {
//       await hubConnection.start();
//     }
//   } catch (err) {
//     console.error("Error starting SignalR connection:", err);
//   }
// };

// // Call startConnection when your application initializes or as needed.
// startConnection();

// const addMessageListener = (onMessageReceived: any) => {
//   hubConnection.on("ReceiveMessage", (message) => {
//     onMessageReceived(message);
//     console.log(
//       "🚀 ~ file: signalrService.tsx:24 ~ hubConnection.on ~ message:",
//       message
//     );
//   });
// };

// const joinBoardGroup = async (boardId: string, userName: string) => {
//   try {
//     //await hubConnection.invoke("JoinBoardGroup", boardId);
//     await hubConnection
//       .invoke("JoinBoardGroup", { boardId, userName })
//       .then((msg) => {
//         console.log(`Joined group: ${boardId} ${msg}`);
//       })
//       .catch((err) => console.log(err));
//     // console.log(`Joined group: ${boardId}`);
//   } catch (err) {
//     console.error("Error joining group:", err);
//   }
// };

// export { startConnection, addMessageListener, joinBoardGroup, hubConnection };

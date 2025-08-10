import { KanbanContextComponent } from "../../context/KanbanContextComponent";
import { KanbanBoard } from "../kanban/KanbanBoard";
//import { fetchInitialData } from "../../services/kanbanApi";

export interface IMainContentProps {}

export function MainContent(props: IMainContentProps) {
  return (
    <main className="scroll-thin flex-1 overflow-x-scroll py-6 sm:py-10">
      {/* <KanbanContextComponent>
      </KanbanContextComponent> */}
        <KanbanBoard />
    </main>
  );
}

// export async function getServerSideProps(context:any) {

//   // Extract the "id" query parameter from the URL
//   const id = context.query.id;

//   //get and check already same data exist in local storage
//   const lastSavePoId = window.localStorage.getItem(Pid_Key);
//   if(lastSavePoId === id) return;

//   window.localStorage.setItem(Pid_Key,id)

//   // Fetch initial data from the API route
//   const response = await fetchInitialData(id);
//   const initialKanbanData = response;

//   return {
//     props: {
//       initialKanbanData,
//     },
//   };
//}

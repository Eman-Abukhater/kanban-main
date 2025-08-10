import { authTheUserId } from "@/services/kanbanApi";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import KanbanContext from "../../../context/kanbanContext";
import { useContext } from "react";
import LoadingConor from "@/components/layout/LoadingConor";

// export const getServerSideProps: GetServerSideProps<{
//   boardData: any[];
// }> = async (context) => {
//   try {

//     // Retrieve the id from the query
//     const {fkpoid, userid } = context.query;

//     // Fetch data based on the id
//     const res = await authTheUserId(fkpoid,userid);

//     const boardData = res;

//     return { props: { boardData } };
//   } catch (error) {
//     // Handle errors gracefully, you can log or display an error page
//     console.error("Error in getServerSideProps:", error);

//     // You can also redirect to an error page if needed
//     return {
//       redirect: {
//         destination: "/error",
//         permanent: false,
//       },
//     };
//   }
// };
// Define a custom response type

// interface CustomResponse<T> {
//   status: number;
//   data: T;
// }

export default function Auth() {
  const { handleSetUserInfo } = useContext(KanbanContext);
  const router = useRouter();

  const { fkpoid, userid } = router.query as {
    fkpoid: string | null;
    userid: string | null;
  };

  let fkpoidAsNumber: number | null = null;
  let useridAsNumber: number | null = null;

  if (fkpoid !== null && userid !== null) {
    const parsedfkpoid = parseInt(fkpoid, 10); // Assuming base 10
    const parseduserid = parseInt(userid, 10); // Assuming base 10
    if (!isNaN(parsedfkpoid) && !isNaN(parseduserid)) {
      fkpoidAsNumber = parsedfkpoid;
      useridAsNumber = parseduserid;
    }
  }

  //authentication
  //const [response, setResponse] = useState<CustomResponse<any> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (fkpoidAsNumber !== null && useridAsNumber !== null) {
        const customResponse = await authTheUserId(
          fkpoidAsNumber,
          useridAsNumber
        );

        if (customResponse?.status != 200 || customResponse?.data == null) {
          //setResponse(customResponse.data);
          router.push("/unauthorized");
          console.error("Error fetching data");
        } else {
          handleSetUserInfo(customResponse.data);
          window.sessionStorage.setItem(
            "userData",
            JSON.stringify(customResponse.data)
          );
          router.push(`/boardList/${customResponse.data.fkpoid}`);
        }
      }
    };

    fetchData();
  }, [fkpoidAsNumber, useridAsNumber]);


  return (
    <>
      <LoadingConor />
    </>
  );
}

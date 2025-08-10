import { MainLayout } from "../../components/layout/MainLayout";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchKanbanList } from "../../services/kanbanApi";
import { useContext } from "react";
import KanbanContext from "../../context/kanbanContext";
import type { GetServerSideProps } from "next";
import LoadingPage2 from "@/components/layout/LoadingPage2";
// pages/posts.jsx
import { dehydrate, QueryClient, useQuery } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Retrieve the id from the query
    const { id } = context.query;

    const queryClient = new QueryClient();
    await queryClient.prefetchQuery(["kanbanlist"], await fetchKanbanList(id));
    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (error) {
    // Handle errors gracefully, you can log or display an error page
    console.error("Error in getServerSideProps:", error);

    // You can also redirect to an error page if needed
    return {
      redirect: {
        destination: "/error",
        permanent: false,
      },
    };
  }
};

export default function getKanbanList() {
  const {
    setKanbanListState,
    userInfo,
    handleSetUserInfo,
    signalRConnection,
    setSignalRConnection,
    setUsersOnline,
  } = useContext(KanbanContext);

  // Get the 'id' parameter from the URL using useRouter and make it integer
  const router = useRouter();
  const { id } = router.query as { id: string };
  let fkboardid: number | null = null;

  if (id !== null) {
    const parsedId = parseInt(id, 10); // Assuming base 10
    if (!isNaN(parsedId)) {
      fkboardid = parsedId;
    }
  }

  //react query
  const { data, isLoading, isError, error, refetch, isFetched } = useQuery<
    any,
    Error | null
  >({
    queryKey: ["kanbanlist"],
    queryFn: () => fetchKanbanList(fkboardid),
  });

  useEffect(() => {
    //check if user logged in or not
    const checkUserExist = async () => {
      if (!userInfo) {
        const storeddata = window.sessionStorage.getItem("userData");
        if (!storeddata) return router.push(`/unauthorized`);
        const userInfo = JSON.parse(storeddata);
        //add FKboardId in the user info so that i can use it for fk when adding list
        // Update userData with boardId
        // const updatedUserData = {
        //   ...userInfo,
        //   fkboardid,
        // };
        // handleSetUserInfo(updatedUserData);
        return router.push(`/auth/${userInfo.fkpoid}/${userInfo.userid}`);
      }

      //setisLoading(false);

      const updatedUserData = {
        ...userInfo,
        fkboardid,
      };

      handleSetUserInfo(updatedUserData);
    };

    checkUserExist();

    // listen to ginalR for new Updates
    if (signalRConnection) {
      signalRConnection.on("ReceiveMessage", (message) => {
        refetch();
        toast.info(`${message}`, {
          position: toast.POSITION.TOP_RIGHT,
        });
      });
    }
    if (!signalRConnection || signalRConnection === undefined) {
      toast.error(
        `something went wrong, you are not online... please refresh your page.`,
        {
          position: toast.POSITION.TOP_RIGHT,
        }
      );
    }
    // Cleanup: Remove the event listener when the component is unmounted
    return () => {
      if (signalRConnection) {
        signalRConnection.off("ReceiveMessage");
      }
    };
  }, []);

  // Handle data after it's fetched
  useEffect(() => {
    // Check if data has been fetched and there are no errors
    if (isFetched && !isError && data) {
      setKanbanListState(data);
    }
  }, [isFetched, isError, data]);

  return (
    <>
      {isLoading && (
        <>
          <LoadingPage2 />
        </>
      )}
      {isError && (
        <>
          <div>Error: Data could not be loaded. {error?.message}</div>
        </>
      )}
      {data && (
        <>
          <MainLayout /> <ToastContainer />
        </>
      )}
    </>
  );
}

import { MainLayout } from "../../components/layout/MainLayout";
import { useEffect, useContext, useMemo } from "react";
import { useRouter } from "next/router";
import { fetchKanbanList } from "../../services/kanbanApi";
import type { GetServerSideProps } from "next";
import LoadingPage2 from "@/components/layout/LoadingPage2";
import { dehydrate, QueryClient, useQuery } from "@tanstack/react-query";
import { ToastContainer, toast } from "react-toastify";
import KanbanContext from "../../context/kanbanContext";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { id } = ctx.query as { id: string };
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["kanbanlist", id],
    queryFn: () => fetchKanbanList(id),
  });
  return { props: { dehydratedState: dehydrate(queryClient) } };
};

export default function KanbanListPage() {
  const { setKanbanListState, handleSetUserInfo } = useContext(KanbanContext);
  const router = useRouter();
  const { id, userGuid, view } = router.query as { id: string; userGuid?: string; view?: string };
  const isPublic = view === "public";

  const { data, isLoading, isError, error, isFetched, refetch } = useQuery<any, { message: string }>({
    queryKey: ["kanbanlist", id],
    queryFn: () => fetchKanbanList(id),
    enabled: !!id,
  });

  useEffect(() => {
    // Seed a minimal user (admin if ADMIN-GUID in URL)
    const role = userGuid === "ADMIN-GUID" ? "admin" : "employee";
    const stored = {
      fkpoid: 1001,
      userid: role === "admin" ? 205 : 301,
      username: role === "admin" ? "Osama Ahmed" : "Abeer F.",
      role,
      fkboardid: id,
      readOnly: isPublic, // lock UI when public
    };
    window.sessionStorage.setItem("userData", JSON.stringify(stored));
    handleSetUserInfo(stored);
  }, [id, userGuid, isPublic, handleSetUserInfo]);

  useEffect(() => {
    if (isFetched && !isError && data) setKanbanListState(data);
  }, [isFetched, isError, data, setKanbanListState]);

  if (isLoading) return <LoadingPage2 />;
  if (isError) return <div>Error: {error?.message}</div>;
  return (
    <>
      <MainLayout /> 
      <ToastContainer />
    </>
  );
}

import VisitLogDetail from "@/app/components/VisitLogSpecific";
import ManagerSidebar from "@/app/components/ManagerSidebar";

export default function Home({ params }) {
  return (
    <>
      <div className="flex h-screen">
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <VisitLogDetail params={params} />
        </main>
      </div>
    </>
  );
}

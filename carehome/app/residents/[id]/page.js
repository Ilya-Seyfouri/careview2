import ManagerSidebar from "../../components/ManagerSidebar";
import ResidentSpecific from "../../components/ResidentSpecific";

export default function Home({ params }) {
  return (
    <>
      <div className="flex h-screen">
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <ResidentSpecific params={params} />
        </main>
      </div>
    </>
  );
}

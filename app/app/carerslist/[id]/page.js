import SpecificCarer from "@/app/components/SpecificCarer";
import ManagerSidebar from "@/app/components/ManagerSidebar";

export default function Home({ params }) {
  return (
    <>
      <div className="flex h-screen">
        <ManagerSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <SpecificCarer params={params} />
        </main>
      </div>
    </>
  );
}

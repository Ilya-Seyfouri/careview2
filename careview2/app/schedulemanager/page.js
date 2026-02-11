import ManagerSidebar from "../components/ManagerSidebar";
import ScheduleManager from "../components/ScheduleManager";

export default function Home({ params }) {
  return (
    <>
      <div className="flex h-screen">
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <ScheduleManager/>
        </main>
      </div>
    </>
  );
}

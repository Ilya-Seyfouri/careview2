import ManagerSidebar from "../components/ManagerSidebar";
import FamilyList from "../components/FamilyList";


export default function Home() {
  return <>
  <div className="flex h-screen">
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <FamilyList/>
      </main>
    </div>
    </>
}



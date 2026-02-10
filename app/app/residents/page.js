import ManagerSidebar from "../components/ManagerSidebar";
import Residents from "../components/Residents";


export default function Home() {
  return <>
  <div className="flex h-screen">
      <ManagerSidebar/>
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Residents/>
      </main>
    </div>
    </>
}



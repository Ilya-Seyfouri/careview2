import CarerSidebar from "../../components/CarerSidebar";
import CarerResidents from "@/app/components/CarerResidents";

export default function Home() {
  return <>
  <div className="flex h-screen">
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <CarerResidents/>
       
      </main>
    </div>
    </>
}



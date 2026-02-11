import CarerDashboard from "@/app/components/CarerDashboard"
import CarersEmar from "@/app/components/CarersEmar"

export default function Home() {
  return <>
  <div className="flex h-screen">
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <CarersEmar/>
       
      </main>
    </div>
    </>
}



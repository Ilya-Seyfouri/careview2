import CarersList from "../components/CarersList"


export default function Home() {
  return <>
  <div className="flex h-screen">
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <CarersList/>
      </main>
    </div>
    </>
}



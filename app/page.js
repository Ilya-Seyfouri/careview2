import Dashboard from "./components/Dashboard";



export default function Home() {
  return <>
  <div className="flex h-screen">
    
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Dashboard/>
       
      </main>
    </div>
    </>
}



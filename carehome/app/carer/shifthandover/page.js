import ShiftHandover from "../../components/ShiftHandover";

export default function Home() {
  return (
    <>
      <div className="flex h-screen">
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <ShiftHandover/>
        </main>
      </div>
    </>
  );
}

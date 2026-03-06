import SpecificCarer from "../../../app/components/SpecificCarer";

export default function Home({ params }) {
  return (
    <>
      <div className="flex h-screen">
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <SpecificCarer params={params} />
        </main>
      </div>
    </>
  );
}

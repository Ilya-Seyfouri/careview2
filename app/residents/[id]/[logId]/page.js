import VisitLogDetail from "../../../components/VisitLogSpecific";

export default function Home({ params }) {
  return (
    <>
      <div className="flex h-screen">
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <VisitLogDetail params={params} />
        </main>
      </div>
    </>
  );
}

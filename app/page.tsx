import { Image, Thread } from "@/utils/types";
import { getAllThreadsWithImage } from "../api/db/threads";
import GeekHackTable from "./components/GeekHackTable";


export default async function Home () {
  const allThreadsData: (Thread & Image)[] = JSON.parse(JSON.stringify(await getAllThreadsWithImage())); // needed to handle a weird bug with React and Nextjs
  return (
    <main>
      <div>
        <GeekHackTable data={allThreadsData} />
      </div>
    </main>
  );
}
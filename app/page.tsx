import { Image, Thread } from "@/utils/types";
import { getAllThreadsWithImage } from "../api/db/threads";
import GeekHackTable from "./components/GeekHackTable";
import { jsonify } from "./util/common";


export default async function Home () {
  const allThreadsData: (Thread & Image)[] = jsonify(await getAllThreadsWithImage());
  return (
    <main>
      <div>
        <GeekHackTable data={allThreadsData} />
      </div>
    </main>
  );
}

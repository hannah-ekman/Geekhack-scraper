import images from "../database/images-model";
import threads from "../database/threads-model";
import { Image, PageInfo, Thread } from "../utils/types";
import downloadImages from "./getImagesForDatabase";

export const SaveToDatabase = async (pages: PageInfo[]): Promise<void> => {
  const threadsToSaveToDatabase: Thread[] = pages.map(
    (page: PageInfo) => page.thread
  );
  const imagesToTryToDownload: Image[] = pages
    .map((page) => page.images)
    .flat();

  const imagesToSaveToDatabase = await downloadImages(imagesToTryToDownload);

  // need to set the thread first since images uses the ID as a FK
  const threadsSaved = await threads.bulkCreate(threadsToSaveToDatabase, {
    updateOnDuplicate: ["website", "title", "scraped", "updated"],
  });

  if (threadsSaved) {
    await images.bulkCreate(imagesToSaveToDatabase, {
      ignoreDuplicates: true,
    });
  }
};

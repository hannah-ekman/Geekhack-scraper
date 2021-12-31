import { JSDOM } from "jsdom";
import { TopicEnum, WebsiteEnum } from "../utils/constants";
import { Image, PageInfo, Thread, Vendor } from "../utils/types";
import { GroupBuyPage } from "./grabGHGroupBuyLinks";
import { VendorsList } from "../utils/vendors";

export function getAuthor(dom: JSDOM): string {
  const authorLink =
    dom.window.document.querySelector<HTMLAnchorElement>(".poster > h4 > a");

  if (authorLink) {
    return authorLink.text;
  }

  return "";
}

export function getFormattedStartDate(dom: JSDOM): Date | null {
  // query selctor means this gets the first post
  const firstPostStartDate = dom.window.document.querySelector<HTMLDivElement>(
    ".keyinfo > .smalltext"
  );
  let formattedDate = null;

  if (firstPostStartDate) {
    const temp = firstPostStartDate.innerHTML
      .replace("« <strong> on:</strong> ", "")
      .replace(" »", "");
    formattedDate = new Date(temp);
  }

  return formattedDate;
}

export function getFormattedModDate(dom: JSDOM): Date | null {
  // There is always a div for the last edit, even if there is no edit.
  // looks something like Last Edit: Tue, 05 March 2019, 08:47:56 by author
  const modDate = dom.window.document.querySelector("[id^='modified_'] > em");

  let formattedDate = null;

  if (modDate) {
    const temp = modDate.textContent?.split("Edit:")[1].split("by")[0];
    if (temp) {
      formattedDate = new Date(temp);
    }
  }

  return formattedDate;
}

export function getFormattedTitle(dom: JSDOM): string {
  // even though HTML Heading Element extends HTMLElement which contains .innerText I am unable to get anything back from it.
  // so I need to use textContent and rip out all tabs and new lines added.
  const title =
    dom.window.document.querySelector<HTMLHeadingElement>("[id^='subject_']");
  const cleanedTitle = title?.textContent
    ?.replace("\n", "")
    .replace("\t", "")
    .replace("[GB]", "")
    .replace("[IC]", "")
    .replace(/\s+/g, " ")
    .trim();

  return cleanedTitle || "";
}

export function getImageLinks(dom: JSDOM): string[] {
  const allPosts: Array<HTMLDivElement> = Array.from(
    dom.window.document.querySelectorAll<HTMLDivElement>(".post_wrapper")
  );
  const limitedPostLength = allPosts.length >= 3 ? 3 : allPosts.length;
  const firstThreePosts = allPosts.slice(0, limitedPostLength);
  //slice this into 3 instead and then map
  const imageLinks: string[] = [];
  for (const post of firstThreePosts) {
    const threadStarterCheck = post.querySelector(".threadstarter");
    // only get images from the thread starter
    if (threadStarterCheck !== null) {
      const allImgElements: NodeListOf<HTMLImageElement> =
        post.querySelectorAll<HTMLImageElement>(
          ".post img.bbc_img:not(.resized), img:not(.resized)[src*='action=dlattach;topic=']"
        );

      for (const imageElement of allImgElements) {
        if (imageElement.src.includes("PHPSESSID")) {
          // looks something like ?PHPSESSID= with a GUID and then &action
          const firstIndex = imageElement.src.indexOf("PHPSESSID");
          const secondIndex = imageElement.src.indexOf("&");
          const subString = imageElement.src.substring(
            firstIndex,
            secondIndex + 1
          );

          imageLinks.push(imageElement.src.replace(subString, ""));
        } else {
          imageLinks.push(imageElement.src);
        }
      }
    }
  }
  // remove duplicates
  return [...new Set(imageLinks)];
}

export function tryToGuessVendor(
  currentVendor: {
    names: string[];
    urls: string[];
    locations: string[];
  },
  foundVendor: string
): string {
  // removes everythintg but letters. you will generally find a user will add some symbol between the location and the link.
  const tempVendorGuess = foundVendor.replace(/\W/gi, " ").toLowerCase().trim();

  // check if the string and vendor match before we start removing other text.
  const locationFound = currentVendor.locations.some(
    (vendorLocation: string) => vendorLocation === tempVendorGuess
  );
  if (locationFound) {
    return tempVendorGuess;
  }

  let vendorLocationGuess = "";
  for (const vendorLocation of currentVendor.locations) {
    // remove any url from the text.
    for (const url of currentVendor.urls) {
      const urlGuessAttempt = tempVendorGuess.replace(url, "").trim();
      if (urlGuessAttempt !== tempVendorGuess) {
        if (
          tempVendorGuess.includes(` ${vendorLocation}`) ||
          tempVendorGuess.includes(`${vendorLocation} `) ||
          tempVendorGuess === vendorLocation
        ) {
          vendorLocationGuess = vendorLocation;
          break;
        }
      }
    }

    if (vendorLocationGuess) {
      break;
    }

    // remove any names found in the text.
    for (const name of currentVendor.names) {
      const nameGuessAttempt = tempVendorGuess.replace(name, "").trim();
      if (nameGuessAttempt !== tempVendorGuess) {
        if (
          tempVendorGuess.includes(` ${vendorLocation}`) ||
          tempVendorGuess.includes(`${vendorLocation} `) ||
          tempVendorGuess === vendorLocation
        ) {
          vendorLocationGuess = vendorLocation;
          break;
        }
      }
    }
  }
  return vendorLocationGuess || "";
}

export function getVendors(dom: JSDOM, urlTopicID: number): Vendor[] {
  const scrappedVendors: Vendor[] = [];

  // it is unlikely that vendors will appear in anything but the first post so use that as our dom.
  const firstPost =
    dom.window.document.querySelector<HTMLDivElement>(".post_wrapper");

  for (const vendor of VendorsList) {
    for (const url of vendor.urls) {
      // first post could possibly be null in theory if the styling changed but it hasn't since I started this.
      // this css selector looks anchor elements with bbc_link as the class.
      // then it looks at the href to see if any part of it contains something from our list of urls.
      const foundVendor = firstPost?.querySelector<HTMLAnchorElement>(
        `a.bbc_link[href*='${url}'`
      );
      if (foundVendor) {
        let location = "";
        if (foundVendor.previousSibling?.textContent) {
          const locationSiblingGuess = tryToGuessVendor(
            vendor,
            foundVendor.previousSibling.textContent
          );
          if (locationSiblingGuess) {
            location = locationSiblingGuess;
          }
        }

        // we didn't find it. try again
        if (!location) {
          const locationAnchorTextGuess = tryToGuessVendor(
            vendor,
            foundVendor.text
          );
          if (locationAnchorTextGuess) {
            location = locationAnchorTextGuess;
          }
        }

        const scrappedVendor: Vendor = {
          thread_id: urlTopicID,
          location,
          url: foundVendor.href,
        };

        scrappedVendors.push(scrappedVendor);
      }
    }
  }

  return scrappedVendors;
}

export default (page: GroupBuyPage): PageInfo => {
  const imageLinks = getImageLinks(page.BodyDom);
  const urlThreadId = parseInt(page.PageLink.split("=")[1], 10);

  const thread: Thread = {
    id: urlThreadId,
    website: WebsiteEnum.geekhack,
    title: getFormattedTitle(page.BodyDom),
    start: getFormattedStartDate(page.BodyDom),
    scraped: new Date(),
    updated: getFormattedModDate(page.BodyDom),
    topic: TopicEnum.GB,
    author: getAuthor(page.BodyDom),
  };

  const images = imageLinks.map(
    (image: string | undefined, index: number): Image => ({
      thread_id: urlThreadId,
      url: image,
      sort_order: index,
    })
  );

  const vendors = getVendors(page.BodyDom, urlThreadId);

  const pageInfo: PageInfo = {
    thread: thread,
    images: images,
    vendors: vendors,
  };
  return pageInfo;
};

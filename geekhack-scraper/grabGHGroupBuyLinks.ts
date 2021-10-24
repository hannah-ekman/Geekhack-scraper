import axios from "axios";
import { JSDOM } from "jsdom";

export const GrabGHGroupBuyLinks = async (url: string): Promise<string[]> => {
  let cleanLinks: string[] = [];

  try {
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);

    // There are 50 posts on one page.
    // We are looking for the link to the group buy.
    // So we get the td that includes the link. It is marked by a subject class.
    // Stickied posts have separate classes, so we want the windowbg2 class.
    // Each td contains an empty div, followed by a span, then by a url for the group buy.
    const anchorListWithNoStickiedPosts: NodeListOf<HTMLAnchorElement> =
      dom.window.document.querySelectorAll(
        ".subject.windowbg2 > div > span > a"
      );

    const urlArray = Array.from(anchorListWithNoStickiedPosts, (a) => a.href);

    // I don't know what PHPSESSID but I don't like the look of it so remove it.
    const baseLink = "https://geekhack.org/index.php?topic=";
    cleanLinks = urlArray.map((link) => baseLink + link?.split("=")[2]);
  } catch (err) {
    console.error(err);
  }

  return cleanLinks;
};

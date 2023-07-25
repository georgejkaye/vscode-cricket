import axios from "axios";
import { xml2js } from "xml-js"

const summaryXML = "http://static.cricinfo.com/rss/livescores.xml";

interface Match {
    title: string
    id: number
}

export const getSummary = async () => {
    let response = await axios.get(summaryXML);
    let data = response.data;
    let xml : any = xml2js(data, { compact: true });
    let matchElements = xml.rss.channel.item;
    let matches : Match[] = matchElements.map((match : any) => {
        let matchTitle = match.title._text.replace("  ", " ");
        let link = match.link._text;
        let linkElements = link.split("/");
        let matchElement = linkElements[linkElements.length - 1];
        let matchId = matchElement.substring(0, matchElement.length - 18);
        return { title: matchTitle, id: matchId };
    });
    return matches;
};
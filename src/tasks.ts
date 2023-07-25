import axios from "axios";
import { xml2js } from "xml-js"

const summaryXML = "http://static.cricinfo.com/rss/livescores.xml";

interface Match {
    label: string
    id: number
}

interface Ball {
    runs : number
    indicator: string
    dismissal: string
    extras: string
    deliveryNo: string
    players: string
    event: string
}

interface Data {
    balls: Ball[]
    batting: string
    runs: number
    wickets: number
}

export const getMatchData = async (id : string) => {
    let url = `https://www.espncricinfo.com/matches/engine/match/${id}.json`;
    let response = await axios.get(url);
    let data = response.data;

    let comms : any[] = data.comms
    let recentOvers : any[] = data.live.recent_overs

    let deliveries = recentOvers.reverse().map((over : any[], overNumber) => {
        let overComms = comms[overNumber];
        return over.reverse().map((ball, ballNumber) => {
            let ballComms = overComms.ball[ballNumber];
            return {
                runs: ball.ball === "&bull;" || ball.ball === "W" ? 0 : ball.ball,
                indicator: ball.ball,
                dismissal: ball.delivery,
                extras: ball.extras,
                event: ballComms.event,
                players: ballComms.players,
                deliveryNo: ballComms.overs_actual
            };
        });
    });
    let innings = data.innings;
    let currentInnings = innings[innings.length - 1];
    let battingTeamId = currentInnings.battingTeamId
    let battingTeamName = data.team[0].contentId === battingTeamId ? data.team[0].team_name : data.team[1].team_name
    return <Data>{
        balls: deliveries.flat(),
        runs: currentInnings.runs,
        wickets: currentInnings.wickets,
        batting: battingTeamName
    };
};


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
        return { label: matchTitle, id: matchId };
    });
    return matches;
};
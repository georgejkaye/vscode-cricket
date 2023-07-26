import axios from "axios";
import { xml2js } from "xml-js";
import { Dismissal, parseDismissal } from "./dismissal";

const summaryXML = "http://static.cricinfo.com/rss/livescores.xml";

interface Match {
    label: string
    id: string
}

export enum Event {
    Four,
    Six,
    Wicket
}

export interface Ball {
    runs : number
    indicator: string
    dismissal: Dismissal
    extras: string
    deliveryNo: string
    uniqueDeliveryNo: string
    deliveryText: string
    runsText: string
    batter: string
    bowler: string
    events: Event[]
}

export interface Innings {
    batting: number
    bowling: number
    runs: number
    wickets: number
    status: string
}

export interface Team {
    id: number
    name: string
    shortName: string
}

export interface Data {
    balls: Ball[]
    currentInnings: number
    currentBatting: number
    teams: Team[]
    innings: Innings[]
}

export const getMatchData = async (id : string) => {
    let url = `https://www.espncricinfo.com/matches/engine/match/${id}.json`;
    let response = await axios.get(url);
    let data = response.data;

    let comms : any[] = data.comms;
    let recentOvers : any[] = data.live.recent_overs;

    let deliveries = recentOvers.reverse().map((over : any[], overNumber) => {
        let overComms = comms[overNumber];
        return over.reverse().map((ball, ballNumber) => {
            let ballComms = overComms.ball[ballNumber];

            let extraIndicator = ball.extras === "wd" ? "w" : ball.extras;
            let ballIndicator = ball.ball === "&bull;" ? "•" : `${ball.ball}${extraIndicator}`;
            let runs = ball.ball === "&bull;" || ball.ball === "W" ? 0 : ball.ball;
            let runsText = ballComms.event;
            let events = [];
            if(runsText === "OUT"){
                events.push(Event.Wicket);
            } else if(runsText === "FOUR") {
                events.push(Event.Four);
            } else if(runsText === "SIX") {
                events.push(Event.Six);
            }

            let dismissal = parseDismissal(ballComms.dismissal.replace("  ", " "));
            let deliveryText = ballComms.players;
            let deliveryPlayers = deliveryText.split(" to ");
            let bowler = deliveryPlayers[0].trim();
            let batter = deliveryPlayers[1].trim();

            return <Ball>{
                runs: runs,
                indicator: ballIndicator,
                dismissal: dismissal,
                extras: ball.extras,
                deliveryNo: ballComms.overs_actual,
                uniqueDeliveryNo: ballComms.overs_unique,
                deliveryText: deliveryText,
                runsText,
                batter,
                bowler,
                events
            };
        });
    });

    let homeId = data.team[0].content_id;
    let awayId = data.team[1].content_id;

    let homeTeam = <Team>{
        name: data.team[0].team_name,
        shortName: data.team[0].team_abbreviation,
        id: data.team[0].content_id

    };
    let awayTeam = <Team>{
        name: data.team[1].team_name,
        shortName: data.team[1].team_abbreviation,
        id: data.team[1].content_id
    };

    let innings = [];
    for(const inn of data.innings) {
        let inningsObject = <Innings>{
            batting: inn.batting_team_id,
            bowling: inn.bowling_team_id,
            runs: inn.runs,
            wickets: inn.wickets,
            status: inn.event_name
        };
        innings.push(inningsObject);
    }


    let currentInnings = data.innings.findIndex((inn : any) => inn.live_current_name === "current innings");
    let currentBatting = innings[currentInnings].batting === homeTeam.id ? 0 : 1;
    return <Data>{
        balls: deliveries.flat(),
        currentInnings,
        currentBatting,
        teams: [homeTeam, awayTeam],
        innings
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
import axios from "axios"
import { xml2js } from "xml-js"
import { Dismissal, parseDismissal } from "./dismissal"
import { Match, Status, Team, getStatus } from "./match"
import { Innings, getInningsStatus } from "./innings"
import { Ball, Boundary, getExtraFromText } from "./ball"
import { EventType } from "./event"

const summaryXML = "http://static.cricinfo.com/rss/livescores.xml"

interface MatchName {
    label: string
    id: string
}

export const getBattingTeam = (match: Match) =>
    match.teams[match.currentBatting]

export const getCurrentInnings = (match: Match) =>
    match.innings[match.currentInnings]

export const getMatch = async (id: string) => {
    let url = `https://www.espncricinfo.com/matches/engine/match/${id}.json`
    let response = await axios.get(url)
    let data = response.data

    let comms: any[] = data.comms
    let recentOvers: any[] = data.live.recent_overs

    let deliveries = recentOvers.reverse().map((over: any[], overNumber) => {
        let allOverComms = comms[overNumber].ball
        let overComms = allOverComms.filter((comm: any) => comm.event)
        return over.reverse().map((ball, ballNumber) => {
            let ballComms = overCommsBalls[ballNumber]
            let extras = getExtraFromText(ball.extras)
            let runs =
                ball.ball === "&bull;" || ball.ball === "W" ? 0 : ball.ball
            let runsText = ballComms.event
            let deliveryText = ballComms.players
            let deliveryPlayers = deliveryText.split(" to ")
            let bowler: string = deliveryPlayers[0].trim()
            let batter: string = deliveryPlayers[1].trim()
            let dismissal =
                ball.dismissal === ""
                    ? undefined
                    : parseDismissal(ballComms.dismissal.replace("  ", " "))
            let boundary =
                runsText === "FOUR"
                    ? Boundary.Four
                    : runsText === "SIX"
                    ? Boundary.Six
                    : undefined
            return <Ball>{
                deliveryNo: ballComms.overs_actual,
                uniqueDeliveryNo: ballComms.overs_unique,
                batter,
                bowler,
                runs,
                extras,
                dismissal,
                boundary,
            }
        })
    })
    let homeTeam = <Team>{
        name: data.team[0].team_name,
        shortName: data.team[0].team_abbreviation,
        id: data.team[0].content_id,
    }
    let awayTeam = <Team>{
        name: data.team[1].team_name,
        shortName: data.team[1].team_abbreviation,
        id: data.team[1].content_id,
    }
    let status = getStatus(data)
    let statusString = data.live.status
    let innings = []
    for (const inn of data.innings) {
        let inningsStatus = getInningsStatus(inn, status)
        let inningsObject = <Innings>{
            batting: inn.batting_team_id,
            bowling: inn.bowling_team_id,
            runs: inn.runs,
            wickets: inn.wickets,
            status: inningsStatus,
        }
        innings.push(inningsObject)
    }
    let currentInnings = data.innings.findIndex(
        (inn: any) => inn.live_current_name === "current innings"
    )
    let currentBatting =
        currentInnings === -1
            ? -1
            : innings[currentInnings].batting === homeTeam.id
            ? 0
            : 1
    return <Match>{
        id,
        balls: deliveries.flat(),
        currentInnings,
        currentBatting,
        teams: [homeTeam, awayTeam],
        innings,
        status,
        statusString,
    }
}

export const getSummary = async () => {
    let response = await axios.get(summaryXML)
    let data = response.data
    let xml: any = xml2js(data, { compact: true })
    let matchElements = xml.rss.channel.item
    let matches: MatchName[] = matchElements.map((match: any) => {
        let matchTitle = match.title._text.replace("  ", " ")
        let link = match.link._text
        let linkElements = link.split("/")
        let matchElement = linkElements[linkElements.length - 1]
        let matchId = matchElement.substring(0, matchElement.length - 18)
        return { label: matchTitle, id: matchId }
    })
    return matches
}

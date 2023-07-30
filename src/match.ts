import { Ball } from "./ball"
import { Innings } from "./innings"

export interface Team {
    id: number
    name: string
    shortName: string
}

export enum Status {
    Upcoming,
    Live,
    Drinks,
    Lunch,
    Tea,
    Stumps,
    Result,
    Abandoned,
    Delayed,
    Other,
    Break,
}

export const getStatus = (data: any) =>
    data.match.result === "1"
        ? Status.Result
        : data.match.match_status === "dormant"
        ? Status.Upcoming
        : data.match.live_state === "Stumps"
        ? Status.Stumps
        : data.match.live_state === "Drinks"
        ? Status.Drinks
        : data.match.live_state === "Lunch"
        ? Status.Lunch
        : data.match.live_state === "Tea"
        ? Status.Tea
        : data.match.result_short_name === "aban"
        ? Status.Abandoned
        : data.match.live_state.includes("delayed")
        ? Status.Delayed
        : data.match.result === "0"
        ? Status.Live
        : Status.Other

export const getStatusText = (status: Status) =>
    status === Status.Upcoming
        ? "Upcoming"
        : status === Status.Live
        ? "Live"
        : status === Status.Lunch
        ? "Lunch"
        : status === Status.Tea
        ? "Tea"
        : status === Status.Stumps
        ? "Stumps"
        : status === Status.Result
        ? "Result"
        : status === Status.Delayed
        ? "Delayed"
        : status === Status.Break
        ? "Break"
        : status === Status.Abandoned
        ? "Abandoned"
        : ""

export interface Match {
    id: string
    balls: Ball[]
    currentInnings: number
    currentBatting: number
    status: Status
    statusString: string
    teams: Team[]
    innings: Innings[]
}

export const getBattingTeam = (match: Match) =>
    match.teams[match.currentBatting]

export const getCurrentInnings = (match: Match) =>
    match.innings[match.currentInnings]

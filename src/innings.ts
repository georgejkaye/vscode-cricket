import { Status } from "./match"

export enum InningsStatus {
    Upcoming,
    Ongoing,
    AllOut,
    Declared,
    Complete,
    Result,
}

export const getInningsStatus = (innings: any, matchStatus: Status) =>
    innings.event_name === "all out"
        ? InningsStatus.AllOut
        : innings.event_name === "declared"
        ? InningsStatus.Declared
        : innings.event_name === "complete"
        ? InningsStatus.Complete
        : innings.live_current === 0
        ? InningsStatus.Complete
        : innings.live_current === 1 && matchStatus === Status.Result
        ? InningsStatus.Complete
        : InningsStatus.Ongoing

export interface Innings {
    batting: number
    bowling: number
    runs: number
    wickets: number
    status: InningsStatus
    overs: string
}

export const getInningsScore = (innings: Innings) =>
    innings.status === InningsStatus.Upcoming
        ? ""
        : innings.status === InningsStatus.Ongoing
        ? `${innings.runs}/${innings.wickets}* (${innings.overs})`
        : innings.status === InningsStatus.AllOut
        ? `${innings.runs}`
        : innings.status === InningsStatus.Declared
        ? `${innings.runs}/${innings.wickets}d`
        : innings.status === InningsStatus.Complete || InningsStatus.Result
        ? `${innings.runs}/${innings.wickets}`
        : undefined

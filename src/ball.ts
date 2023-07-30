import { Dismissal } from "./dismissal"
import { Status } from "./match"
import { Event } from "./event"

export enum Extra {
    NoBall,
    Wide,
    Bye,
    LegBye,
    Penalty,
}

export const getExtraFromText = (str: string) =>
    str === "nb"
        ? Extra.NoBall
        : str === "wd"
        ? Extra.Wide
        : str === "b"
        ? Extra.Bye
        : str === "lb"
        ? Extra.LegBye
        : str === "pen"
        ? Extra.Penalty
        : undefined

export const getExtraIndicator = (ex: Extra) =>
    ex === Extra.NoBall
        ? "nb"
        : ex === Extra.Wide
        ? "w"
        : ex === Extra.Bye
        ? "b"
        : ex === Extra.LegBye
        ? "lb"
        : ex === Extra.Penalty
        ? "pen"
        : undefined

export const getExtraName = (ex: Extra) =>
    ex === Extra.NoBall
        ? "no ball"
        : ex === Extra.Wide
        ? "wide"
        : ex === Extra.Bye
        ? "bye"
        : ex === Extra.LegBye
        ? "leg bye"
        : ex === Extra.Penalty
        ? "penalty run"
        : undefined

export enum Boundary {
    Four,
    Six,
}

export const getBoundaryName = (boundary: Boundary) =>
    boundary === Boundary.Four ? "FOUR" : "SIX"

export interface Ball {
    deliveryNo: string
    uniqueDeliveryNo: string
    batter: string
    bowler: string
    runs: number
    boundary?: Boundary
    extras?: Extra
    dismissal?: Dismissal
}

export const getBallIndicator = (ball: Ball) => {
    let extraIndicator = ball.extras ? getExtraIndicator(ball.extras) : ""
    return ball.dismissal
        ? "W"
        : `${ball.runs === 0 ? "•" : ball.runs}${extraIndicator}`
}

export const getDeliveryText = (ball: Ball) =>
    `${ball.bowler} to ${ball.batter}`

export const getRunsText = (ball: Ball) => {
    let numberText = ball.boundary
        ? `${getBoundaryName(ball.boundary)} runs`
        : ball.extras
        ? `${ball.runs} ${getExtraName(ball.extras)}`
        : ball.runs === 0
        ? "no run"
        : `${ball.runs} run`
    return ball.runs > 1 ? `${numberText}s` : numberText
}

import { Dismissal } from "./dismissal";

export enum Event {
    Four,
    Six,
    Wicket
}

export interface Ball {
    runs : number
    indicator: string
    dismissal: Dismissal | undefined
    extras: string
    deliveryNo: string
    uniqueDeliveryNo: string
    deliveryText: string
    runsText: string
    batter: string
    bowler: string
    events: Event[]
}
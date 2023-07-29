import { Dismissal } from "./dismissal"
import { Status } from "./match"
import { Event } from "./event"

export interface Ball {
    runs: number
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

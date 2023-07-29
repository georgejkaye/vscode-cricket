import { Dismissal } from "./dismissal"
import { Status, Team } from "./match"

export enum EventType {
    Four,
    Six,
    Wicket,
    BatterMilestone,
    PartnershipMilestone,
    TeamMilestone,
    StatusChange,
}

export interface BoundaryEvent {
    type: EventType.Four | EventType.Six
    batter: string
}

export interface WicketEvent {
    type: EventType.Wicket
    dismissal: Dismissal
}

export interface BatterMilestoneEvent {
    type: EventType.BatterMilestone
    batter: string
    milestone: number
}

export interface PartnershipMilestoneEvent {
    type: EventType.PartnershipMilestone
    firstBatter: string
    secondBatter: string
    milestone: number
}

export interface TeamMilestoneEvent {
    type: EventType.TeamMilestone
    team: Team
    milestone: number
}

export interface StatusChangeEvent {
    type: EventType.StatusChange
    status: Status
}

export type Event =
    | BoundaryEvent
    | WicketEvent
    | BatterMilestoneEvent
    | PartnershipMilestoneEvent
    | TeamMilestoneEvent
    | StatusChangeEvent

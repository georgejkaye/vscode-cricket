export enum Status {
    Upcoming,
    Live,
    Lunch,
    Tea,
    Stumps,
    Result,
    Abandoned,
    Delayed,
    Other,
    Break
}

export const getStatus = (data : any) => (
    data.match.result === "1" ? Status.Result :
    data.match.match_status === "dormant" ? Status.Upcoming :
    data.match.live_state === "Stumps" ? Status.Stumps :
    data.match.result_short_name === "aban" ? Status.Abandoned :
    data.match.result === "0" ? Status.Live : Status.Other
)

export const getStatusText = (status : Status) => (
    status === Status.Upcoming ? "Upcoming" :
    status === Status.Live ? "Live" :
    status === Status.Lunch ? "Lunch" :
    status === Status.Tea ? "Tea" :
    status === Status.Stumps ? "Stumps" :
    status === Status.Result ? "Result" :
    status === Status.Delayed ? "Delayed" :
    status === Status.Break ? "Break" : ""
)
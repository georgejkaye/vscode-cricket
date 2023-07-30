import * as vscode from "vscode"
import { getDismissalString } from "./dismissal"
import {
    Match,
    Status,
    Team,
    getBattingTeam,
    getCurrentInnings,
    getMatchDescription,
    getStatusText,
} from "./match"
import { Innings, InningsStatus } from "./innings"
import {
    Ball,
    getBallIndicator,
    getBoundaryName,
    getDeliveryText,
    getRunsText,
} from "./ball"
import { getMatch, getSummary } from "./tasks"
import { EventType, Event, TeamMilestoneEvent } from "./event"

let statusBarItem: vscode.StatusBarItem

const noBallsShown = 6

const getInningsScore = (match: Match, inn: Innings, showOvers: boolean) => {
    if (inn.status === InningsStatus.AllOut) {
        return `${inn.runs}`
    }
    if (inn.status === InningsStatus.Declared) {
        return `${inn.runs}d`
    }
    if (
        inn.status === InningsStatus.Complete ||
        inn.status === InningsStatus.Result
    ) {
        return `${inn.runs}/${inn.wickets}`
    }
    let oversText = showOvers ? ` (${match.balls[0].deliveryNo})` : ""
    return `${inn.runs}/${inn.wickets}*${oversText}`
}

const getTeamScore = (match: Match, innings: Innings[], team: Team) => {
    let teamInnings = innings.filter((inn) => inn.batting === team.id)
    return teamInnings
        .map((inn) => getInningsScore(match, inn, true))
        .join(" & ")
}

const updateStatusBarItem = (matches: { [key: string]: Match }) => {
    let statusBarText = Object.entries(matches).reduce((acc, [id, match]) => {
        const getTeamName = (team: Team) => team.shortName
        const getTeamSummary = (team: Team) =>
            `${getTeamName(team)} ${getTeamScore(match, match.innings, team)}`
        let summaryText = `${getTeamSummary(
            match.teams[0]
        )} vs ${getTeamSummary(match.teams[1])}`

        let statusText = getStatusText(match.status)
        let resultText =
            statusText === "Result" ? ` (${match.statusString})` : ""

        let text = `${summaryText} | ${statusText}${resultText}`
        return `${acc} | ${text}`
        // let tableLines = shownBalls
        //     .map(
        //         (b) =>
        //             `|${getDeliveryNo(b)}|${getBallIndicator(
        //                 b
        //             )}|${getDeliveryText(b)}|`
        //     )
        //     .join("\n")
        // let tableHeader = "||||\n|-|:-:|-|"
        // let tooltip = new vscode.MarkdownString(`${tableHeader}\n${tableLines}`)
        // statusBarItem.tooltip = tooltip
    }, "")
    statusBarItem.text = statusBarText
    if (Object.entries(matches).length > 0) {
        statusBarItem.show()
    } else {
        statusBarItem.hide()
    }
}

const notifyEvent = (event: Event, match: Match) => {
    let battingTeam = match.teams[match.currentBatting]
    let currentInnings = match.innings[match.currentInnings]
    var text = ""
    switch (event.type) {
        case EventType.Boundary:
            let boundaryText = getBoundaryName(event.boundary)
            text = `${boundaryText}! (${event.batter}) ${
                battingTeam.shortName
            } ${getInningsScore(match, currentInnings, false)}`
            break
        case EventType.Wicket:
            text = `OUT! ${getDismissalString(event.dismissal)} ${
                getBattingTeam(match).shortName
            } ${getInningsScore(match, currentInnings, false)}`
        default:
            text = ""
    }
    if (text !== "") {
        vscode.window.showInformationMessage(text)
    }
}

const followedMatchesKey = "followedMatches"

const handleDelivery = (ball: Ball, match: Match) => {
    let currentInnings = getCurrentInnings(match)
    let currentScore = getInningsScore(match, currentInnings, false)
    let notificationText = `(${ball.deliveryNo}) ${getDeliveryText(
        ball
    )} (${getRunsText(ball)}). ${
        getBattingTeam(match).shortName
    } are ${currentScore}.`
    vscode.window.showInformationMessage(notificationText)
    if (ball.boundary) {
        notifyEvent(
            {
                type: EventType.Boundary,
                boundary: ball.boundary,
                batter: ball.batter,
            },
            match
        )
    }
    if (ball.dismissal) {
        notifyEvent(
            {
                type: EventType.Wicket,
                dismissal: ball.dismissal,
            },
            match
        )
    }
}

const generateMultiples = (
    highValue: number,
    lowValue: number,
    multiplier: number
) => {
    let highestCoefficient = Math.floor(highValue / multiplier)
    let lowestCoefficient = Math.floor(lowValue / multiplier)
    return Array.from(
        { length: highestCoefficient - lowestCoefficient },
        (_, i) => (i + lowestCoefficient) * multiplier
    )
}

const computeEvents = (match: Match, previousMatch: Match) => {
    let events: Event[] = []
    let currentInnings = getCurrentInnings(match)
    let previousInnings = getCurrentInnings(previousMatch)
    // Team milestones
    let runMultiples = generateMultiples(
        currentInnings.runs,
        previousInnings.runs,
        50
    )
    let runMilestones: TeamMilestoneEvent[] = runMultiples.map((multiple) => ({
        type: EventType.TeamMilestone,
        team: getBattingTeam(match),
        milestone: multiple,
    }))
    events.concat(runMilestones)
    return events
}

const updateMatches = async (context: vscode.ExtensionContext) => {
    let previousMatches: { [key: string]: Match } | undefined =
        context.globalState.get(followedMatchesKey)
    if (previousMatches) {
        let newMatches: { [key: string]: Match } = {}
        for (const [id, previousMatch] of Object.entries(previousMatches)) {
            let newMatch = await getMatch(id)
            if (newMatch.balls.length > 0) {
                let unseenBalls = newMatch.balls.filter(
                    (ball) =>
                        parseFloat(ball.uniqueDeliveryNo) >
                        parseFloat(previousMatch.balls[0].uniqueDeliveryNo)
                )
                unseenBalls.forEach((ball) => handleDelivery(ball, newMatch))
            }
            newMatches[id] = newMatch
        }
        updateStatusBarItem(newMatches)
        context.globalState.update(followedMatchesKey, newMatches)
    }
}

const startFollowingMatch = async (
    context: vscode.ExtensionContext,
    id: string
) => {
    let matches: { [key: string]: Match } | undefined =
        context.globalState.get(followedMatchesKey)
    if (matches) {
        let match = await getMatch(id)
        let newMatches: { [key: string]: Match } = matches
        newMatches[id] = match
        context.globalState.update(followedMatchesKey, newMatches)
        updateMatches(context)
    }
}

const stopFollowingMatch = (
    context: vscode.ExtensionContext,
    newId: string
) => {
    let matches: { [key: string]: Match } | undefined =
        context.globalState.get(followedMatchesKey)
    if (matches) {
        let newMatchesArray = Object.entries(matches).filter(
            ([id, match]) => id !== newId
        )
        let newMatches: { [key: string]: Match } = {}
        newMatchesArray.forEach(([id, match]) => (newMatches[id] = match))
        context.globalState.update(followedMatchesKey, newMatches)
        updateMatches(context)
    }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log(
        'Congratulations, your extension "vscode-cricket" is now active!'
    )

    context.globalState.setKeysForSync([followedMatchesKey])
    context.globalState.update(followedMatchesKey, {})

    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    )
    context.subscriptions.push(statusBarItem)

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let followMatch = vscode.commands.registerCommand(
        "vscode-cricket.followMatch",
        async () => {
            let matches = await getSummary()
            let option = await vscode.window.showQuickPick(matches)
            if (option) {
                startFollowingMatch(context, option.id)
            }
        }
    )

    let stopFollowMatch = vscode.commands.registerCommand(
        "vscode-cricket.stopFollowMatch",
        async () => {
            let currentMatches: { [key: string]: Match } | undefined =
                context.globalState.get(followedMatchesKey)
            if (currentMatches) {
                let followedMatchesOptions = Object.entries(currentMatches).map(
                    ([id, match]) => ({
                        label: getMatchDescription(match),
                        id,
                    })
                )
                if (followedMatchesOptions.length > 0) {
                    let option = await vscode.window.showQuickPick(
                        followedMatchesOptions
                    )
                    if (option) {
                        stopFollowingMatch(context, option.id)
                    }
                }
            }
        }
    )
    context.subscriptions.push(followMatch)
    context.subscriptions.push(stopFollowMatch)

    const updateSeconds = 5

    setInterval(async () => {
        updateMatches(context)
    }, updateSeconds * 1000)
}

export function deactivate(context: vscode.ExtensionContext) {}

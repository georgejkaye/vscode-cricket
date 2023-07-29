// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getDismissalString } from './dismissal';
import { Match, Status, Team, getStatusText } from './match';
import { Innings, InningsStatus } from './innings';
import { Event, Ball } from './ball';
import { getBattingTeam, getCurrentInnings, getMatch, getSummary } from './tasks';

let statusBarItem : vscode.StatusBarItem;

const noBallsShown = 6;


const getInningsScore = (match : Match, inn : Innings, showOvers : boolean) => {
	if(inn.status === InningsStatus.AllOut) {
		return `${inn.runs}`;
	}
	if(inn.status === InningsStatus.Declared) {
		return `${inn.runs}d`;
	}
	if(inn.status === InningsStatus.Complete || inn.status === InningsStatus.Result) {
		return `${inn.runs}/${inn.wickets}`;
	}
	let oversText = showOvers ? ` (${match.balls[0].deliveryNo})` : "";
	return `${inn.runs}/${inn.wickets}*${oversText}`;
};

const getTeamScore = (match : Match, innings: Innings[], team : Team) => {
	let teamInnings = innings.filter((inn) => inn.batting === team.id);
	return teamInnings.map((inn) => getInningsScore(match, inn, true)).join(" & ");
};

const updateStatusBarItem = (matches : Match[]) => {
	for(const match of matches) {
		const getTeamName = (team : Team) => team.shortName;
		const getTeamSummary = (team : Team) => `${getTeamName(team)} ${getTeamScore(match, match.innings, team)}`;
		let summaryText = `${getTeamSummary(match.teams[0])} vs ${getTeamSummary(match.teams[1])}`;

		let statusText = getStatusText(match.status);
		let resultText = statusText === "Result" ? ` (${match.statusString})` : "";

		let shownBalls = match.balls.slice(0, noBallsShown);
		let shownBallsText =
			match.status === Status.Live ?
				` | ${shownBalls.map((ball) => ball.indicator).join(" | ")} |` : "";

		statusBarItem.text = `${summaryText} | ${statusText}${resultText}${shownBallsText}`;
	}
};

const notifyEvent = (event: Event, ball: Ball, match : Match) => {
	let battingTeam = match.teams[match.currentBatting];
	let currentInnings = match.innings[match.currentInnings];
	let text =
		event === Event.Four ?
			`FOUR! (${ball.batter}) ${battingTeam.shortName} ${getInningsScore(match, currentInnings, false)}` :
		event === Event.Six ?
			`SIX! (${ball.batter}) ${battingTeam.shortName} ${getInningsScore(match, currentInnings, false)}` :
		event === Event.Wicket ?
			`OUT! ${ball.dismissal ? getDismissalString(ball.dismissal) : ""} ${match.teams[currentInnings.batting].shortName} ${getInningsScore(match, currentInnings, false)}`:
		"";
	if(text !== "") {
		vscode.window.showInformationMessage(text);
	}
};

const followedMatchesKey = "followedMatches";
const lastDeliveryKey = "lastDelivery";
const previousMatchesKey = "previousMatches";

const handleDelivery = (ball : Ball, match : Match) => {
	let currentInnings = getCurrentInnings(match);
	let currentScore = getInningsScore(match, currentInnings, false);
	vscode.window.showInformationMessage(`(${ball.deliveryNo}) ${ball.deliveryText} (${ball.runsText}). ${getBattingTeam(match).shortName} are ${currentScore}.`);
	ball.events.forEach((event) => notifyEvent(event, ball, match));
};

const updateMatches = async (context : vscode.ExtensionContext) => {
	let currentMatchString : string | undefined = context.globalState.get(followedMatchesKey);
		if(currentMatchString) {
			let currentMatches = currentMatchString.split(",");
			let matches : Match[] = [];
			let previousMatchesString : string | undefined = context.globalState.get(previousMatchesKey);
			let previousMatches : { [key: string] : Match } =
				previousMatchesString ? JSON.parse(previousMatchesString) : [];
			for(const currentMatch of currentMatches) {
				let previousMatch = previousMatches[currentMatch];
				let match = await getMatch(currentMatch);
				matches.push(match);
				if(match.balls.length > 0) {
					if(previousMatch) {
						let unseenBalls = match.balls.filter((ball) =>
							parseFloat(ball.uniqueDeliveryNo) > parseFloat(previousMatch.balls[0].uniqueDeliveryNo)
						);
						unseenBalls.forEach((ball) => handleDelivery(ball, match));
					}
					let lastBall = match.balls[0];
					context.globalState.update(lastDeliveryKey, lastBall.uniqueDeliveryNo);
				}
			}
			updateStatusBarItem(matches);
			let matchesString = JSON.stringify(matches);
			context.globalState.update(previousMatchesKey, matchesString);
		}
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-cricket" is now active!');

	context.globalState.setKeysForSync(
		[followedMatchesKey, lastDeliveryKey, previousMatchesKey]
	);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let followMatch = vscode.commands.registerCommand('vscode-cricket.followMatch', async () => {
		let matches = await getSummary();
		let option = await vscode.window.showQuickPick(matches);
		if(option) {
			context.globalState.update(followedMatchesKey, option.id);
			updateMatches(context);
			statusBarItem.show();
		}
	});

	let stopFollowMatch = vscode.commands.registerCommand('vscode-cricket.stopFollowMatch', async () => {
		context.globalState.update(followedMatchesKey, undefined);
		statusBarItem.hide();
	});
	statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right, 100
	);
	context.subscriptions.push(statusBarItem);

	context.subscriptions.push(followMatch);
	context.subscriptions.push(stopFollowMatch);

	const updateSeconds = 5;

	setInterval(async () => {
		updateMatches(context);
	}, updateSeconds * 1000);
}

// This method is called when your extension is deactivated
export function deactivate() {}

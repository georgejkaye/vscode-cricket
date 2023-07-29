// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getMatch, getSummary, Match, Ball, Event, Team, Innings, InningsStatus } from './tasks';
import { getDismissalString } from './dismissal';
import { Status, getStatusText } from './status';

let statusBarItem : vscode.StatusBarItem;

const noBallsShown = 6;


const getInningsScore = (match : Match, inn : Innings) => {
	if(inn.status === InningsStatus.AllOut) {
		return `${inn.runs}`;
	}
	if(inn.status === InningsStatus.Declared) {
		return `${inn.runs}d`;
	}
	if(inn.status === InningsStatus.Complete || inn.status === InningsStatus.Result) {
		return `${inn.runs}/${inn.wickets}`;
	}
	return `${inn.runs}/${inn.wickets}* (${match.balls[0].deliveryNo})`;
};

const getTeamScore = (match : Match, innings: Innings[], team : Team) => {
	let teamInnings = innings.filter((inn) => inn.batting === team.id);
	return teamInnings.map((inn) => getInningsScore(match, inn)).join(" & ");
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
			`FOUR! (${ball.batter}) ${battingTeam.shortName} ${getInningsScore(match, currentInnings)}` :
		event === Event.Six ?
			`SIX! (${ball.batter}) ${battingTeam.shortName} ${getInningsScore(match, currentInnings)}` :
		event === Event.Wicket ?
			`OUT! ${ball.dismissal ? getDismissalString(ball.dismissal) : ""} ${match.teams[currentInnings.batting].shortName} ${getInningsScore(match, currentInnings)}`:
		"";
	if(text !== "") {
		vscode.window.showInformationMessage(text);
	}
};

const followedMatchesKey = "followedMatches";
const lastDeliveryKey = "lastDelivery";

const updateMatches = async (context : vscode.ExtensionContext) => {
	let currentMatchString : string | undefined = context.globalState.get(followedMatchesKey);
		if(currentMatchString) {
			let currentMatches = currentMatchString.split(",");
			let matches : Match[] = [];
			for(const currentMatch of currentMatches) {
				let match = await getMatch(currentMatch);
				matches.push(match);
				if(match.balls.length > 0) {
					let lastBall = match.balls[0];
					let lastDelivery = context.globalState.get(lastDeliveryKey);
					if(!lastDelivery || lastDelivery !== lastBall.uniqueDeliveryNo){
						context.globalState.update(lastDeliveryKey, lastBall.uniqueDeliveryNo);
						// vscode.window.showInformationMessage(`(${lastBall.deliveryNo}) ${lastBall.deliveryText} (${lastBall.runsText}). ${match.teams[match.batting].shortName} are ${match.runs}/${match.wickets}.`);
						lastBall.events.forEach((event) => notifyEvent(event, lastBall, match));
					}
				}
			}
			updateStatusBarItem(matches);
		}
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-cricket" is now active!');

	context.globalState.setKeysForSync([followedMatchesKey]);
	context.globalState.setKeysForSync([lastDeliveryKey]);

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

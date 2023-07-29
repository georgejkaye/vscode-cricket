// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getMatchData, getSummary, Data, Ball, Event, Team, Innings } from './tasks';
import { getDismissalString } from './dismissal';

let statusBarItem : vscode.StatusBarItem;

const noBallsShown = 6;


const getInningsScore = (data : Data, inn : Innings) => {
	if(inn.status === "all out") {
		return `${inn.runs}`;
	}
	if(inn.status === "declared") {
		return `${inn.runs}d`;
	}
	if(inn.status === "complete") {
		return `${inn.runs}/${inn.wickets}`;
	}
	return `${inn.runs}/${inn.wickets}* (${data.balls[0].deliveryNo})`;
};

const getTeamScore = (data : Data, innings: Innings[], team : Team) => {
	let teamInnings = innings.filter((inn) => inn.batting === team.id);
	return teamInnings.map((inn) => getInningsScore(data, inn)).join(" & ");
};

const updateStatusBarItem = (data : Data) => {
	const getTeamName = (team : Team) => team.shortName;
	const getTeamSummary = (team : Team) => `${getTeamName(team)} ${getTeamScore(data, data.innings, team)}`;
	let summaryText = `${getTeamSummary(data.teams[0])} vs ${getTeamSummary(data.teams[1])}`;

	let shownBalls = data.balls.slice(0, noBallsShown);
	let shownBallsText = shownBalls.map((ball) => ball.indicator).join(" | ");

	statusBarItem.text = `${summaryText} | ${shownBallsText} |`;
};

const notifyEvent = (event: Event, ball: Ball, data : Data) => {
	let battingTeam = data.teams[data.currentBatting];
	let currentInnings = data.innings[data.currentInnings];
	let text =
		event === Event.Four ?
			`FOUR! (${ball.batter}) ${battingTeam.shortName} ${getInningsScore(data, currentInnings)}` :
		event === Event.Six ?
			`SIX! (${ball.batter}) ${battingTeam.shortName} ${getInningsScore(data, currentInnings)}` :
		event === Event.Wicket ?
			`OUT! ${ball.dismissal ? getDismissalString(ball.dismissal) : ""} ${getInningsScore(data, currentInnings)}`:
		"";
	if(text !== "") {
		vscode.window.showInformationMessage(text);
	}
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-cricket" is now active!');

	const currentMatchKey = "currentMatch";
	const lastDeliveryKey = "lastDelivery";
	context.globalState.setKeysForSync([currentMatchKey]);
	context.globalState.setKeysForSync([currentMatchKey]);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let followMatch = vscode.commands.registerCommand('vscode-cricket.followMatch', async () => {
		let matches = await getSummary();
		let option = await vscode.window.showQuickPick(matches);
		if(option) {
			context.globalState.update(currentMatchKey, option.id);
			let data = await getMatchData(option.id);
			updateStatusBarItem(data);
			statusBarItem.show();
		}
	});

	let stopFollowMatch = vscode.commands.registerCommand('vscode-cricket.stopFollowMatch', async () => {
		context.globalState.update(currentMatchKey, undefined);
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
		let currentMatch : string | undefined = context.globalState.get(currentMatchKey);
		if(currentMatch) {
			let data = await getMatchData(currentMatch);
			console.log(data)
			let lastBall = data.balls[0];
			let lastDelivery = context.globalState.get(lastDeliveryKey);
			if(!lastDelivery || lastDelivery !== lastBall.uniqueDeliveryNo){
				context.globalState.update(lastDeliveryKey, lastBall.uniqueDeliveryNo);
				// vscode.window.showInformationMessage(`(${lastBall.deliveryNo}) ${lastBall.deliveryText} (${lastBall.runsText}). ${data.teams[data.batting].shortName} are ${data.runs}/${data.wickets}.`);
				lastBall.events.forEach((event) => notifyEvent(event, lastBall, data));
				updateStatusBarItem(data);
			}
		}
	}, updateSeconds * 1000);
}

// This method is called when your extension is deactivated
export function deactivate() {}

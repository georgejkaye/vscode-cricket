// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getMatchData, getSummary, Data } from './tasks';

let statusBarItem : vscode.StatusBarItem

const noBallsShown = 6;

const updateStatusBarItem = (data : Data) => {
	let shownBalls = data.balls.slice(0, noBallsShown);
	let shownBallsText = shownBalls.map((ball) => ball.indicator).join(" | ");
	statusBarItem.text = `${data.teams[0].shortName} vs ${data.teams[1].shortName} (${data.balls[0].deliveryNo}) | ${shownBallsText} | ${data.runs}/${data.wickets}`;
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
			let lastBall = data.balls[0];
			let lastDelivery = context.globalState.get(lastDeliveryKey);
			if(!lastDelivery || lastDelivery !== lastBall.uniqueDeliveryNo){
				context.globalState.update(lastDeliveryKey, lastBall.uniqueDeliveryNo);
				vscode.window.showInformationMessage(`(${lastBall.deliveryNo}) ${lastBall.players} (${lastBall.event}). ${data.teams[data.batting].shortName} are ${data.runs}/${data.wickets}.`);
				updateStatusBarItem(data);
			}
		}
	}, updateSeconds * 1000);
}

// This method is called when your extension is deactivated
export function deactivate() {}

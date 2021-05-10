// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { KubeConfig } from '@kubernetes/client-node';
import * as vscode from 'vscode';
import { TiltDevV1alpha1Api } from './gen/api';
import { newTiltClient, newTiltClientFromConfig, newTiltConfig } from './lib/client';

const cfg = newTiltConfig() as KubeConfig;
cfg.currentContext = 'tilt-default';
const cli = newTiltClientFromConfig(cfg) as TiltDevV1alpha1Api;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "tilt-vscode" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('tilt-vscode.helloWorld', async () => {
		// The code you place here will be executed every time your command is executed

		const session = await cli.readSession("Tiltfile");

		// Display a message box to the user
		vscode.window.showInformationMessage(`Activated Tilt extension for ${session.body.spec?.tiltfilePath}!`);
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

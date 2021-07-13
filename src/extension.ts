// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TiltPanel } from './panel';
import { StatusBar } from './statusBar';
import { SessionWatcher } from './watcher';

let watcher: SessionWatcher;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('tilt-vscode extension loaded');

	watcher = new SessionWatcher();
	context.subscriptions.push(watcher);

	const statusBar = new StatusBar();
	context.subscriptions.push(statusBar);
	watcher.addSubscriber(statusBar);


	context.subscriptions.push(
		vscode.commands.registerCommand('extension.tiltstatus.start', () => {
			TiltPanel.createOrShow(context.extensionUri, watcher);
		})
	  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

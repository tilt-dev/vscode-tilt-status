// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ext } from './extensionVariables';
import { StatusBar } from './statusBar';
import { newTiltClientFromConfig, newTiltConfig } from './lib/client';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('tilt-vscode extension loaded');

	ext.context = context;

	const config = newTiltConfig();
	config.currentContext = 'tilt-default';
	ext.config = config;
	ext.client = newTiltClientFromConfig(ext.config);
	ext.statusBar = new StatusBar();

	context.subscriptions.push(ext.statusBar);
}

// this method is called when your extension is deactivated
export function deactivate() {}

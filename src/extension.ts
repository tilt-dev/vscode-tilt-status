// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ext } from './extensionVariables';
import { newTiltClientFromConfig, newTiltConfig } from './lib/client';
import { CHANGE, ERROR, ListWatch, Watch } from '@kubernetes/client-node';
import { SessionSubscriber } from './status';
import { TiltPanel } from './panel';
import { StatusBar } from './statusBar';
import { V1alpha1Session } from './gen/api';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('tilt-vscode extension loaded');

	ext.context = context;

	const config = newTiltConfig();
	config.currentContext = 'tilt-default';
	ext.config = config;
	ext.client = newTiltClientFromConfig(ext.config);

	const statusBar = new StatusBar();
	let sessionSubscribers: SessionSubscriber[] = [statusBar];
	let currentSession: V1alpha1Session | undefined = undefined;
	const sessionWatch = new Watch(ext.config);
	const sessionListFn = () => ext.client.listSession();
	const sessions = new ListWatch('/apis/tilt.dev/v1alpha1/sessions', sessionWatch, sessionListFn, true);
	sessions.on(CHANGE, (session) => {
		currentSession = session;
		sessionSubscribers.forEach(s => s.updateSession(session));
	});
	sessions.on(ERROR, (obj) => {
		console.error(`Session Watch Error: ${obj}`);
	});

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.tiltstatus.start', () => {
			if (!sessionSubscribers.some(s => s instanceof TiltPanel)) {
				const panel = new TiltPanel();
				if (currentSession) {
					panel.updateSession(currentSession);
				}
				sessionSubscribers.push(panel);

			}
		})
	  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

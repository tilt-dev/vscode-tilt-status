// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { KubeConfig } from '@kubernetes/client-node';
import * as vscode from 'vscode';
import { ext } from './extensionVariables';
import { TiltDevV1alpha1Api } from './gen/api';
import { newTiltClient, newTiltClientFromConfig, newTiltConfig } from './lib/client';
import { ResourceProvider } from './resourceProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('tilt-vscode extension loaded');

	ext.context = context;

	const config = newTiltConfig();
	config.currentContext = 'tilt-default';
	ext.config = config;
	ext.client = newTiltClientFromConfig(ext.config);

	const resourcesProvider = new ResourceProvider();
	vscode.window.registerTreeDataProvider('tiltResources', resourcesProvider);
}

// this method is called when your extension is deactivated
export function deactivate() {}

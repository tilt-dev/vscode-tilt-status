// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ext } from './extensionVariables';
import { newTiltClientFromConfig, newTiltConfig } from './lib/client';
import { V1alpha1Session, V1alpha1Target } from './gen/api';
import { CHANGE, ERROR, ListWatch, Watch } from '@kubernetes/client-node';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('tilt-vscode extension loaded');

	ext.context = context;

	const config = newTiltConfig();
	config.currentContext = 'tilt-default';
	ext.config = config;
	ext.client = newTiltClientFromConfig(ext.config);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.tiltstatus.start', () => {
		  const panel = vscode.window.createWebviewPanel(
			'tiltStatus',
			'Tilt Status',
			vscode.ViewColumn.Beside,
			{}
		  );

		  panel.title = "Tilt Status";
		  panel.webview.html = getWebviewContent(undefined);

		  const sessionWatch = new Watch(ext.config);
		  const sessionListFn = () => ext.client.listSession();
		  const sessions = new ListWatch('/apis/tilt.dev/v1alpha1/sessions', sessionWatch, sessionListFn, true);
		  sessions.on(CHANGE, (session) => {
			  console.log(`Session ${session.metadata?.name} changed`);
			  panel.webview.html = getWebviewContent(allTargetsHealthy(session));
		  });
		  sessions.on(ERROR, (obj) => {
			  console.error(`Session Watch Error: ${obj}`);
		  });
		})
	  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

enum Status {
    unknown = "unknown",
    disabled = "disabled",
    pending = "pending",
    ok = "ok",
    error = "error"
}

function allTargetsHealthy(session: V1alpha1Session): boolean | undefined {
    return session.status?.targets?.every(t => targetStatus(t) === Status.ok);
}

function targetStatus(target: V1alpha1Target): Status {
    if (target.state.waiting) {
        return Status.pending;
    }

    if (target.state.active) {
        if (target.type === 'job' || !target.state.active.ready) {
            return Status.pending;
        }
        return Status.ok;
    }

    if (target.state.terminated) {
        // HACK: finish time is sometimes undefined, so just pick start time instead
        const time = target.state.terminated.finishTime ?? target.state.terminated.startTime;
        if (target.type === 'server' || target.state.terminated.error) {
            return Status.error;
        }
        return Status.ok;
    }

    return Status.disabled;
}

const angryGooseGifUrl = "https://i.giphy.com/media/46FnILpX7oJKo/giphy.webp";
const happyGooseGifUrl = "https://i.giphy.com/media/Jp3v0iCuOI3vpCFvf4/giphy.webp";

function getWebviewContent(allTargetsHealthy: boolean | undefined) {
	if (allTargetsHealthy === undefined) {
		return `<html>Loading...</html>`;
	}

	const gifUrl = allTargetsHealthy ? happyGooseGifUrl : angryGooseGifUrl;
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Tilt Status</title>
  </head>
  <body>
	  <img src="${gifUrl}" width="300" />
  </body>
  </html>`;
}
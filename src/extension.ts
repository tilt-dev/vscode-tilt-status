// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ext } from './extensionVariables';
import { newTiltClientFromConfig, newTiltConfig } from './lib/client';
import { V1alpha1Session, V1alpha1Target } from './gen/api';
import { CHANGE, ERROR, ListWatch, Watch } from '@kubernetes/client-node';
import fetch from 'node-fetch';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('tilt-vscode extension loaded');

	ext.context = context;

	const config = newTiltConfig();
	config.currentContext = 'tilt-default';
	ext.config = config;
	ext.client = newTiltClientFromConfig(ext.config);

	let currentSession: V1alpha1Session | undefined = undefined;

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.tiltstatus.start', () => {
		  const panel = vscode.window.createWebviewPanel(
			'tiltStatus',
			'Tilt Status',
			vscode.ViewColumn.Beside,
			{
				enableScripts: true,
			}
		  );

		  panel.title = "Tilt Status";
		  panel.webview.html = getWebviewContent(undefined);

		  const sessionWatch = new Watch(ext.config);
		  const sessionListFn = () => ext.client.listSession();
		  const sessions = new ListWatch('/apis/tilt.dev/v1alpha1/sessions', sessionWatch, sessionListFn, true);
		  sessions.on(CHANGE, (session) => {
			  currentSession = session;
			  panel.webview.html = getWebviewContent(targetStatuses(session));
		  });
		  sessions.on(ERROR, (obj) => {
			  console.error(`Session Watch Error: ${obj}`);
		  });

		  panel.webview.onDidReceiveMessage(
			  message => {
				  switch (message.command) {
					  case 'trigger':
						  if (!currentSession) {
							  return;
						  }
						  const resourceName = resourceNameFromTargetName(message.targetName, currentSession);
						  if (!resourceName) {
							  return;
						  }
						  triggerBuild(resourceName);
						  return;
				  }
			  },
			  null
		  );
		})
	  );
}

function resourceNameFromTargetName(targetName: string, session: V1alpha1Session): string | undefined {
	const targets = session.status?.targets.filter(t => t.name === targetName);
	if (!targets?.length || !targets[0].resources?.length) {
		return undefined;
	}
	// for now, assume every target has one resource
	return targets[0].resources[0];
}

function triggerBuild(resourceName: string) {
	// This assumes Tilt is running on localhost:10350. Ideally we'd be doing this through the Tilt object API
	// instead of the legacy API, but that's not supported yet.
	let url = "http://localhost:10350/api/trigger";
	
	console.log(`triggering ${resourceName}`);
	fetch(url, {
		method: "post",
		body: JSON.stringify({
			manifest_names: [resourceName],
			build_reason: 16 /* BuildReasonFlagTriggerWeb */,
		}),
	}).then((response) => {
		if (!response.ok) {
			console.log(`failed to trigger ${resourceName}`, response.status, response);
		} else {
			console.log("successfully triggered");
		}
	});
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

function targetStatuses(session: V1alpha1Session): {name: string, status: Status}[] | undefined {
    return session.status?.targets?.map(t => ({name: t.name, status: targetStatus(t)}));
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

const statusColors = new Map<Status, string>([
	[Status.ok, "green"],
	[Status.error, "red"],
	[Status.pending, "yellow"],
]);

function targetRow(name: string, status: Status) {
	return `<tr>
		<td>${name}</td>
		<td style="color: ${statusColors.get(status) || "black"}">${status}</td>
		<td>
			<button onClick={triggerTarget("${name}")}
			        style="border: transparent; background: transparent; border: none;">
			🔄
			</button>
		</td>
	</tr>`;
}

function getWebviewContent(targetStatuses: {name: string, status: Status}[] | undefined) {
	if (targetStatuses === undefined) {
		return `<html>Loading...</html>`;
	}

	const gifUrl = targetStatuses?.every(({status}) => status === Status.ok) ? happyGooseGifUrl : angryGooseGifUrl;
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Tilt Status</title>
  </head>
  <script>
    // the webview can't talk to tilt directly because of CORS, so it has to send a message to the extension
	// and have vscode make the call for it
  	const vscode = acquireVsCodeApi();
  	function triggerTarget(targetName) {
		vscode.postMessage({command: 'trigger', targetName: targetName});
	}
  </script>
  <body>
	  <img src="${gifUrl}" width="300" />
	  <table>
	  ${targetStatuses.map(({name, status}) => targetRow(name, status)).join("\n")}
	  </table>
  </body>
  </html>`;
}
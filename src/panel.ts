import { Status, aggregateStatus, targetStatus} from "./status";
import * as vscode from 'vscode';
import { V1alpha1Session, V1alpha1Target } from './gen/api';
import fetch from 'node-fetch';
import { SessionSubscriber } from "./watcher";


export class TiltPanel implements vscode.Disposable, SessionSubscriber {
	currentSession: V1alpha1Session | undefined = undefined;
    static currentPanel: TiltPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;

    public static createOrShow() {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (TiltPanel.currentPanel) {
			TiltPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
            'tiltStatus',
            'Tilt Status',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
            }
          );

		TiltPanel.currentPanel = new TiltPanel(panel);
	}

    constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;

        this._panel.title = "Tilt Status";

        this._panel.onDidDispose(() => this.dispose());

        this.updateSession(undefined);
    
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'triggerResource':
                        if (!this.currentSession) {
                            break;
                        }
                        triggerBuild(message.resourceName);
                        break;
                    default:
                        console.log(`got message with unknown command ${message.command}`);
                        break;
                }
            },
            null
          );
    }

    dispose() {
        TiltPanel.currentPanel = undefined;
        this._panel.dispose();
    }

    updateSession(session: V1alpha1Session | undefined) {
        this.currentSession = session;
        this._panel.webview.html = getWebviewContent(session);
    }
}

const statusColors = new Map<Status, string>([
	[Status.ok, "green"],
	[Status.error, "red"],
	[Status.pending, "yellow"],
]);

function targetRow(t: V1alpha1Target) {
    const status = targetStatus(t);
    const button = !t.resources.length ? "" : `<td>
        <button onClick={triggerResource("${t.resources[0]}")}
                style="border: transparent; background: transparent; border: none;">
        🔄
        </button>
    </td>`;
	return `<tr>
		<td>${t.name}</td>
		<td style="color: ${statusColors.get(status) || "black"}">${status}</td>
		${button}
	</tr>`;
}

const gifUrls = new Map<string,string>([
    [Status.ok, "https://i.giphy.com/media/Jp3v0iCuOI3vpCFvf4/giphy.webp"],
    [Status.pending, ""],
    [Status.error, "https://i.giphy.com/media/46FnILpX7oJKo/giphy.webp"],
]);

function getWebviewContent(session: V1alpha1Session | undefined) {
	if (session === undefined) {
		return `<html>Waiting for Tilt API Server...</html>`;
	}

	const gifUrl = gifUrls.get(aggregateStatus(session));
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
  	function triggerResource(name) {
		vscode.postMessage({command: 'triggerResource', resourceName: name});
	}
  </script>
  <body>
	  <img src="${gifUrl}" width="300" />
	  <table>
	  ${session.status?.targets.map(t => targetRow(t)).join("\n")}
	  </table>
  </body>
  </html>`;
}

function triggerBuild(resourceName: string) {
	// This assumes Tilt is running on localhost:10350. Ideally we'd be doing this through the Tilt object API
	// instead of the legacy API, but that's not supported yet.
	let url = "http://localhost:10350/api/trigger";
	
	fetch(url, {
		method: "post",
		body: JSON.stringify({
			manifest_names: [resourceName],
			build_reason: 16 /* BuildReasonFlagTriggerWeb */,
		}),
	}).then((response) => {
		if (!response.ok) {
			console.log(`failed to trigger ${resourceName}`, response.status, response);
		}
	});
}

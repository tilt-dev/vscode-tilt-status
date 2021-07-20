import * as vscode from 'vscode';
import * as path from 'path';
import { V1alpha1Session, V1alpha1Target } from './gen/api';
import fetch from 'node-fetch';
import { SessionSubscriber, SessionWatcher } from "./watcher";


export class TiltPanel implements vscode.Disposable, SessionSubscriber {
	currentSession: V1alpha1Session | undefined = undefined;
    static currentPanel: TiltPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private readonly watcher: SessionWatcher;
    private readonly extensionUri: vscode.Uri;

public static createOrShow(extensionUri: vscode.Uri, watcher: SessionWatcher) {
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
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
            }
          );

		TiltPanel.currentPanel = new TiltPanel(panel, extensionUri, watcher);
	}

    constructor(panel: vscode.WebviewPanel, extensionPath: vscode.Uri, watcher: SessionWatcher) {
        this.extensionUri = extensionPath;
        this._panel = panel;

        this._panel.title = "Tilt Status";

        this._panel.webview.html = this.getWebviewContent();

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
                    case 'honk':
                        honk();
                        break;
                    default:
                        console.log(`got message with unknown command ${message.command}`);
                        break;
                }
            },
            null
          );

          this.watcher = watcher;
          watcher.addSubscriber(this);
    }

    dispose() {
        TiltPanel.currentPanel = undefined;
        this.watcher.removeSubscriber(this);
        this._panel.dispose();
    }

    updateSession(session: V1alpha1Session | undefined) {
        if (!this._panel) {
            return;
        }
        this.currentSession = session;
        this._panel.webview.postMessage({
            command: 'setSession',
            session: session,
        });
    }

    mediaUri(path: string): string {
        return this._panel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', path)).toString();
    }

    getWebviewContent(): string {    
        return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tilt Status</title>
      </head>
      <script src="${this.mediaUri('main.js')}"></script>
      <script>
        window.addEventListener('message', event => {
            handleEvent(event)
        });
        // hackThePlanet();
      </script>
      <body>
        <img src="${this.mediaUri('Tilt-logo.svg')}" style="display: block; margin-left: auto; margin-right: auto;"></img>
        <span id="status-table"></span>
      </body>
      </html>`;
    }
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

const player = require('play-sound')({});
function honk() {
    player.play(path.join(__dirname, '..', 'audio', 'honk.wav'), function(err: any){
        if (err) {
            console.log('play-sound error', err);
            throw err;
        }
      });
}
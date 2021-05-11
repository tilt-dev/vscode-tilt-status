import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ext } from './extensionVariables';
import { V1alpha1Target } from './gen/api';
import { ListWatch, Watch } from '@kubernetes/client-node';

export class ResourceProvider implements vscode.TreeDataProvider<Resource> {
    private _onDidChangeTreeData: vscode.EventEmitter<Resource | undefined | null | void> = new vscode.EventEmitter<Resource | undefined | null | void>();

    readonly onDidChangeTreeData?: vscode.Event<void | Resource | null | undefined> | undefined = this._onDidChangeTreeData.event;

    getTreeItem(element: Resource): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: Resource): vscode.ProviderResult<Resource[]> {
        return this.getResourcesForSession("");
    }

    private async getResourcesForSession(tiltfilePath: string): Promise<Resource[]> {
        // if (!this.pathExists(tiltfilePath)) {
        //     return [];
        // }

        try {
            const session = await ext.client.readSessionStatus("Tiltfile");
            return session.body.status?.targets.map(t => new Resource(t, vscode.TreeItemCollapsibleState.None)) ?? [];
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}

export class Resource extends vscode.TreeItem {
    constructor(
        public readonly target: V1alpha1Target,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(target.name, collapsibleState);

        if (target.state.active) {
            this.description = "Running";
            this.iconPath = new vscode.ThemeIcon('testing-run-icon');
        } else if (target.state.terminated) {
            if (target.state.terminated.error) {
                this.description = target.state.terminated.error;
                this.iconPath = new vscode.ThemeIcon('testing-failed-icon');
            } else {
                this.iconPath = new vscode.ThemeIcon('testing-passed-icon');
            }
        } else if (target.state.waiting) {
            this.description = "Waiting";
            this.iconPath = new vscode.ThemeIcon('testing-queued-icon');
        } else {
            this.description = "Unknown";
        }
    }

    contextValue = 'tilt-resource';
}

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ext } from './extensionVariables';
import { TiltDevV1alpha1Api, V1alpha1Session, V1alpha1Target } from './gen/api';
import { ADD, CHANGE, ERROR, ListWatch, makeInformer, UPDATE, Watch } from '@kubernetes/client-node';

export class ResourceProvider implements vscode.TreeDataProvider<Resource> {
    cache: ListWatch<V1alpha1Session>;

    constructor() {
        const watch = new Watch(ext.config);
        const listFn = () => ext.client.listSession();
        this.cache = new ListWatch('/apis/v1alpha/sessions', watch, listFn, true);
        this.cache.on(CHANGE, (session) => {
            console.log(`Session ${session.metadata?.name} changed`);
            this._onDidChangeTreeData.fire();
        });
        this.cache.on(ERROR, (obj) => {
            console.error(`Error: ${obj}`);
        });
    }

    private _onDidChangeTreeData: vscode.EventEmitter<Resource | undefined | null | void> = new vscode.EventEmitter<Resource | undefined | null | void>();

    readonly onDidChangeTreeData?: vscode.Event<void | Resource | null | undefined> | undefined = this._onDidChangeTreeData.event;

    getTreeItem(element: Resource): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: Resource): vscode.ProviderResult<Resource[]> {
        return this.getResourcesForSession("");
    }

    private getResourcesForSession(tiltfilePath: string): Resource[] {
        const sessions = this.cache.list('');
        if (!sessions) {
            console.log('No sessions exist in cache');
            return [];
        }
        return sessions[0]?.status?.targets.map(t => new Resource(t, vscode.TreeItemCollapsibleState.None)) || [];
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

import * as vscode from 'vscode';
import { V1alpha1Session, V1alpha1Target } from './gen/api';
import { aggregateStatus, Status } from './status';
import { SessionSubscriber } from './watcher';

export class StatusBar implements vscode.Disposable, SessionSubscriber {
    statusBarItem: vscode.StatusBarItem;
    unhealthyTargets: string[] | undefined;

    constructor() {
        this.unhealthyTargets = undefined;
        
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
        this.statusBarItem.text = "? Tilt";
        this.statusBarItem.command = 'extension.tiltstatus.start';
        this.statusBarItem.show();
    }

    dispose() {
        this.statusBarItem.dispose();
    }

    updateSession(session: V1alpha1Session | undefined) {
        if (session === undefined) {
            this.setUnhealthyTargets(undefined, []);
        } else {
            this.setUnhealthyTargets(aggregateStatus(session), unhealthyTargetNames(session));
        }
    }

    setUnhealthyTargets(status: Status | undefined, targets: string[]) {
        this.statusBarItem.tooltip = "";
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBar.background');
        switch (status) {
            case undefined:
                this.statusBarItem.text = `$(question) Tilt`;
                break;
            case Status.ok:
                this.statusBarItem.text = `$(check) Tilt`;
                this.statusBarItem.tooltip = "all healthy";
                break;
            case Status.error:
                this.statusBarItem.text = `$(alert) Tilt`;
                this.statusBarItem.tooltip = `non-healthy targets:\n${targets.map(t => `· ${t}`).join('\n')}`;
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
            case Status.pending:
                this.statusBarItem.text = `$(clock) Tilt`;
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentForeground');
                break;
        }

        this.unhealthyTargets = targets;
    }
}

function isUnhealthy(t: V1alpha1Target): boolean {
    return (t.type === 'server' && !!t.state.terminated) || !!t.state.terminated?.error;
}

function unhealthyTargetNames(session: V1alpha1Session): string[] {
    return session.status?.targets?.filter(isUnhealthy).map(t => t.name) || [];
}

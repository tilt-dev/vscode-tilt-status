import * as vscode from 'vscode';
import { ext } from './extensionVariables';
import { V1alpha1Session, V1alpha1Target } from './gen/api';
import { CHANGE, ERROR, ListWatch, Watch } from '@kubernetes/client-node';

export class StatusBar implements vscode.Disposable {
    statusBarItem: vscode.StatusBarItem;
    sessions: ListWatch<V1alpha1Session>;

    constructor() {
        const sessionWatch = new Watch(ext.config);
        const sessionListFn = () => ext.client.listSession();
        this.sessions = new ListWatch('/apis/tilt.dev/v1alpha1/sessions', sessionWatch, sessionListFn, true);
        this.sessions.on(CHANGE, (session) => {
            console.log(`Session ${session.metadata?.name} changed`);
            this.setUnhealthyTargets(unhealthyTargets(session));
        });
        this.sessions.on(ERROR, (obj) => {
            console.error(`Session Watch Error: ${obj}`);
        });
        
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
        this.statusBarItem.text = "? Tilt";
        this.statusBarItem.show();
    }

    dispose() {
        this.statusBarItem.dispose();
    }

    public setUnhealthyTargets(targets: string[]) {
        if (targets.length === 0) {
            this.statusBarItem.text = `$(check) Tilt`;
            this.statusBarItem.tooltip = "all healthy";
        } else {
            this.statusBarItem.text = `$(alert) Tilt`;
            this.statusBarItem.tooltip = `non-healthy targets:\n${targets.map(t => `· ${t}`).join('\n')}`;
        }        
    }
}

enum Status {
    unknown = "unknown",
    disabled = "disabled",
    pending = "pending",
    ok = "ok",
    error = "error"
}

function unhealthyTargets(session: V1alpha1Session): string[] {
    return session.status?.targets?.filter(t => targetStatus(t) !== Status.ok).map(t => t.name) || [];
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

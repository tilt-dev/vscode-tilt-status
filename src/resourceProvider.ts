import * as vscode from 'vscode';
import * as fs from 'fs';
import { ext } from './extensionVariables';
import { V1alpha1Session, V1alpha1Target } from './gen/api';
import { CHANGE, ERROR, ListWatch, Watch } from '@kubernetes/client-node';
import timeago from './time';
import { V1alpha1KubernetesDiscovery } from './gen/model/v1alpha1KubernetesDiscovery';
import { V1alpha1Pod } from './gen/model/v1alpha1Pod';

export class ResourceProvider implements vscode.TreeDataProvider<Item> {
    sessions: ListWatch<V1alpha1Session>;
    kube: ListWatch<V1alpha1KubernetesDiscovery>;

    constructor() {
        const sessionWatch = new Watch(ext.config);
        const sessionListFn = () => ext.client.listSession();
        this.sessions = new ListWatch('/apis/tilt.dev/v1alpha1/sessions', sessionWatch, sessionListFn, true);
        this.sessions.on(CHANGE, (session) => {
            console.log(`Session ${session.metadata?.name} changed`);
            this._onDidChangeTreeData.fire();
        });
        this.sessions.on(ERROR, (obj) => {
            console.error(`Session Watch Error: ${obj}`);
        });

        const kubeWatch = new Watch(ext.config);
        const kubeListFn = () => ext.client.listKubernetesDiscovery();
        this.kube = new ListWatch('/apis/tilt.dev/v1alpha1/kubernetesdiscoveries', kubeWatch, kubeListFn, true);
        this.kube.on(CHANGE, (kd) => {
            console.log(`KubernetesDiscovery ${kd.metadata?.name} changed`);
            this._onDidChangeTreeData.fire();
        });
    }

    private _onDidChangeTreeData: vscode.EventEmitter<Item | undefined | null | void> = new vscode.EventEmitter<Item | undefined | null | void>();

    readonly onDidChangeTreeData?: vscode.Event<void | Item | null | undefined> | undefined = this._onDidChangeTreeData.event;

    getTreeItem(element: Item): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: Item): vscode.ProviderResult<Item[]> {
        const targets = this.getTargets();
        const targetsByResource = this.targetsByResource(targets);

        if (element) {
            if (element.type === ItemType.resource) {
                const targets = targetsByResource[element.name];
                const items = targets.map(t => {
                    const type = targetType(t.name);
                    const [status, time] = statusFromTarget(t);
                    const targetPods = this.podsForTarget(t);
                    const item = new Item(
                        t.name,
                        type.toString(),
                        targetPods.length === 0 ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
                        ItemType.target,
                        status,
                        time
                    );
                    item.tooltip = targetTooltip(t);
                    return item;
                });
                return items;
            } else if (element.type === ItemType.target) {
                const target = targets.find((t) => t.name === element.id);
                if (!target) {
                    return [];
                }

                const pods = this.podsForTarget(target);
                const items = pods.map((p) => {
                    const [status, time] = statusFromPod(p);
                    const item = new Item(
                        p.name,
                        p.name,
                        vscode.TreeItemCollapsibleState.None,
                        ItemType.pod,
                        status,
                        time
                    );
                    return item;
                });
                return items;
            }

            return [];
        }

        const items = Object.keys(targetsByResource).sort().map(name => {
            const targets = targetsByResource[name];
            const [status, time] = resourceStatusFromTargets(targets);
            const item = new Item(
                name,
                name,
                vscode.TreeItemCollapsibleState.Collapsed,
                ItemType.resource,
                status,
                time
            );
            const tooltip = new vscode.MarkdownString();
            for (const t of targets) {
                tooltip.appendMarkdown(targetTooltip(t).value);
                tooltip.appendMarkdown('\n\n');
            }
            item.tooltip = tooltip;
            return item;
        });
        return items;
    }

    private getTargets(): V1alpha1Target[] {
        const session = this.sessions.get('Tiltfile');
        if (!session) {
            console.log('No session exists');
            return [];
        }
        return session.status?.targets || [];
    }

    private targetsByResource(targets: V1alpha1Target[]): { [key: string]: V1alpha1Target[] } {
        const resources = targets.reduce((resources, target) => {
            for (const r of target.resources) {
                const targets = (resources[r] || []);
                targets.push(target);
                resources[r] = targets;
            }
            return resources;
        }, {} as { [key: string]: V1alpha1Target[] });
        return resources;
    }

    private podsForTarget(target: V1alpha1Target): V1alpha1Pod[] {
        const tt = targetType(target.name);
        if (tt !== TargetType.runtime) {
            return [];
        }
        const resources = new Set<string>(target.resources);
        const pods: V1alpha1Pod[] = [];
        for (const kd of this.kube.list()) {
            if (!resources.has(kd.metadata?.annotations?.['tilt.dev/resource'] ?? '')) {
                continue;
            }
            pods.push(...(kd.status?.pods || []));
        }
        return pods;
    }
}

enum Status {
    unknown = "unknown",
    disabled = "disabled",
    pending = "pending",
    ok = "ok",
    error = "error"
}

enum ItemType {
    resource,
    target,
    pod
}

export class Item extends vscode.TreeItem {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: ItemType,
        public readonly status: Status | undefined,
        public readonly time: Date | string | undefined,
    ) {
        super(name, collapsibleState);

        if (status) {
            let iconName: string;
            let iconColor: vscode.ThemeColor | undefined;
            switch (status) {
                case Status.disabled:
                    iconName = 'circle-slash';
                    iconColor = 'list.deemphasizedForeground';
                    break;
                case Status.pending:
                    iconName = 'ellipsis';
                    break;
                case Status.ok:
                    iconName = 'check';
                    iconColor = 'debugIcon.startForeground';
                    break;
                case Status.error:
                    iconName = 'warning';
                    iconColor = 'list.errorForeground';
                    break;
                default:
                    iconName = 'question';
                    break;
            }

            if (iconName) {
                this.iconPath = new vscode.ThemeIcon(iconName, iconColor);
            }
        }

        this.description = timeago(time);
    }
}

enum TargetType {
    unknown = "unknown",
    update = "update",
    runtime = "runtime"
}

function targetType(name: string): TargetType {
    const split = name.split(':', 2);
    let tt: TargetType = TargetType.unknown;
    switch(split[1]) {
        case TargetType.update.toString():
            tt = TargetType.update;
            break;
        case TargetType.runtime.toString():
            tt = TargetType.runtime;
            break;
        default:
            tt = TargetType.unknown;
            break;
    }
    return tt;
}

function resourceStatusFromTargets(targets: V1alpha1Target[]): [Status, Date | undefined] {
    const statuses = new Map<Status, Date | undefined>();
    for (const t of targets) {
        const [targetStatus, time] = statusFromTarget(t);
        if (!statuses.has(targetStatus) || (time && time > (statuses.get(targetStatus) ?? new Date()))) {
            statuses.set(targetStatus, time);
        }
    }

    const statusPriorities = [Status.error, Status.pending, Status.ok, Status.disabled];
    for (const s of statusPriorities) {
        if (statuses.has(s)) {
            return [s, statuses.get(s)];
        }
    }

    return [Status.unknown, undefined];
}

function statusFromTarget(target: V1alpha1Target): [Status, Date | undefined] {
    if (target.state.waiting) {
        return [Status.pending, undefined];
    }

    if (target.state.active) {
        if (target.type === 'job' || !target.state.active.ready) {
            return [Status.pending, target.state.active.startTime];
        }
        return [Status.ok, target.state.active.startTime];
    }

    if (target.state.terminated) {
        // HACK: finish time is sometimes undefined, so just pick start time instead
        const time = target.state.terminated.finishTime ?? target.state.terminated.startTime;
        if (target.type === 'server' || target.state.terminated.error) {
            return [Status.error, time];
        }
        return [Status.ok, time];
    }

    return [Status.disabled, undefined];
}

function targetTooltip(target: V1alpha1Target): vscode.MarkdownString {
    let lines: string[] = [
        `### ${target.name}`,
        `- **Type**: ${target.type}`
    ];
    if (target.state.waiting) {
        lines.push('- **State**: Waiting');
        lines.push(`- **Reason**: ${target.state.waiting.waitReason}`);
    } else if (target.state.active) {
        lines.push('- **State**: Active');
        lines.push(`- **Start**: ${timeago(target.state.active.startTime)}`);
        lines.push(`- **Ready**: ${!!target.state.active}`);
    } else if (target.state.terminated) {
        lines.push('- **State**: Terminated');
        lines.push(`- **Start**: ${timeago(target.state.terminated.startTime)}`);
        if (target.state.terminated.finishTime) {
            lines.push(`- **Finish**: ${timeago(target.state.terminated.finishTime)}`);
        }
        if (target.state.terminated.error) {
            lines.push('- **Error**:');
            lines.push('  ```\n' + target.state.terminated.error + '\n  ```');
        }
    }

    return new vscode.MarkdownString(lines.join('\n'));
}

export class Target extends vscode.TreeItem {
    constructor(
        public readonly target: V1alpha1Target,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(target.name, collapsibleState);

        if (target.state.active) {
            this.description = timeago(target.state.active.startTime);
            this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('debugIcon.startForeground'));
        } else if (target.state.terminated) {
            this.description = timeago(target.state.terminated.finishTime);
            if (target.state.terminated.error) {
                this.tooltip = new vscode.MarkdownString(`
## ${target.name}
- **Start**: ${timeago(target.state.terminated.startTime)}
- **End**: ${timeago(target.state.terminated.finishTime)}

------------

**Error**
\`\`\`
${target.state.terminated.error}
\`\`\`
                `);
                this.iconPath = new vscode.ThemeIcon('chrome-close', new vscode.ThemeColor('debugIcon.stopForeground'));
            } else {
                this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('list.deemphasizedForeground'));
            }
        } else if (target.state.waiting) {
            this.description = "Waiting";
            this.iconPath = new vscode.ThemeIcon('ellipsis', new vscode.ThemeColor('list.deemphasizedForeground'));
        } else {
            this.description = "Unknown";
        }
    }

    contextValue = 'tilt-resource';
}

function statusFromPod(pod: V1alpha1Pod): [Status, Date | undefined] {
    const time = pod.createdAt;

    if (pod.errors.length !== 0) {
        return [Status.error, time];
    }

    switch (pod.phase) {
        case "Running":
            break;
        case "Pending":
            return [Status.pending, time];
        case "Succeeded":
            return [Status.ok, time];
        case "Failed":
            return [Status.error, time];
        default:
            return [Status.unknown, time];
    }

    for (const c of pod.containers) {
        if (c.state.terminated && c.state.terminated.exitCode !== 0) {
            return [Status.error, time];
        }
        if (c.state.waiting || c.state.running && !c.ready) {
            return [Status.pending, time];
        }
    }

    return [Status.ok, time];
}

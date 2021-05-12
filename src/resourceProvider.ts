import * as vscode from 'vscode';
import * as fs from 'fs';
import { ext } from './extensionVariables';
import { V1alpha1Session, V1alpha1Target } from './gen/api';
import { CHANGE, ERROR, ListWatch, Watch } from '@kubernetes/client-node';
import timeago from './time';

export class ResourceProvider implements vscode.TreeDataProvider<Item> {
    cache: ListWatch<V1alpha1Session>;

    constructor() {
        const watch = new Watch(ext.config);
        const listFn = () => ext.client.listSession();
        this.cache = new ListWatch('/apis/tilt.dev/v1alpha1/sessions', watch, listFn, true);
        this.cache.on(CHANGE, (session) => {
            session.metadata?.creationTimestamp
            console.log(`Session ${session.metadata?.name} changed`);
            this._onDidChangeTreeData.fire();
        });
        this.cache.on(ERROR, (obj) => {
            console.error(`Error: ${obj}`);
        });
    }

    private _onDidChangeTreeData: vscode.EventEmitter<Item | undefined | null | void> = new vscode.EventEmitter<Item | undefined | null | void>();

    readonly onDidChangeTreeData?: vscode.Event<void | Item | null | undefined> | undefined = this._onDidChangeTreeData.event;

    getTreeItem(element: Item): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: Item): vscode.ProviderResult<Item[]> {
        const resources = this.getTargetsByResource();

        if (element) {
            if (element.type !== ItemType.resource) {
                return [];
            }

            const targets = resources[element.name];
            const items = targets.map(t => {
                const prefix = element.name === '(Tiltfile)' ? 'tiltfile' : element.name;
                const name = t.name.replace(`${prefix}:`, '');
                const [status, time] = statusFromTarget(t);
                const item = new Item(
                    name,
                    vscode.TreeItemCollapsibleState.None,
                    ItemType.target,
                    status,
                    time
                );
                item.tooltip = targetTooltip(t);
                return item;
            });
            return items;
        }

        const items = Object.keys(resources).map(name => {
            const targets = resources[name];
            const [status, time] = resourceStatusFromTargets(targets);
            const item = new Item(
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

    private getTargetsByResource(): { [key: string]: V1alpha1Target[] } {
        const session = this.cache.get('Tiltfile');
        if (!session) {
            console.log('No session exists');
            return {};
        }

        const resources = (session.status?.targets || []).reduce((resources, target) => {
            for (const r of target.resources) {
                const targets = (resources[r] || []);
                targets.push(target);
                resources[r] = targets;
            }
            return resources;
        }, {} as { [key: string]: V1alpha1Target[] });
        return resources;
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
    target
}

export class Item extends vscode.TreeItem {
    constructor(
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

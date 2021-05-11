import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ext } from './extensionVariables';
import { TiltDevV1alpha1Api, V1alpha1Session, V1alpha1Target } from './gen/api';
import { ADD, CHANGE, ERROR, ListWatch, makeInformer, UPDATE, Watch } from '@kubernetes/client-node';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import locale from 'date-fns/locale/en-US';
import { SSL_OP_NO_COMPRESSION } from 'constants';

const timeago = (date: Date | string | null): string => {
    if (!date) {
        return "";
    }

    // Watch just does JSON deserialize, so dates come back as ISO8601 strings
    // even though the TS type _thinks_ it has a JS Date
    if (typeof date === 'string') {
        date = parseISO(date);
    }

    return formatDistanceToNowStrict(date, {
        addSuffix: true,
        locale: {
          ...locale,
          formatDistance,
      },
    });
};

const formatDistanceLocale: { [key: string]: string } = {
    lessThanXSeconds: '{{count}}s',
    xSeconds: '{{count}}s',
    halfAMinute: '30s',
    lessThanXMinutes: '{{count}}m',
    xMinutes: '{{count}}m',
    aboutXHours: '{{count}}h',
    xHours: '{{count}}h',
    xDays: '{{count}}d',
    aboutXWeeks: '{{count}}w',
    xWeeks: '{{count}}w',
    aboutXMonths: '{{count}}m',
    xMonths: '{{count}}m',
    aboutXYears: '{{count}}y',
    xYears: '{{count}}y',
    overXYears: '{{count}}y',
    almostXYears: '{{count}}y',
  };

  function formatDistance(token: string, count: any, options: any): string {
    options = options || {};

    const result = formatDistanceLocale[token].replace('{{count}}', count);

    if (options.addSuffix) {
      if (options.comparison > 0) {
        return 'in ' + result;
      } else {
        return result + ' ago';
      }
    }

    return result;
  }

export class ResourceProvider implements vscode.TreeDataProvider<Resource> {
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

    private _onDidChangeTreeData: vscode.EventEmitter<Resource | undefined | null | void> = new vscode.EventEmitter<Resource | undefined | null | void>();

    readonly onDidChangeTreeData?: vscode.Event<void | Resource | null | undefined> | undefined = this._onDidChangeTreeData.event;

    getTreeItem(element: Resource): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: Resource): vscode.ProviderResult<Resource[]> {
        return this.getResourcesForSession("");
    }

    private getResourcesForSession(tiltfilePath: string): Resource[] {
        const session = this.cache.get('Tiltfile');
        if (!session) {
            console.log('No session exists');
            return [];
        }
        return session?.status?.targets.map(t => new Resource(t, vscode.TreeItemCollapsibleState.None)) || [];
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

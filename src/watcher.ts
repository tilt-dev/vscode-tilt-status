import { Disposable } from "vscode";
import { newTiltClientFromConfig, newTiltConfig } from './lib/client';
import { V1alpha1Session } from './gen/api';
import { CHANGE, ERROR, ListWatch, Watch } from '@kubernetes/client-node';

export interface SessionSubscriber {
	updateSession(session: V1alpha1Session | undefined): void;
}

const reconnectIntervalMs = 5000;

export class SessionWatcher implements Disposable {
    private subscribers: SessionSubscriber[] = new Array<SessionSubscriber>();
	private currentSession: V1alpha1Session | undefined = undefined;
    private sessions: ListWatch<V1alpha1Session> | undefined;
    private reconnectTimeout: NodeJS.Timeout | undefined;

    constructor() {
            this.startWatch();
    }

    private startWatch() {
        try {
            this.reconnectTimeout = undefined;
            const config = newTiltConfig();
            config.currentContext = 'tilt-default';
            const client = newTiltClientFromConfig(config);
            const sessionWatch = new Watch(config);
            const sessionListFn = () => {
                return client.listSession().catch(err => {
                    console.log(`error listing sessions: ${err}`);
                    this.updateSession(undefined);
                    this.ensureReconnecting();
                    throw err;
                });
            };
            // not using autostart since it creates a floating promise whose errors can't be caught.
            this.sessions = new ListWatch('/apis/tilt.dev/v1alpha1/sessions', sessionWatch, sessionListFn);

            this.sessions.on(CHANGE, (session: V1alpha1Session) => {
                this.updateSession(session);
            });

            this.sessions.on(ERROR, (session: V1alpha1Session) => {
                console.error(`Session Watch Error: ${session}`);
                this.updateSession(undefined);
            });

            this.sessions.start().catch(err => {
                console.log(`error starting sessions ListWatch: ${err}`);
                this.ensureReconnecting();
            });
        } catch (err: any) {
            console.error(`error starting watch: ${err}`);
            this.ensureReconnecting();
        }
    }

    private ensureReconnecting() {
        if (!this.reconnectTimeout) {
            this.reconnectTimeout = setTimeout(() => this.startWatch(), reconnectIntervalMs);
        }
    }

    private updateSession(session: V1alpha1Session | undefined) {
        this.currentSession = session;
        this.subscribers.forEach(s => s.updateSession(session));
    }

    addSubscriber(s: SessionSubscriber) {
        this.subscribers.push(s);
        if (this.currentSession) {
            s.updateSession(this.currentSession);
        }
    }

    dispose() {
        if (this.sessions) {
            this.sessions.stop();
        }
    }
}
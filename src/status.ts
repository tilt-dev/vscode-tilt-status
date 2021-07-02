import { V1alpha1Session, V1alpha1Target } from './gen/api';

export enum Status {
    unknown = "unknown",
    disabled = "disabled",
    pending = "pending",
    ok = "ok",
    error = "error"
}

export function aggregateStatus(session: V1alpha1Session): Status {
    const statuses = session?.status?.targets.map(targetStatus);
    if (!statuses) {
        return Status.unknown;
    } if (statuses?.includes(Status.error)) {
        return Status.error;
    } else if (statuses?.includes(Status.pending)) {
        return Status.pending;
    } else {
        return Status.ok;
    }
}

export function targetStatus(target: V1alpha1Target): Status {
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

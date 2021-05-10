export * from './apisApi';
import { ApisApi } from './apisApi';
export * from './customObjectsApi';
import { CustomObjectsApi } from './customObjectsApi';
export * from './tiltDevApi';
import { TiltDevApi } from './tiltDevApi';
export * from './tiltDevV1alpha1Api';
import { TiltDevV1alpha1Api } from './tiltDevV1alpha1Api';
export * from './versionApi';
import { VersionApi } from './versionApi';
import * as fs from 'fs';
import * as http from 'http';

export class HttpError extends Error {
    constructor (public response: http.IncomingMessage, public body: any, public statusCode?: number) {
        super('HTTP request failed');
        this.name = 'HttpError';
    }
}

export interface RequestDetailedFile {
    value: Buffer;
    options?: {
        filename?: string;
        contentType?: string;
    }
}

export type RequestFile = string | Buffer | fs.ReadStream | RequestDetailedFile;

export const APIS = [ApisApi, CustomObjectsApi, TiltDevApi, TiltDevV1alpha1Api, VersionApi];

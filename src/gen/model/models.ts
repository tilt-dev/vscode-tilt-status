export * from './v1APIGroup';
export * from './v1APIGroupList';
export * from './v1APIResource';
export * from './v1APIResourceList';
export * from './v1DeleteOptions';
export * from './v1GroupVersionForDiscovery';
export * from './v1ListMeta';
export * from './v1ManagedFieldsEntry';
export * from './v1ObjectMeta';
export * from './v1OwnerReference';
export * from './v1Preconditions';
export * from './v1ServerAddressByClientCIDR';
export * from './v1Status';
export * from './v1StatusCause';
export * from './v1StatusDetails';
export * from './v1WatchEvent';
export * from './v1alpha1Cmd';
export * from './v1alpha1CmdList';
export * from './v1alpha1CmdSpec';
export * from './v1alpha1CmdStateRunning';
export * from './v1alpha1CmdStateTerminated';
export * from './v1alpha1CmdStateWaiting';
export * from './v1alpha1CmdStatus';
export * from './v1alpha1ContainerLogStreamStatus';
export * from './v1alpha1ExecAction';
export * from './v1alpha1FileEvent';
export * from './v1alpha1FileWatch';
export * from './v1alpha1FileWatchList';
export * from './v1alpha1FileWatchSpec';
export * from './v1alpha1FileWatchStatus';
export * from './v1alpha1HTTPGetAction';
export * from './v1alpha1HTTPHeader';
export * from './v1alpha1IgnoreDef';
export * from './v1alpha1PodLogStream';
export * from './v1alpha1PodLogStreamList';
export * from './v1alpha1PodLogStreamSpec';
export * from './v1alpha1PodLogStreamStatus';
export * from './v1alpha1Probe';
export * from './v1alpha1RestartOnSpec';
export * from './v1alpha1Session';
export * from './v1alpha1SessionList';
export * from './v1alpha1SessionSpec';
export * from './v1alpha1SessionStatus';
export * from './v1alpha1TCPSocketAction';
export * from './v1alpha1Target';
export * from './v1alpha1TargetState';
export * from './v1alpha1TargetStateActive';
export * from './v1alpha1TargetStateTerminated';
export * from './v1alpha1TargetStateWaiting';
export * from './versionInfo';

import localVarRequest from 'request';

import { V1APIGroup } from './v1APIGroup';
import { V1APIGroupList } from './v1APIGroupList';
import { V1APIResource } from './v1APIResource';
import { V1APIResourceList } from './v1APIResourceList';
import { V1DeleteOptions } from './v1DeleteOptions';
import { V1GroupVersionForDiscovery } from './v1GroupVersionForDiscovery';
import { V1ListMeta } from './v1ListMeta';
import { V1ManagedFieldsEntry } from './v1ManagedFieldsEntry';
import { V1ObjectMeta } from './v1ObjectMeta';
import { V1OwnerReference } from './v1OwnerReference';
import { V1Preconditions } from './v1Preconditions';
import { V1ServerAddressByClientCIDR } from './v1ServerAddressByClientCIDR';
import { V1Status } from './v1Status';
import { V1StatusCause } from './v1StatusCause';
import { V1StatusDetails } from './v1StatusDetails';
import { V1WatchEvent } from './v1WatchEvent';
import { V1alpha1Cmd } from './v1alpha1Cmd';
import { V1alpha1CmdList } from './v1alpha1CmdList';
import { V1alpha1CmdSpec } from './v1alpha1CmdSpec';
import { V1alpha1CmdStateRunning } from './v1alpha1CmdStateRunning';
import { V1alpha1CmdStateTerminated } from './v1alpha1CmdStateTerminated';
import { V1alpha1CmdStateWaiting } from './v1alpha1CmdStateWaiting';
import { V1alpha1CmdStatus } from './v1alpha1CmdStatus';
import { V1alpha1ContainerLogStreamStatus } from './v1alpha1ContainerLogStreamStatus';
import { V1alpha1ExecAction } from './v1alpha1ExecAction';
import { V1alpha1FileEvent } from './v1alpha1FileEvent';
import { V1alpha1FileWatch } from './v1alpha1FileWatch';
import { V1alpha1FileWatchList } from './v1alpha1FileWatchList';
import { V1alpha1FileWatchSpec } from './v1alpha1FileWatchSpec';
import { V1alpha1FileWatchStatus } from './v1alpha1FileWatchStatus';
import { V1alpha1HTTPGetAction } from './v1alpha1HTTPGetAction';
import { V1alpha1HTTPHeader } from './v1alpha1HTTPHeader';
import { V1alpha1IgnoreDef } from './v1alpha1IgnoreDef';
import { V1alpha1PodLogStream } from './v1alpha1PodLogStream';
import { V1alpha1PodLogStreamList } from './v1alpha1PodLogStreamList';
import { V1alpha1PodLogStreamSpec } from './v1alpha1PodLogStreamSpec';
import { V1alpha1PodLogStreamStatus } from './v1alpha1PodLogStreamStatus';
import { V1alpha1Probe } from './v1alpha1Probe';
import { V1alpha1RestartOnSpec } from './v1alpha1RestartOnSpec';
import { V1alpha1Session } from './v1alpha1Session';
import { V1alpha1SessionList } from './v1alpha1SessionList';
import { V1alpha1SessionSpec } from './v1alpha1SessionSpec';
import { V1alpha1SessionStatus } from './v1alpha1SessionStatus';
import { V1alpha1TCPSocketAction } from './v1alpha1TCPSocketAction';
import { V1alpha1Target } from './v1alpha1Target';
import { V1alpha1TargetState } from './v1alpha1TargetState';
import { V1alpha1TargetStateActive } from './v1alpha1TargetStateActive';
import { V1alpha1TargetStateTerminated } from './v1alpha1TargetStateTerminated';
import { V1alpha1TargetStateWaiting } from './v1alpha1TargetStateWaiting';
import { VersionInfo } from './versionInfo';

/* tslint:disable:no-unused-variable */
let primitives = [
                    "string",
                    "boolean",
                    "double",
                    "integer",
                    "long",
                    "float",
                    "number",
                    "any"
                 ];

let enumsMap: {[index: string]: any} = {
}

let typeMap: {[index: string]: any} = {
    "V1APIGroup": V1APIGroup,
    "V1APIGroupList": V1APIGroupList,
    "V1APIResource": V1APIResource,
    "V1APIResourceList": V1APIResourceList,
    "V1DeleteOptions": V1DeleteOptions,
    "V1GroupVersionForDiscovery": V1GroupVersionForDiscovery,
    "V1ListMeta": V1ListMeta,
    "V1ManagedFieldsEntry": V1ManagedFieldsEntry,
    "V1ObjectMeta": V1ObjectMeta,
    "V1OwnerReference": V1OwnerReference,
    "V1Preconditions": V1Preconditions,
    "V1ServerAddressByClientCIDR": V1ServerAddressByClientCIDR,
    "V1Status": V1Status,
    "V1StatusCause": V1StatusCause,
    "V1StatusDetails": V1StatusDetails,
    "V1WatchEvent": V1WatchEvent,
    "V1alpha1Cmd": V1alpha1Cmd,
    "V1alpha1CmdList": V1alpha1CmdList,
    "V1alpha1CmdSpec": V1alpha1CmdSpec,
    "V1alpha1CmdStateRunning": V1alpha1CmdStateRunning,
    "V1alpha1CmdStateTerminated": V1alpha1CmdStateTerminated,
    "V1alpha1CmdStateWaiting": V1alpha1CmdStateWaiting,
    "V1alpha1CmdStatus": V1alpha1CmdStatus,
    "V1alpha1ContainerLogStreamStatus": V1alpha1ContainerLogStreamStatus,
    "V1alpha1ExecAction": V1alpha1ExecAction,
    "V1alpha1FileEvent": V1alpha1FileEvent,
    "V1alpha1FileWatch": V1alpha1FileWatch,
    "V1alpha1FileWatchList": V1alpha1FileWatchList,
    "V1alpha1FileWatchSpec": V1alpha1FileWatchSpec,
    "V1alpha1FileWatchStatus": V1alpha1FileWatchStatus,
    "V1alpha1HTTPGetAction": V1alpha1HTTPGetAction,
    "V1alpha1HTTPHeader": V1alpha1HTTPHeader,
    "V1alpha1IgnoreDef": V1alpha1IgnoreDef,
    "V1alpha1PodLogStream": V1alpha1PodLogStream,
    "V1alpha1PodLogStreamList": V1alpha1PodLogStreamList,
    "V1alpha1PodLogStreamSpec": V1alpha1PodLogStreamSpec,
    "V1alpha1PodLogStreamStatus": V1alpha1PodLogStreamStatus,
    "V1alpha1Probe": V1alpha1Probe,
    "V1alpha1RestartOnSpec": V1alpha1RestartOnSpec,
    "V1alpha1Session": V1alpha1Session,
    "V1alpha1SessionList": V1alpha1SessionList,
    "V1alpha1SessionSpec": V1alpha1SessionSpec,
    "V1alpha1SessionStatus": V1alpha1SessionStatus,
    "V1alpha1TCPSocketAction": V1alpha1TCPSocketAction,
    "V1alpha1Target": V1alpha1Target,
    "V1alpha1TargetState": V1alpha1TargetState,
    "V1alpha1TargetStateActive": V1alpha1TargetStateActive,
    "V1alpha1TargetStateTerminated": V1alpha1TargetStateTerminated,
    "V1alpha1TargetStateWaiting": V1alpha1TargetStateWaiting,
    "VersionInfo": VersionInfo,
}

export class ObjectSerializer {
    public static findCorrectType(data: any, expectedType: string) {
        if (data == undefined) {
            return expectedType;
        } else if (primitives.indexOf(expectedType.toLowerCase()) !== -1) {
            return expectedType;
        } else if (expectedType === "Date") {
            return expectedType;
        } else {
            if (enumsMap[expectedType]) {
                return expectedType;
            }

            if (!typeMap[expectedType]) {
                return expectedType; // w/e we don't know the type
            }

            // Check the discriminator
            let discriminatorProperty = typeMap[expectedType].discriminator;
            if (discriminatorProperty == null) {
                return expectedType; // the type does not have a discriminator. use it.
            } else {
                if (data[discriminatorProperty]) {
                    var discriminatorType = data[discriminatorProperty];
                    if(typeMap[discriminatorType]){
                        return discriminatorType; // use the type given in the discriminator
                    } else {
                        return expectedType; // discriminator did not map to a type
                    }
                } else {
                    return expectedType; // discriminator was not present (or an empty string)
                }
            }
        }
    }

    public static serialize(data: any, type: string) {
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType: string = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData: any[] = [];
            for (let index in data) {
                let date = data[index];
                transformedData.push(ObjectSerializer.serialize(date, subType));
            }
            return transformedData;
        } else if (type === "Date") {
            return data.toISOString();
        } else {
            if (enumsMap[type]) {
                return data;
            }
            if (!typeMap[type]) { // in case we dont know the type
                return data;
            }

            // Get the actual type of this object
            type = this.findCorrectType(data, type);

            // get the map for the correct type.
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            let instance: {[index: string]: any} = {};
            for (let index in attributeTypes) {
                let attributeType = attributeTypes[index];
                instance[attributeType.baseName] = ObjectSerializer.serialize(data[attributeType.name], attributeType.type);
            }
            return instance;
        }
    }

    public static deserialize(data: any, type: string) {
        // polymorphism may change the actual type.
        type = ObjectSerializer.findCorrectType(data, type);
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType: string = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData: any[] = [];
            for (let index in data) {
                let date = data[index];
                transformedData.push(ObjectSerializer.deserialize(date, subType));
            }
            return transformedData;
        } else if (type === "Date") {
            return new Date(data);
        } else {
            if (enumsMap[type]) {// is Enum
                return data;
            }

            if (!typeMap[type]) { // dont know the type
                return data;
            }
            let instance = new typeMap[type]();
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            for (let index in attributeTypes) {
                let attributeType = attributeTypes[index];
                instance[attributeType.name] = ObjectSerializer.deserialize(data[attributeType.baseName], attributeType.type);
            }
            return instance;
        }
    }
}

export interface Authentication {
    /**
    * Apply authentication settings to header and query params.
    */
    applyToRequest(requestOptions: localVarRequest.Options): Promise<void> | void;
}

export class HttpBasicAuth implements Authentication {
    public username: string = '';
    public password: string = '';

    applyToRequest(requestOptions: localVarRequest.Options): void {
        requestOptions.auth = {
            username: this.username, password: this.password
        }
    }
}

export class HttpBearerAuth implements Authentication {
    public accessToken: string | (() => string) = '';

    applyToRequest(requestOptions: localVarRequest.Options): void {
        if (requestOptions && requestOptions.headers) {
            const accessToken = typeof this.accessToken === 'function'
                            ? this.accessToken()
                            : this.accessToken;
            requestOptions.headers["Authorization"] = "Bearer " + accessToken;
        }
    }
}

export class ApiKeyAuth implements Authentication {
    public apiKey: string = '';

    constructor(private location: string, private paramName: string) {
    }

    applyToRequest(requestOptions: localVarRequest.Options): void {
        if (this.location == "query") {
            (<any>requestOptions.qs)[this.paramName] = this.apiKey;
        } else if (this.location == "header" && requestOptions && requestOptions.headers) {
            requestOptions.headers[this.paramName] = this.apiKey;
        } else if (this.location == 'cookie' && requestOptions && requestOptions.headers) {
            if (requestOptions.headers['Cookie']) {
                requestOptions.headers['Cookie'] += '; ' + this.paramName + '=' + encodeURIComponent(this.apiKey);
            }
            else {
                requestOptions.headers['Cookie'] = this.paramName + '=' + encodeURIComponent(this.apiKey);
            }
        }
    }
}

export class OAuth implements Authentication {
    public accessToken: string = '';

    applyToRequest(requestOptions: localVarRequest.Options): void {
        if (requestOptions && requestOptions.headers) {
            requestOptions.headers["Authorization"] = "Bearer " + this.accessToken;
        }
    }
}

export class VoidAuth implements Authentication {
    public username: string = '';
    public password: string = '';

    applyToRequest(_: localVarRequest.Options): void {
        // Do nothing
    }
}

export type Interceptor = (requestOptions: localVarRequest.Options) => (Promise<void> | void);

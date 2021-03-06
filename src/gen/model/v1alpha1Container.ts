/**
 * tilt
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 0.20.2
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { RequestFile } from '../api';
import { V1alpha1ContainerState } from './v1alpha1ContainerState';

/**
* Container is an init or application container within a pod.  The Tilt API representation mirrors the Kubernetes API very closely. Irrelevant data is not included, and some fields might be simplified.  There might also be Tilt-specific status fields.
*/
export class V1alpha1Container {
    /**
    * ID is the normalized container ID (the `docker://` prefix is stripped).
    */
    'id': string;
    /**
    * Image is the image the container is running.
    */
    'image': string;
    /**
    * Name is the name of the container as defined in Kubernetes.
    */
    'name': string;
    /**
    * Ports are exposed ports as extracted from the Pod spec.  This is added by Tilt for convenience when managing port forwards.
    */
    'ports': Array<number>;
    /**
    * Ready is true if the container is passing readiness checks (or has none defined).
    */
    'ready': boolean;
    /**
    * Restarts is the number of times the container has restarted.  This includes restarts before the Tilt daemon was started if the container was already running.
    */
    'restarts': number;
    'state': V1alpha1ContainerState;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "id",
            "baseName": "id",
            "type": "string"
        },
        {
            "name": "image",
            "baseName": "image",
            "type": "string"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "ports",
            "baseName": "ports",
            "type": "Array<number>"
        },
        {
            "name": "ready",
            "baseName": "ready",
            "type": "boolean"
        },
        {
            "name": "restarts",
            "baseName": "restarts",
            "type": "number"
        },
        {
            "name": "state",
            "baseName": "state",
            "type": "V1alpha1ContainerState"
        }    ];

    static getAttributeTypeMap() {
        return V1alpha1Container.attributeTypeMap;
    }
}


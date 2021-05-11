import { KubeConfig } from "@kubernetes/client-node";
import { TiltDevV1alpha1Api } from "../gen/api";

const k8s = require("@kubernetes/client-node");
const homedir = require("os").homedir();
const path = require("path");

// Load the current tilt config.
export let newTiltConfig = (): KubeConfig => {
  const kc = new k8s.KubeConfig();
  let loaded = false;
  try {
    kc.loadFromFile(path.join(homedir, ".windmill", "config"));
    loaded = true;
  } catch (e) {}

  if (!loaded) {
    try {
      kc.loadFromFile(path.join(homedir, ".tilt-dev", "config"));
      loaded = true;
    } catch (e) {}
  }

  if (!loaded) {
    throw new Error(
      "Could not connect to running Tilt instance: no config loaded"
    );
  }
  return kc;
};

// Create a tilt client from the default context.
export let newTiltClient = (): TiltDevV1alpha1Api => {
  return newTiltClientFromConfig(newTiltConfig());
};

// Create a tilt client from the given context.
export let newTiltClientFromConfig = (kc: KubeConfig): TiltDevV1alpha1Api => {
  if (!kc.getCurrentCluster()) {
    throw new Error(
      "Could not connect to running Tilt instance: no current cluster"
    );
  }
  return kc.makeApiClient(TiltDevV1alpha1Api);
};

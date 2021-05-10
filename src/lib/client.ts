const k8s = require("@kubernetes/client-node");
const TiltApi = require("../gen/api").TiltDevV1alpha1Api;
const homedir = require("os").homedir();
const path = require("path");

// Load the current tilt config.
export let newTiltConfig = () => {
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
export let newTiltClient = () => {
  return newTiltClientFromConfig(newTiltConfig());
};

// Create a tilt client from the given context.
export let newTiltClientFromConfig = (kc) => {
  if (!kc.getCurrentCluster()) {
    throw new Error(
      "Could not connect to running Tilt instance: no current cluster"
    );
  }
  return kc.makeApiClient(TiltApi);
};

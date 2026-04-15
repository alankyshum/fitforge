// Mock for react-native-worklets - avoids native module initialization in Jest
module.exports = {
  isShareableRef: () => false,
  makeShareable: (v) => v,
  makeShareableCloneOnUIRecursive: (v) => v,
  makeShareableCloneRecursive: (v) => v,
  createWorkletRuntime: () => ({}),
};

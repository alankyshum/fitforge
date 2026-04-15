// Mock for expo-crypto - avoids loading Expo native module system in Jest
let counter = 0;
module.exports = {
  randomUUID: () => `mock-uuid-${++counter}`,
  getRandomBytes: (length) => new Uint8Array(length),
  getRandomValues: (array) => array,
  digestStringAsync: async () => 'mock-digest',
  CryptoDigestAlgorithm: {
    SHA1: 'SHA-1',
    SHA256: 'SHA-256',
    SHA384: 'SHA-384',
    SHA512: 'SHA-512',
    MD5: 'MD5',
  },
  CryptoEncoding: {
    HEX: 'hex',
    BASE64: 'base64',
  },
};

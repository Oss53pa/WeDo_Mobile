// Biometrics mock for web
const ReactNativeBiometrics = {
  isSensorAvailable: async () => ({
    available: false,
    biometryType: null,
  }),
  createKeys: async () => ({ publicKey: '' }),
  deleteKeys: async () => ({ keysDeleted: true }),
  createSignature: async () => ({ success: false, signature: '' }),
  simplePrompt: async () => ({ success: false }),
};

export const BiometryTypes = {
  TouchID: 'TouchID',
  FaceID: 'FaceID',
  Biometrics: 'Biometrics',
};

export default ReactNativeBiometrics;

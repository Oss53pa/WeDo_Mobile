// Keychain mock using localStorage
export const setGenericPassword = async (username, password, options) => {
  localStorage.setItem('keychain_user', username);
  localStorage.setItem('keychain_pass', password);
  return true;
};

export const getGenericPassword = async (options) => {
  const username = localStorage.getItem('keychain_user');
  const password = localStorage.getItem('keychain_pass');
  if (username && password) {
    return { username, password };
  }
  return false;
};

export const resetGenericPassword = async (options) => {
  localStorage.removeItem('keychain_user');
  localStorage.removeItem('keychain_pass');
  return true;
};

export const ACCESSIBLE = {
  WHEN_UNLOCKED: 'WHEN_UNLOCKED',
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  ALWAYS: 'ALWAYS',
};

export const ACCESS_CONTROL = {
  BIOMETRY_ANY: 'BIOMETRY_ANY',
  BIOMETRY_CURRENT_SET: 'BIOMETRY_CURRENT_SET',
};

export const AUTHENTICATION_TYPE = {
  BIOMETRICS: 'BIOMETRICS',
  DEVICE_PASSCODE: 'DEVICE_PASSCODE',
};

export default {
  setGenericPassword,
  getGenericPassword,
  resetGenericPassword,
  ACCESSIBLE,
  ACCESS_CONTROL,
  AUTHENTICATION_TYPE,
};

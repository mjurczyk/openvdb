export const DEBUG = 0;

export const assert = (text, assumed, found) => {
  debugLog(assumed === found ? 'OK\t' : 'NOT\t', '\t', text, 'Assumed', { assumed }, 'equal to', {
    found,
  });
};

// NOTE Replace console.info in code with debugLog
export const debugLog = (...args) => {
  if (DEBUG) {
    console.info(...args);
  }
};

export const unsupported = (description) => {
  debugLog('Unsupported feature', description);
};

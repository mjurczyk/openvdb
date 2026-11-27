// NOTE Random RFC 4122 version 4 UUID. Math.random works in all contexts, crypto.randomUUID needs a secure context.
export const getUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;

    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
};

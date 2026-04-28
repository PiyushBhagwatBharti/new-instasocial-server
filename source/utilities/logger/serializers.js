export const serializeError = (error) => {
  if (!error) return null;

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code || null,
  };
};


export const sanitizeMetadata = (meta = {}) => {
  try {
    return JSON.parse(JSON.stringify(meta));
  } catch {
    return { note: "metadata serialization failed" };
  }
};
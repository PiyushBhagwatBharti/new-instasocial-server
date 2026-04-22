import mongoose from "mongoose";

export async function withRetrySession(
  fn,
  {
    retries = 3,
    delay = 50, // ms
    shouldRetry = defaultShouldRetry,
  } = {},
) {
  let attempt = 0;

  while (attempt < retries) {
    const session = await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(async () => {
        result = await fn(session, attempt);
      });

      session.endSession();
      return result;
    } catch (err) {
      session.endSession();

      attempt++;

      if (attempt >= retries || !shouldRetry(err)) {
        throw err;
      }

      await wait(delay * attempt); // simple backoff
    }
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const result = await callback(session);
    await session.commitTransaction();

    return result;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    await session.endSession();
    console.log("session ended");
  }
};

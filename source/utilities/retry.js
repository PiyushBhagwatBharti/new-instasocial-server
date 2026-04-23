// utils/retry.js

export const retry = async (
  fn,
  {
    retries = 3,
    delay = 500, // initial delay (ms)
    factor = 2, // exponential multiplier
    maxDelay = 5000,
    shouldRetry,
    onRetry,
  } = {},
) => {
  let attempt = 0;
  let currentDelay = delay;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      const isLastAttempt = attempt === retries;

      // decide if retry is allowed
      const retryAllowed =
        typeof shouldRetry === "function"
          ? shouldRetry(err)
          : defaultShouldRetry(err);

      if (!retryAllowed || isLastAttempt) {
        throw err;
      }

      if (onRetry) {
        onRetry({
          attempt: attempt + 1,
          delay: currentDelay,
          error: err,
        });
      }

      // wait before next attempt
      await sleep(currentDelay);

      // exponential backoff
      currentDelay = Math.min(currentDelay * factor, maxDelay);

      attempt++;
    }
  }
};

const defaultShouldRetry = (err) => {
  // Network errors
  if (!err.response) return true;

  const status = err.response.status || err.statusCode;

  // Retry on:
  // 429 = rate limit
  // 5xx = server errors
  if (status === 429 || (status >= 500 && status < 600)) {
    return true;
  }

  return false;
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

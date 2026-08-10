/**
 * Resolve a thenable with a soft timeout so placeholder Supabase hosts cannot stall SSR.
 */
export async function withSoftTimeout<T>(
  thenable: PromiseLike<T>,
  fallback: T,
  timeoutMs = 2500,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(thenable),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

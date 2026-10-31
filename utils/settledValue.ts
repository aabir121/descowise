export const settledValue = <T>(result: PromiseSettledResult<T>, fallback: T): T =>
    result.status === 'fulfilled' && result.value !== undefined && result.value !== null
        ? result.value
        : fallback;

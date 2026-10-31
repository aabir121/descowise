import { describe, expect, it } from 'vitest';
import { settledValue } from './settledValue';

describe('settledValue', () => {
    it('keeps successful detail data when another request fails', () => {
        const location = { accountNo: 123, zone: 'A', block: 'B', route: 'C' };
        const result = Promise.allSettled([
            Promise.resolve(location),
            Promise.reject(new Error('DESCO returned 500')),
        ]);

        return result.then(([locationResult, monthlyResult]) => {
            expect(settledValue(locationResult, null)).toEqual(location);
            expect(settledValue(monthlyResult, [])).toEqual([]);
        });
    });

    it('uses the fallback for a successful response with no value', () => {
        const result = Promise.resolve(undefined);

        return result.then(value => {
            expect(settledValue({ status: 'fulfilled', value }, [])).toEqual([]);
        });
    });
});

import { describe, expect, it } from 'vitest';
import { shouldOpenAiSetupModal } from './aiFeatureToggle';

describe('shouldOpenAiSetupModal', () => {
    it('allows an enabled feature to be turned off without an API key', () => {
        expect(shouldOpenAiSetupModal(true, false)).toBe(false);
    });

    it('opens setup when enabling AI without an API key', () => {
        expect(shouldOpenAiSetupModal(false, false)).toBe(true);
    });
});

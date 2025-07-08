// @ts-nocheck
import React from 'react';

const Spinner: React.FC<SpinnerProps> = ({ size = 'w-6 h-6', color = 'border-cyan-400' }) => (
    <span className={`inline-block animate-spin rounded-full border-4 border-solid border-t-transparent ${size} ${color}`} />
);

export default Spinner; 
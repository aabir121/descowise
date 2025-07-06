import React from 'react';

const Spinner: React.FC<{ size?: string; color?: string }> = ({ size = 'w-5 h-5', color = 'border-white' }) => {
    return (
        <div className={`${size} ${color} border-t-transparent border-solid animate-spin rounded-full border-2`} />
    );
};

export default Spinner;
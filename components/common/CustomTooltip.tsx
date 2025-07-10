// @ts-nocheck
import React from 'react';
import { formatCurrency, sanitizeCurrency } from './format';

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string | number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-700/80 backdrop-blur-sm p-3 rounded-md border border-slate-600 shadow-lg text-sm">
                <p className="font-bold text-cyan-300 mb-2">{label}</p>
                {payload.map((p, i) => (
                    <div key={i} style={{ color: p.color }}>{`${p.name}: ${formatCurrency(sanitizeCurrency(p.value))}`}</div>
                ))}
            </div>
        );
    }
    return null;
};

export default CustomTooltip; 
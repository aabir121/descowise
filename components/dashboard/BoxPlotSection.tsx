// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import { getDashboardLabel } from './dashboardLabels';

const BoxPlotSection = ({ boxPlotData, banglaEnabled }) => {
  if (!boxPlotData) return null;
  return (
    <Section title={banglaEnabled ? 'দৈনিক ব্যবহার বণ্টন' : 'Daily Consumption Distribution'} defaultOpen>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-slate-100">{banglaEnabled ? 'পরিসংখ্যানিক সারাংশ' : 'Statistical Summary'}</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">{banglaEnabled ? 'সর্বনিম্ন' : 'Minimum'}</span>
              <span className="text-white font-semibold">{boxPlotData.min} kWh</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">{banglaEnabled ? '২৫তম পার্সেন্টাইল' : '25th Percentile'}</span>
              <span className="text-white font-semibold">{boxPlotData.q1} kWh</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">{banglaEnabled ? 'মধ্যমা' : 'Median'}</span>
              <span className="text-white font-semibold">{boxPlotData.median} kWh</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">{banglaEnabled ? '৭৫তম পার্সেন্টাইল' : '75th Percentile'}</span>
              <span className="text-white font-semibold">{boxPlotData.q3} kWh</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">{banglaEnabled ? 'সর্বাধিক' : 'Maximum'}</span>
              <span className="text-white font-semibold">{boxPlotData.max} kWh</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="relative h-32 bg-slate-700/30 rounded-lg p-4">
              <div className="absolute inset-4 flex items-center">
                <div className="w-full h-8 bg-slate-600 rounded relative">
                  <div className="absolute left-0 top-0 h-full w-1 bg-red-400"></div>
                  <div className="absolute left-1/4 top-0 h-full w-1 bg-yellow-400"></div>
                  <div className="absolute left-1/2 top-0 h-full w-1 bg-green-400"></div>
                  <div className="absolute left-3/4 top-0 h-full w-1 bg-yellow-400"></div>
                  <div className="absolute right-0 top-0 h-full w-1 bg-red-400"></div>
                  <div className="absolute left-0 top-0 h-full w-1 bg-slate-400 opacity-50"></div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-400 px-4">
                <span>{banglaEnabled ? 'নিম্ন' : 'Min'}</span>
                <span>{banglaEnabled ? 'Q1' : 'Q1'}</span>
                <span>{banglaEnabled ? 'মধ্যমা' : 'Median'}</span>
                <span>{banglaEnabled ? 'Q3' : 'Q3'}</span>
                <span>{banglaEnabled ? 'উচ্চ' : 'Max'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default BoxPlotSection; 
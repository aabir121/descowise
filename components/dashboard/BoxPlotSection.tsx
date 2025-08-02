// @ts-nocheck
import React, { useMemo } from 'react';
import Section from '../common/Section';

const BoxPlotSection = ({ boxPlotData, banglaEnabled, t, defaultOpen, sectionId, showInfoIcon, onInfoClick }) => {
  // Calculate positions for the visual box plot based on actual data
  const boxPlotPositions = useMemo(() => {
    if (!boxPlotData) return null;

    const { min, q1, median, q3, max } = boxPlotData;
    const range = max - min;

    // Avoid division by zero
    if (range === 0) {
      return {
        minPos: 0,
        q1Pos: 25,
        medianPos: 50,
        q3Pos: 75,
        maxPos: 100
      };
    }

    return {
      minPos: 0,
      q1Pos: ((q1 - min) / range) * 100,
      medianPos: ((median - min) / range) * 100,
      q3Pos: ((q3 - min) / range) * 100,
      maxPos: 100
    };
  }, [boxPlotData]);

  if (!boxPlotData) return null;

  return (
    <Section
      title={t('dailyConsumptionDistribution')}
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-slate-100">{t('statisticalSummary')}</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">{t('minimum')}</span>
              <span className="text-white font-semibold">{Number(boxPlotData.min).toFixed(2)} {t('kWh')}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">{t('percentile25')}</span>
              <span className="text-white font-semibold">{Number(boxPlotData.q1).toFixed(2)} {t('kWh')}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">{t('median')}</span>
              <span className="text-white font-semibold">{Number(boxPlotData.median).toFixed(2)} {t('kWh')}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">{t('percentile75')}</span>
              <span className="text-white font-semibold">{Number(boxPlotData.q3).toFixed(2)} {t('kWh')}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">{t('maximum')}</span>
              <span className="text-white font-semibold">{Number(boxPlotData.max).toFixed(2)} {t('kWh')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="relative h-32 bg-slate-700/30 rounded-lg p-4">
              <div className="absolute inset-4 flex items-center">
                <div className="w-full h-8 bg-slate-600 rounded relative">
                  {/* Min marker */}
                  <div
                    className="absolute top-0 h-full w-1 bg-red-400"
                    style={{ left: `${boxPlotPositions?.minPos || 0}%` }}
                    title={`Min: ${Number(boxPlotData.min).toFixed(2)} kWh`}
                  ></div>
                  {/* Q1 marker */}
                  <div
                    className="absolute top-0 h-full w-1 bg-yellow-400"
                    style={{ left: `${boxPlotPositions?.q1Pos || 25}%` }}
                    title={`Q1: ${Number(boxPlotData.q1).toFixed(2)} kWh`}
                  ></div>
                  {/* Median marker */}
                  <div
                    className="absolute top-0 h-full w-1 bg-green-400"
                    style={{ left: `${boxPlotPositions?.medianPos || 50}%` }}
                    title={`Median: ${Number(boxPlotData.median).toFixed(2)} kWh`}
                  ></div>
                  {/* Q3 marker */}
                  <div
                    className="absolute top-0 h-full w-1 bg-yellow-400"
                    style={{ left: `${boxPlotPositions?.q3Pos || 75}%` }}
                    title={`Q3: ${Number(boxPlotData.q3).toFixed(2)} kWh`}
                  ></div>
                  {/* Max marker */}
                  <div
                    className="absolute top-0 h-full w-1 bg-red-400"
                    style={{ left: `${boxPlotPositions?.maxPos || 100}%` }}
                    title={`Max: ${Number(boxPlotData.max).toFixed(2)} kWh`}
                  ></div>
                  {/* Box (IQR) */}
                  <div
                    className="absolute top-1 bottom-1 bg-slate-500/60 rounded"
                    style={{
                      left: `${boxPlotPositions?.q1Pos || 25}%`,
                      width: `${(boxPlotPositions?.q3Pos || 75) - (boxPlotPositions?.q1Pos || 25)}%`
                    }}
                  ></div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-400 px-4">
                <span>{Number(boxPlotData.min).toFixed(2)}</span>
                <span>{Number(boxPlotData.q1).toFixed(2)}</span>
                <span>{Number(boxPlotData.median).toFixed(2)}</span>
                <span>{Number(boxPlotData.q3).toFixed(2)}</span>
                <span>{Number(boxPlotData.max).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default BoxPlotSection; 
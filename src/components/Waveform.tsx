import React from 'react';
import classNames from 'classnames';

interface WaveformProps {
  isSidebarHidden: boolean;
}

const Waveform: React.FC<WaveformProps> = ({ isSidebarHidden }) => {
  return (
    <>
      <div id="waveform-container" className={classNames({ 'sidebar-hidden': isSidebarHidden })}>
        <div id="waveform-controls">
          <button id="waveform-zoom-in">+</button>
          <button id="waveform-zoom-out">-</button>
          <button id="waveform-reset">Reset</button>
          <span id="waveform-zoom-level">100%</span>
        </div>
        <div id="waveform-wrapper">
          <canvas id="waveform-canvas"></canvas>
          <div id="waveform-progress"></div>
          <canvas id="ruler-canvas"></canvas>
        </div>
        <div id="waveform-scrollbar">
          <input type="range" id="waveform-slider" min="0" max="100" defaultValue="0" step="1" />
        </div>
      </div>
      <div className={classNames("waveform-trigger-zone", { 'sidebar-hidden': isSidebarHidden })}></div>
    </>
  );
};

export default Waveform;
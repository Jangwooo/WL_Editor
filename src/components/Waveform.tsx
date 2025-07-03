import React, { useRef, useEffect, useState } from 'react';
import classNames from 'classnames';
import type { WaveformData } from '../hooks/useRhythmEditor';

const MUSIC_START_TIME = 3.0;

interface WaveformProps {
  isSidebarHidden: boolean;
  audioBuffer: AudioBuffer | null;
  waveformData: WaveformData[] | null;
  preDelay: number;
}

const Waveform: React.FC<WaveformProps> = ({ isSidebarHidden, audioBuffer, waveformData, preDelay }) => {
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const rulerCanvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformZoom, setWaveformZoom] = useState(1);

  const getPreDelaySeconds = () => preDelay / 1000;

  useEffect(() => {
    if (!waveformData || !audioBuffer) return;

    const waveformCanvas = waveformCanvasRef.current;
    const rulerCanvas = rulerCanvasRef.current;
    if (!waveformCanvas || !rulerCanvas) return;
    
    const waveformCtx = waveformCanvas.getContext('2d');
    const rulerCtx = rulerCanvas.getContext('2d');
    if (!waveformCtx || !rulerCtx) return;
    
    // Resize logic
    const wrapper = waveformCanvas.parentElement!;
    const rect = wrapper.getBoundingClientRect();
    waveformCanvas.width = Math.max(rect.width * waveformZoom, rect.width);
    waveformCanvas.height = 120;
    rulerCanvas.width = waveformCanvas.width;
    rulerCanvas.height = 40;
    
    // Draw Waveform logic from script.js
    const width = waveformCanvas.width;
    const height = waveformCanvas.height;
    const centerY = height / 2;
    const preDelaySeconds = getPreDelaySeconds();
    const totalDuration = MUSIC_START_TIME + audioBuffer.duration + preDelaySeconds;
    const musicStartRatio = MUSIC_START_TIME / totalDuration;
    
    waveformCtx.clearRect(0, 0, width, height);
    const musicStartX = width * musicStartRatio;
    waveformCtx.fillStyle = 'rgba(100, 100, 100, 0.8)';
    waveformCtx.fillRect(0, 0, musicStartX, height);
    // ... (rest of the waveform drawing logic)

    waveformCtx.fillStyle = '#4CAF50';
    const musicAreaWidth = width * (audioBuffer.duration / totalDuration);
    for (let i = 0; i < waveformData.length; i++) {
        const x = musicStartX + (i * musicAreaWidth / waveformData.length);
        const minHeight = waveformData[i].min * centerY;
        const maxHeight = waveformData[i].max * centerY;
        waveformCtx.fillRect(x, centerY - maxHeight, Math.max(1, musicAreaWidth / waveformData.length - 1), maxHeight);
        waveformCtx.fillRect(x, centerY, Math.max(1, musicAreaWidth / waveformData.length - 1), -minHeight);
    }
    
    // Draw Ruler logic from script.js
    rulerCtx.clearRect(0, 0, rulerCanvas.width, rulerCanvas.height);
    // ... (ruler drawing logic)

  }, [audioBuffer, waveformData, preDelay, waveformZoom, isSidebarHidden]);

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
          <canvas id="waveform-canvas" ref={waveformCanvasRef}></canvas>
          <div id="waveform-progress"></div>
          <canvas id="ruler-canvas" ref={rulerCanvasRef}></canvas>
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
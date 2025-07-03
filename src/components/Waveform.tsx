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
  const [waveformZoom] = useState(1);

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
    
    // Draw text labels
    waveformCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    waveformCtx.font = '12px Arial';
    waveformCtx.textAlign = 'center';
    waveformCtx.fillText('게임 시작', musicStartX / 2, height / 2 - 10);
    waveformCtx.fillText('(3초 후 음악 시작)', musicStartX / 2, height / 2 + 5);
    if (preDelaySeconds !== 0) {
        waveformCtx.font = '10px Arial';
        waveformCtx.fillStyle = 'rgba(255, 200, 100, 0.9)';
        waveformCtx.fillText(`Pre-delay: ${preDelaySeconds > 0 ? '+' : ''}${(preDelaySeconds * 1000).toFixed(0)}ms`, musicStartX / 2, height / 2 + 18);
    }
    
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
    rulerCtx.strokeStyle = '#666';
    rulerCtx.fillStyle = '#ccc';
    rulerCtx.font = '9px Arial';

    const pixelsPerSecond = width / totalDuration;
    let timeInterval = 1;

    if (pixelsPerSecond < 30) timeInterval = 10;
    else if (pixelsPerSecond < 60) timeInterval = 5;
    else if (pixelsPerSecond < 120) timeInterval = 2;
    else if (pixelsPerSecond > 500) timeInterval = 0.1;
    else if (pixelsPerSecond > 250) timeInterval = 0.5;

    for (let time = 0; time <= totalDuration; time += timeInterval) {
        const x = (time / totalDuration) * width;
        const isSecond = time % 1 === 0;
        rulerCtx.strokeStyle = time < MUSIC_START_TIME ? '#888' : '#666';
        rulerCtx.beginPath();
        rulerCtx.moveTo(x, 0);
        rulerCtx.lineTo(x, isSecond ? 15 : 8);
        rulerCtx.stroke();
        if (isSecond && time % Math.max(1, Math.floor(timeInterval)) === 0) {
            rulerCtx.fillStyle = time < MUSIC_START_TIME ? '#aaa' : '#ccc';
            if (time < MUSIC_START_TIME) {
                rulerCtx.fillText(`${time.toFixed(0)}s`, x + 1, 28);
            } else {
                const musicTime = time - MUSIC_START_TIME;
                rulerCtx.fillText(`♪${musicTime.toFixed(musicTime < 1 ? 1 : 0)}s`, x + 1, 28);
            }
        }
    }

    const rulerStartX = (MUSIC_START_TIME / totalDuration) * width;
    rulerCtx.strokeStyle = '#ff4444';
    rulerCtx.lineWidth = 2;
    rulerCtx.beginPath();
    rulerCtx.moveTo(rulerStartX, 0);
    rulerCtx.lineTo(rulerStartX, rulerCanvas.height);
    rulerCtx.stroke();
    rulerCtx.fillStyle = '#ff4444';
    rulerCtx.font = 'bold 10px Arial';
    rulerCtx.fillText('음악 시작', rulerStartX + 2, 12);
    rulerCtx.font = '8px Arial';
    rulerCtx.fillText('(3초)', rulerStartX + 2, 22);

  }, [audioBuffer, waveformData, preDelay, waveformZoom, isSidebarHidden, getPreDelaySeconds]);

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
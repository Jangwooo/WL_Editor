import React from 'react';
import classNames from 'classnames';

interface ControlBarProps {
  isHidden: boolean;
  addTabNote: () => void;
  addDirectionNote: () => void;
  loadAudioFile: (file: File) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  elapsedTime: number;
  totalTime: number | undefined;
}

const formatTime = (sec: number) => {
    const min = Math.floor(sec / 60);
    const secRemain = Math.floor(sec % 60);
    const ms = Math.floor((sec * 1000) % 1000 / 10);
    return `${String(min).padStart(2, '0')}:${String(secRemain).padStart(2, '0')}:${String(ms).padStart(2, '0')}`;
}

const ControlBar: React.FC<ControlBarProps> = ({ 
    isHidden, addTabNote, addDirectionNote, loadAudioFile,
    play, pause, stop, elapsedTime, totalTime 
}) => {

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadAudioFile(file);
    }
  };
  
  const displayTotalTime = totalTime || 0;

  return (
    <div id="control-bar" className={classNames({ hidden: isHidden })}>
      <div id="control-bar-content">
        <div id="audio-controls">
          <input type="file" id="audio-file" accept="audio/*" onChange={handleFileChange}/>
          <div id="playback-controls">
            <button id="demo-pause" onClick={pause}>⏸</button>
            <button id="demo-play" onClick={play}>▶</button>
            <button id="demo-stop" onClick={stop}>⏹</button>
          </div>
        </div>

        <div id="time-controls">
          <div id="demo-time">{formatTime(elapsedTime)} / {formatTime(displayTotalTime)}</div>
          <input 
            type="range" 
            id="demo-seekbar" 
            value={elapsedTime * 1000} 
            min="0" 
            max={displayTotalTime * 1000} 
            step="1"
            readOnly // For now, seeking is not implemented
          />
        </div>

        <div id="note-controls">
          <button className="tab" id="add-tab" onClick={addTabNote}>tab note +</button>
          <button className="dir" id="add-dir" onClick={addDirectionNote}>direction Note +</button>
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
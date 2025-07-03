import React from 'react';
import classNames from 'classnames';

interface ControlBarProps {
  isHidden: boolean;
  addTabNote: () => void;
  addDirectionNote: () => void;
}

const ControlBar: React.FC<ControlBarProps> = ({ isHidden, addTabNote, addDirectionNote }) => {
  return (
    <div id="control-bar" className={classNames({ hidden: isHidden })}>
      <div id="control-bar-content">
        <div id="audio-controls">
          <input type="file" id="audio-file" accept="audio/*" />
          <div id="playback-controls">
            <button id="demo-pause">⏸</button>
            <button id="demo-play">▶</button>
            <button id="demo-stop">⏹</button>
          </div>
        </div>

        <div id="time-controls">
          <div id="demo-time">00:00:00 / 00:00:00</div>
          <input type="range" id="demo-seekbar" defaultValue="0" min="0" max="1000" step="1" />
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
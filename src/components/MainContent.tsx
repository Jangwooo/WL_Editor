import React from 'react';
import classNames from 'classnames';

interface MainContentProps {
  isSidebarHidden: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ isSidebarHidden }) => {
  return (
    <div id="main" className={classNames({ 'sidebar-hidden': isSidebarHidden })}>
      <div id="top-bar">
        <button id="save-json">Save Json</button>
        <button id="load-json">Load Json</button>
        <button id="sort-notes">Sort by Beat</button>
        <button id="clear-notes">Clear All</button>
        <div id="volume-controls">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '11px', minWidth: '50px' }}>음악:</label>
              <input type="range" id="music-volume" min="0" max="100" defaultValue="50" step="1" style={{ width: '100px' }} />
              <span id="music-volume-display" style={{ fontSize: '11px', minWidth: '30px' }}>50%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '11px', minWidth: '50px' }}>효과음:</label>
              <input type="range" id="sfx-volume" min="0" max="100" defaultValue="100" step="1" style={{ width: '100px' }} />
              <span id="sfx-volume-display" style={{ fontSize: '11px', minWidth: '30px' }}>100%</span>
            </div>
          </div>
        </div>
      </div>
      <canvas id="canvas"></canvas>
    </div>
  );
};

export default MainContent;
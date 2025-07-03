import React from 'react';
import classNames from 'classnames';

interface SidebarProps {
  isHidden: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isHidden }) => {
  return (
    <div id="sidebar" className={classNames({ hidden: isHidden })}>
      <div style={{ padding: '8px' }}>
        <label>BPM: <input id="bpm" type="number" defaultValue="120" min="60" max="300" step="1" /></label>
        <br /><br />
        <label>Pre-delay (ms): <input id="pre-delay" type="number" defaultValue="3000" min="0" max="10000" step="100" /></label>
        <br /><br />
        <label>Subdivisions:
          <select id="subdivisions" defaultValue="16">
            <option value="4">4분박</option>
            <option value="8">8분박</option>
            <option value="16">16분박</option>
            <option value="32">32분박</option>
          </select>
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th>NO.</th><th>Type</th><th>Beat</th><th>Time</th><th>Direction</th><th></th>
          </tr>
        </thead>
        <tbody id="note-list">
          {/* script.js가 여기 <tr>을 동적으로 추가함 */}
        </tbody>
      </table>
    </div>
  );
};

export default Sidebar;
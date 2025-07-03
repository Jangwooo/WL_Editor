import React from 'react';
import classNames from 'classnames';
import type { Note } from '../hooks/useRhythmEditor';

interface SidebarProps {
  isHidden: boolean;
  notes: Note[];
  bpm: number;
  setBpm: (value: number) => void;
  subdivisions: number;
  setSubdivisions: (value: number) => void;
  preDelay: number;
  setPreDelay: (value: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isHidden,
  notes,
  bpm,
  setBpm,
  subdivisions,
  setSubdivisions,
  preDelay,
  setPreDelay
}) => {
  return (
    <div id="sidebar" className={classNames({ hidden: isHidden })}>
      <div style={{ padding: '8px' }}>
        <label>BPM: <input id="bpm" type="number" value={bpm} onChange={e => setBpm(Number(e.target.value))} min="60" max="300" step="1" /></label>
        <br /><br />
        <label>Pre-delay (ms): <input id="pre-delay" type="number" value={preDelay} onChange={e => setPreDelay(Number(e.target.value))} min="0" max="10000" step="100" /></label>
        <br /><br />
        <label>Subdivisions:
          <select id="subdivisions" value={subdivisions} onChange={e => setSubdivisions(Number(e.target.value))}>
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
          {/* Note rendering will be implemented here */}
        </tbody>
      </table>
    </div>
  );
};

export default Sidebar;
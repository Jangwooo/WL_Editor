import React from 'react';
import classNames from 'classnames';
import type { Note } from '../hooks/useRhythmEditor';
import { beatToTime } from '../utils';

interface SidebarProps {
  isHidden: boolean;
  notes: Note[];
  bpm: number;
  setBpm: (value: number) => void;
  subdivisions: number;
  setSubdivisions: (value: number) => void;
  preDelay: number;
  setPreDelay: (value: number) => void;
  updateNote: (index: number, updatedNote: Note) => void;
  deleteNote: (index: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isHidden,
  notes,
  bpm,
  setBpm,
  subdivisions,
  setSubdivisions,
  preDelay,
  setPreDelay,
  updateNote,
  deleteNote
}) => {

  const handleNoteChange = (index: number, field: keyof Note, value: any) => {
    const note = notes[index];
    if (field === 'beat') {
      updateNote(index, { ...note, beat: parseInt(value, 10) });
    } else {
      updateNote(index, { ...note, [field]: value });
    }
  };

  const getPreDelaySeconds = () => preDelay / 1000;

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
          {notes.map((note, index) => {
            const originalTime = beatToTime(note.beat, bpm, subdivisions);
            let finalTimeDisplay = '';
            let finalTimeTitle = '';

            if (note.beat === 0 && note.type === "direction") {
                finalTimeDisplay = `${originalTime.toFixed(3)}s`;
                finalTimeTitle = '게임 시작점';
            } else {
                const preDelaySeconds = getPreDelaySeconds();
                const finalTime = originalTime + preDelaySeconds;
                finalTimeDisplay = `${finalTime.toFixed(3)}s`;
                finalTimeTitle = `원본: ${originalTime.toFixed(3)}s → 최종: ${finalTime.toFixed(3)}s (pre-delay: ${preDelaySeconds > 0 ? '+' : ''}${preDelaySeconds.toFixed(3)}s)`;
            }

            return (
              <tr key={index}>
                <td>{index}</td>
                <td>{note.type}</td>
                <td>
                  <input 
                    type="number" 
                    value={note.beat} 
                    onChange={e => handleNoteChange(index, 'beat', e.target.value)}
                    step="1"
                  />
                </td>
                <td title={finalTimeTitle}>{finalTimeDisplay}</td>
                <td>
                  {note.type === 'direction' ? (
                    <select 
                      value={note.direction} 
                      onChange={e => handleNoteChange(index, 'direction', e.target.value)}
                    >
                      {["none", "up", "down", "left", "right", "upleft", "upright", "downleft", "downright"].map(d => 
                        <option key={d} value={d}>{d}</option>
                      )}
                    </select>
                  ) : '-'}
                </td>
                <td>
                  <button 
                    onClick={() => deleteNote(index)}
                    disabled={note.beat === 0 && note.type === "direction"}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Sidebar;
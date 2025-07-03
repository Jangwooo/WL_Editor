import { useState } from 'react'
import './index.css'
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import ControlBar from './components/ControlBar';
import Waveform from './components/Waveform';
import classNames from 'classnames';
import { useRhythmEditor } from './hooks/useRhythmEditor';

function App() {
  const [isSidebarHidden, setSidebarHidden] = useState(false);
  const [isControlBarHidden, setControlBarHidden] = useState(false);

  const editor = useRhythmEditor();

  return (
    <>
      <Sidebar 
        isHidden={isSidebarHidden} 
        notes={editor.notes}
        bpm={editor.bpm}
        setBpm={editor.setBpm}
        subdivisions={editor.subdivisions}
        setSubdivisions={editor.setSubdivisions}
        preDelay={editor.preDelay}
        setPreDelay={editor.setPreDelay}
        updateNote={editor.updateNote}
        deleteNote={editor.deleteNote}
      />
      <button 
        id="sidebar-toggle" 
        className={classNames("toggle-btn", "sidebar-toggle", { hidden: isSidebarHidden })}
        onClick={() => setSidebarHidden(!isSidebarHidden)}
      >
        {isSidebarHidden ? '▶' : '◀'}
      </button>

      <MainContent 
        isSidebarHidden={isSidebarHidden}
        notes={editor.notes}
        zoom={editor.zoom}
        setZoom={editor.setZoom}
        viewOffset={editor.viewOffset}
        setViewOffset={editor.setViewOffset}
        sortNotes={editor.sortNotes}
        clearNotes={editor.clearNotes}
        subdivisions={editor.subdivisions}
        saveJson={editor.saveJson}
        loadJson={editor.loadJson}
        isPlaying={editor.isPlaying}
        demoPlayerPosition={editor.demoPlayerPosition}
        highlightedNoteIndex={editor.highlightedNoteIndex}
        highlightedNoteTimer={editor.highlightedNoteTimer}
        pathData={editor.pathData}
        bpm={editor.bpm}
        preDelay={editor.preDelay}
      />

      <ControlBar 
        isHidden={isControlBarHidden}
        addTabNote={editor.addTabNote}
        addDirectionNote={editor.addDirectionNote}
        loadAudioFile={editor.loadAudioFile}
        play={editor.play}
        pause={editor.pause}
        stop={editor.stop}
        elapsedTime={editor.elapsedTime}
        totalTime={editor.audioBuffer?.duration}
      />
      <button
        id="control-bar-toggle"
        className={classNames("toggle-btn", "control-bar-toggle", { hidden: isControlBarHidden })}
        onClick={() => setControlBarHidden(!isControlBarHidden)}
      >
        {isControlBarHidden ? '⚙' : '×'}
      </button>

      <Waveform 
        isSidebarHidden={isSidebarHidden}
        audioBuffer={editor.audioBuffer}
        waveformData={editor.waveformData}
        preDelay={editor.preDelay}
      />
    </>
  )
}

export default App

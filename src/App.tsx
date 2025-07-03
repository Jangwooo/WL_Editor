import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import ControlBar from './components/ControlBar';
import Waveform from './components/Waveform';
import classNames from 'classnames';

function App() {
  const [isSidebarHidden, setSidebarHidden] = useState(false);
  const [isControlBarHidden, setControlBarHidden] = useState(false);

  return (
    <>
      <Sidebar isHidden={isSidebarHidden} />
      <button 
        id="sidebar-toggle" 
        className={classNames("toggle-btn", "sidebar-toggle", { hidden: isSidebarHidden })}
        onClick={() => setSidebarHidden(!isSidebarHidden)}
      >
        {isSidebarHidden ? '▶' : '◀'}
      </button>

      <MainContent isSidebarHidden={isSidebarHidden} />

      <ControlBar isHidden={isControlBarHidden} />
      <button
        id="control-bar-toggle"
        className={classNames("toggle-btn", "control-bar-toggle", { hidden: isControlBarHidden })}
        onClick={() => setControlBarHidden(!isControlBarHidden)}
      >
        {isControlBarHidden ? '⚙' : '×'}
      </button>

      <Waveform isSidebarHidden={isSidebarHidden} />
    </>
  )
}

export default App

import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Sidebar from './components/Sidebar';
import MainCanvas from './components/MainCanvas';
import ControlBar from './components/ControlBar';
import Waveform from './components/Waveform';

function App() {
  return (
    <div className="App">
      <Sidebar />
      <MainCanvas />
      <ControlBar />
      <Waveform />
    </div>
  )
}

export default App

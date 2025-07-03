import { useState, useRef, useEffect } from 'react';

// From script.js, these will be defined properly later
const MAC_DELAY_OFFSET = 800; // ms
const SOUND_POOL_SIZE = 10;
const MUSIC_START_TIME = 3.0;

// Type definitions
export interface Note {
  type: 'tab' | 'direction';
  beat: number;
  direction?: 'none' | 'up' | 'down' | 'left' | 'right' | 'upleft' | 'upright' | 'downleft' | 'downright';
}

export interface SavedAudioFile {
  name: string;
  size: number;
  type: string;
}

export const useRhythmEditor = () => {
  // Global variables from script.js as state
  const [notes, setNotes] = useState<Note[]>([]);
  const [zoom, setZoom] = useState(30);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioFileURL, setAudioFileURL] = useState<string | null>(null);
  const [savedAudioFile, setSavedAudioFile] = useState<SavedAudioFile | null>(null);
  
  const [bpm, setBpm] = useState(120);
  const [subdivisions, setSubdivisions] = useState(16);
  const [preDelay, setPreDelay] = useState(3000);

  // Refs for things that don't trigger re-renders
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);
  const demoAudio = useRef<HTMLAudioElement>(new Audio());

  // Initialization (from DOMContentLoaded)
  useEffect(() => {
    // Set initial view offset once canvas is ready
    // This will be moved to the canvas component
    // setViewOffset({ x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 });

    // Load from storage
    // loadFromStorage();

    // Ensure initial note
    ensureInitialDirectionNote();
    
    // Load sounds
    // loadNoteSounds();

    console.log('Rhythm Editor Initialized');
  }, []);
  
  const ensureInitialDirectionNote = () => {
    setNotes(currentNotes => {
      if (!currentNotes.find(n => n.beat === 0 && n.type === "direction")) {
        return [{ type: "direction", beat: 0, direction: "none" }, ...currentNotes];
      }
      return currentNotes;
    });
  };

  return {
    notes,
    setNotes,
    zoom,
    setZoom,
    viewOffset,
    setViewOffset,
    isPlaying,
    isPaused,
    elapsedTime,
    audioBuffer,
    audioFileURL,
    savedAudioFile,
    bpm,
    setBpm,
    subdivisions,
    setSubdivisions,
    preDelay,
    setPreDelay,
    isPanning,
    lastMousePos,
    animationFrameId,
    demoAudio,
  };
};
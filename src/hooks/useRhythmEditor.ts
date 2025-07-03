import { useState, useRef, useEffect } from 'react';
import { beatToTime, timeToBeat } from '../utils';

// Type definitions moved to top level and exported
export interface Note {
  type: 'tab' | 'direction';
  beat: number;
  direction?: 'none' | 'up' | 'down' | 'left' | 'right' | 'upleft' | 'upright' | 'downleft' | 'downright';
}

// From script.js, these will be defined properly later
const MAC_DELAY_OFFSET = 800; // ms
const SOUND_POOL_SIZE = 10;
const MUSIC_START_TIME = 3.0;

// Type definitions
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

  const addTabNote = () => {
    setNotes(currentNotes => {
      const maxBeat = Math.max(0, ...currentNotes.map(n => n.beat));
      return [...currentNotes, { type: "tab", beat: maxBeat + subdivisions }];
    });
  };

  const addDirectionNote = () => {
    setNotes(currentNotes => {
      const dirs = currentNotes.filter(n => n.type === "direction");
      const maxDir = dirs.sort((a,b) => a.beat - b.beat)[dirs.length - 1];
      const newBeat = (maxDir?.beat ?? 0) + subdivisions;
      const inherited = maxDir?.direction ?? "none";
      return [...currentNotes, { type: "direction", beat: newBeat, direction: inherited }];
    });
  };

  const deleteNote = (indexToDelete: number) => {
    setNotes(currentNotes => currentNotes.filter((_, index) => index !== indexToDelete));
  };

  const updateNote = (indexToUpdate: number, updatedNote: Note) => {
    setNotes(currentNotes => currentNotes.map((note, index) => 
      index === indexToUpdate ? updatedNote : note
    ));
  };
  
  const sortNotes = () => {
    setNotes(currentNotes => [...currentNotes].sort((a, b) => a.beat - b.beat));
  };
  
  const clearNotes = () => {
    if (window.confirm("모든 데이터를 삭제하시겠습니까?")) {
      setNotes([{ type: "direction", beat: 0, direction: "none" }]);
    }
  };

  // Initialization with the initial direction note
  useEffect(() => {
    setNotes([{ type: "direction", beat: 0, direction: "none" }]);
  }, []);

  const saveJson = () => {
    const preDelaySeconds = preDelay / 1000;

    const exportData = {
        diffIndex: 5,
        level: 10,
        bpm: bpm,
        subdivisions: subdivisions,
        preDelay: preDelay, // Assuming preDelay is already adjusted for OS if needed
        noteList: notes.map(n => {
            const originalTime = beatToTime(n.beat, bpm, subdivisions);
            let finalTime;
            if (n.beat === 0 && n.type === "direction") {
                finalTime = originalTime;
            } else {
                finalTime = originalTime + preDelaySeconds;
            }

            return {
                beat: n.beat,
                originalTime: originalTime,
                musicTime: MUSIC_START_TIME + originalTime,
                finalTime: finalTime,
                isLong: false,
                longTime: 0.0,
                noteType: n.type === "direction" ? "Direction" : "Tab",
                direction: n.direction || "none"
            };
        }),
        metadata: {
            description: "Music starts at 3 seconds, with pre-delay correction",
            timingExplanation: "finalTime = 3.0 + originalTime + preDelay (except for beat 0 direction note)",
            exportedAt: new Date().toISOString()
        }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chart.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const json = JSON.parse(ev.target?.result as string);
            if (!json.noteList || !Array.isArray(json.noteList)) {
                alert("올바른 JSON 파일이 아닙니다.");
                return;
            }

            const newNotes: Note[] = json.noteList.map((n: any) => ({
                type: n.noteType === "Direction" ? "direction" : "tab",
                beat: n.beat,
                direction: n.direction || "none"
            }));

            setNotes(newNotes);
            setBpm(json.bpm || 120);
            setSubdivisions(json.subdivisions || 16);
            setPreDelay(json.preDelay || 3000);

        } catch (err: any) {
            alert("불러오기 중 오류 발생: " + err.message);
        }
    };
    reader.readAsText(file);
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
    addTabNote,
    addDirectionNote,
    deleteNote,
    updateNote,
    sortNotes,
    clearNotes,
    saveJson,
    loadJson,
  };
};
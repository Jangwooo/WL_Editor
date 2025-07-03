import { useState, useRef, useEffect, useMemo } from 'react';
import { beatToTime, timeToBeat, directionToVector } from '../utils';

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

export interface WaveformData {
  min: number;
  max: number;
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
  const [waveformData, setWaveformData] = useState<WaveformData[] | null>(null);
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
  const startTimeRef = useRef(0);
  const playedNotesRef = useRef<Set<string>>(new Set());

  const [demoPlayerPosition, setDemoPlayerPosition] = useState({ x: 0, y: 0 });

  const [highlightedNoteIndex, setHighlightedNoteIndex] = useState<number | null>(null);
  const highlightedNoteTimer = useRef(0);

  const tabSoundPool = useRef<HTMLAudioElement[]>([]);
  const directionSoundPool = useRef<HTMLAudioElement[]>([]);

  const pathData = useMemo(() => {
    const preDelaySeconds = preDelay / 1000;
    const directionNotes = notes.filter(n => n.type === "direction").sort((a, b) => a.beat - b.beat);

    const pathDirectionNotes = directionNotes.map(note => {
        let pathBeat;
        if (note.beat === 0 && note.type === "direction") {
            pathBeat = 0;
        } else {
            const originalTime = beatToTime(note.beat, bpm, subdivisions);
            const adjustedTime = originalTime + preDelaySeconds;
            pathBeat = timeToBeat(adjustedTime, bpm, subdivisions);
        }
        return { ...note, pathBeat };
    }).sort((a, b) => a.pathBeat - b.pathBeat);

    const nodePositions: {x:number, y:number}[] = [];
    let currentPos = { x: 0, y: 0 };
    nodePositions.push(currentPos);
    for (let i = 0; i < pathDirectionNotes.length - 1; i++) {
        const a = pathDirectionNotes[i];
        const b = pathDirectionNotes[i+1];
        const dBeat = b.pathBeat - a.pathBeat;
        const dist = (8 * dBeat) / subdivisions;
        const [dx, dy] = directionToVector(a.direction);
        const mag = Math.hypot(dx, dy) || 1;
        const nextPos = { x: currentPos.x + (dx/mag) * dist, y: currentPos.y + (dy/mag) * dist };
        nodePositions.push(nextPos);
        currentPos = nextPos;
    }
    
    return { pathDirectionNotes, nodePositions };

  }, [notes, bpm, subdivisions, preDelay]);

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

  const loadAudioFile = async (file: File) => {
    if (audioFileURL) {
        URL.revokeObjectURL(audioFileURL);
    }
    const newUrl = URL.createObjectURL(file);
    setAudioFileURL(newUrl);
    setSavedAudioFile({ name: file.name, size: file.size, type: file.type });

    try {
        const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        setAudioBuffer(decodedBuffer);
        generateWaveformData(decodedBuffer);
    } catch (e) {
        console.warn("Web Audio API failed, using dummy data.", e);
        // Fallback to create a dummy waveform based on audio element duration
        const audio = new Audio(newUrl);
        audio.onloadedmetadata = () => {
            const dummyBuffer = { duration: audio.duration, getChannelData: () => new Float32Array() };
            setAudioBuffer(dummyBuffer as any);
            generateWaveformData(dummyBuffer as any, true);
        }
    }
  };

  const generateWaveformData = (buffer: AudioBuffer, isDummy = false) => {
    if (!buffer) return;

    const data: WaveformData[] = [];
    if (isDummy || !buffer.getChannelData) {
        for (let i = 0; i < 2000; i++) {
            const intensity = Math.random() * 0.5;
            data.push({ min: -intensity, max: intensity });
        }
    } else {
        const channelData = buffer.getChannelData(0);
        const samples = channelData.length;
        const blockSize = Math.max(1, Math.floor(samples / 2000));

        for (let i = 0; i < samples; i += blockSize) {
            let min = 0;
            let max = 0;
            for (let j = 0; j < blockSize && i + j < samples; j++) {
                const sample = channelData[i + j];
                if (sample > max) max = sample;
                if (sample < min) min = sample;
            }
            data.push({ min, max });
        }
    }
    setWaveformData(data);
  };

  const play = () => {
    if (!audioFileURL) return;
    
    if (isPaused) {
      setIsPaused(false);
      startTimeRef.current = performance.now() - elapsedTime * 1000;
      demoAudio.current.currentTime = Math.max(0, elapsedTime - MUSIC_START_TIME);
      demoAudio.current.play();
    } else if (!isPlaying) {
      setIsPlaying(true);
      setIsPaused(false);
      setElapsedTime(0);
      playedNotesRef.current.clear();
      startTimeRef.current = performance.now();
      
      setTimeout(() => {
        if (demoAudio.current) {
          demoAudio.current.currentTime = 0;
          demoAudio.current.play();
        }
      }, MUSIC_START_TIME * 1000);
    }
  };

  const pause = () => {
    if (!isPlaying) return;
    setIsPaused(!isPaused);
    if (!isPaused) { // Resuming
        startTimeRef.current = performance.now() - elapsedTime * 1000;
        demoAudio.current.play();
    } else { // Pausing
        demoAudio.current.pause();
        if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    }
  };

  const stop = () => {
    if (!isPlaying) return;
    setIsPlaying(false);
    setIsPaused(false);
    setElapsedTime(0);
    demoAudio.current.pause();
    demoAudio.current.currentTime = 0;
    if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    playedNotesRef.current.clear();
  };

  const getNotePositionFromPathData = (pathBeat: number, pathDirectionNotes: any[], nodePositions: any[]) => {
    // This is a simplified version of the original logic
    for (let i = 0; i < pathDirectionNotes.length - 1; i++) {
        const a = pathDirectionNotes[i];
        const b = pathDirectionNotes[i + 1];
        const pa = nodePositions[i];
        const pb = nodePositions[i + 1];

        if (a.pathBeat <= pathBeat && pathBeat <= b.pathBeat) {
            if (b.pathBeat === a.pathBeat) return { x: pa.x, y: pa.y };
            const interp = (pathBeat - a.pathBeat) / (b.pathBeat - a.pathBeat);
            return {
                x: pa.x + (pb.x - pa.x) * interp,
                y: pa.y + (pb.y - pa.y) * interp
            };
        }
    }
    return null;
  }
  
  // Sound pool initialization
  useEffect(() => {
    try {
        tabSoundPool.current = Array.from({ length: SOUND_POOL_SIZE }, () => new Audio('/sfx/tab.mp3'));
        directionSoundPool.current = Array.from({ length: SOUND_POOL_SIZE }, () => new Audio('/sfx/tab.mp3'));
    } catch (e) {
        console.warn("Failed to load note sounds", e);
    }
  }, []);

  const getAvailableSound = (pool: HTMLAudioElement[]) => {
    // Simplified version of the original logic
    const sound = pool.find(audio => audio.paused || audio.ended);
    return sound || pool[0];
  };

  const playNoteSound = (noteType: 'tab' | 'direction') => {
    const pool = noteType === 'tab' ? tabSoundPool.current : directionSoundPool.current;
    if(pool.length > 0) {
        const sound = getAvailableSound(pool);
        sound.currentTime = 0;
        sound.play().catch(e => console.warn("Sound play failed", e));
    }
  };

  const checkNoteHits = (currentTime: number) => {
    const preDelaySeconds = preDelay / 1000;
    const tolerance = 0.05;

    notes.forEach((note, index) => {
        const noteId = `${note.type}-${note.beat}-${index}`;
        if (playedNotesRef.current.has(noteId)) return;

        let targetTime;
        if (note.beat === 0 && note.type === "direction") {
            targetTime = 0;
        } else {
            const originalTime = beatToTime(note.beat, bpm, subdivisions);
            targetTime = originalTime + preDelaySeconds;
        }

        if (currentTime >= targetTime - tolerance && currentTime <= targetTime + tolerance) {
            if (!(note.beat === 0 && note.type === "direction")) {
                playNoteSound(note.type);
            }
            playedNotesRef.current.add(noteId);
            setHighlightedNoteIndex(index);
            highlightedNoteTimer.current = 0.3; // Highlight for 0.3s
        }
    });
  };

  // Main playback loop
  useEffect(() => {
    if (isPlaying && !isPaused) {
      const update = () => {
        const currentElapsedTime = (performance.now() - startTimeRef.current) / 1000;
        setElapsedTime(currentElapsedTime);
        
        checkNoteHits(currentElapsedTime);

        if (highlightedNoteTimer.current > 0) {
            highlightedNoteTimer.current -= 1/60;
            if(highlightedNoteTimer.current <= 0) {
                setHighlightedNoteIndex(null);
            }
        }

        const currentBeat = timeToBeat(currentElapsedTime, bpm, subdivisions);
        
        // Use memoized pathData
        const { pathDirectionNotes, nodePositions } = pathData;
        const playerPos = getNotePositionFromPathData(currentBeat, pathDirectionNotes, nodePositions);
        if(playerPos) setDemoPlayerPosition(playerPos);
        
        animationFrameId.current = requestAnimationFrame(update);
      };
      animationFrameId.current = requestAnimationFrame(update);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, isPaused, bpm, subdivisions, pathData]);
  
  // Update audio source URL
  useEffect(() => {
    if (audioFileURL) {
        demoAudio.current.src = audioFileURL;
    }
  }, [audioFileURL]);

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
    waveformData,
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
    loadAudioFile,
    play,
    pause,
    stop,
    demoPlayerPosition,
    highlightedNoteIndex,
    highlightedNoteTimer: highlightedNoteTimer.current,
    pathData,
  };
};
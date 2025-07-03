import React, { useRef, useEffect } from 'react';
import classNames from 'classnames';
import type { Note } from '../hooks/useRhythmEditor';
import { directionToVector, beatToTime, timeToBeat } from '../utils';

interface MainContentProps {
  isSidebarHidden: boolean;
  notes: Note[];
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  viewOffset: { x: number; y: number; };
  setViewOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number; }>>;
  sortNotes: () => void;
  clearNotes: () => void;
  subdivisions: number;
  saveJson: () => void;
  loadJson: (file: File) => void;
  isPlaying: boolean;
  demoPlayerPosition: { x: number; y: number; };
  highlightedNoteIndex: number | null;
  highlightedNoteTimer: number;
  pathData: {
    pathDirectionNotes: any[];
    nodePositions: { x: number; y: number; }[];
  };
  bpm: number;
  preDelay: number;
}

const MainContent: React.FC<MainContentProps> = ({ 
  isSidebarHidden,
  notes,
  zoom,
  setZoom,
  viewOffset,
  setViewOffset,
  sortNotes,
  clearNotes,
  subdivisions,
  saveJson,
  loadJson,
  isPlaying,
  demoPlayerPosition,
  highlightedNoteIndex,
  highlightedNoteTimer,
  pathData,
  bpm,
  preDelay
 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Resize canvas
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Start of drawing logic from script.js ---

    // drawGrid
    const drawGrid = () => {
      const gridSize = 8;
      const startX = Math.floor(-viewOffset.x / zoom / gridSize) - 1;
      const endX = Math.ceil((canvas.width - viewOffset.x) / zoom / gridSize) + 1;
      const startY = Math.floor(-viewOffset.y / zoom / gridSize) - 1;
      const endY = Math.ceil((canvas.height - viewOffset.y) / zoom / gridSize) + 1;

      ctx.strokeStyle = "rgba(150, 150, 150, 0.2)";
      ctx.lineWidth = 1;

      for (let i = startX; i <= endX; i++) {
        const x = i * gridSize * zoom + viewOffset.x;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let j = startY; j <= endY; j++) {
        const y = j * gridSize * zoom + viewOffset.y;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    drawGrid();

    // Use pre-calculated path data
    const { pathDirectionNotes, nodePositions } = pathData;

    // Draw Path
    ctx.beginPath();
    ctx.moveTo(nodePositions[0].x * zoom + viewOffset.x, nodePositions[0].y * zoom + viewOffset.y);
    for (let i = 1; i < nodePositions.length; i++) {
        ctx.lineTo(nodePositions[i].x * zoom + viewOffset.x, nodePositions[i].y * zoom + viewOffset.y);
    }
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw All Notes
    const preDelaySeconds = preDelay / 1000;
    notes.forEach((note, index) => {
      let pathBeat;
      if (note.beat === 0 && note.type === "direction") {
        pathBeat = 0;
      } else {
        const originalTime = beatToTime(note.beat, bpm, subdivisions);
        const adjustedTime = originalTime + preDelaySeconds;
        pathBeat = timeToBeat(adjustedTime, bpm, subdivisions);
      }
      const pos = getNotePositionOnPath(pathBeat);
      if (!pos) return;

      const screenX = pos.x * zoom + viewOffset.x;
      const screenY = pos.y * zoom + viewOffset.y;
      
      if (note.type === "tab") {
          ctx.beginPath();
          ctx.arc(screenX, screenY, 5, 0, 2 * Math.PI);
          // Pre-delay가 적용된 노트는 다른 색상으로 표시
          ctx.fillStyle = (note.beat === 0) ? "red" : "#FF6B6B";
          ctx.fill();
          if (note.beat !== 0) {
              ctx.strokeStyle = "#4CAF50";
              ctx.lineWidth = 2;
              ctx.stroke();
          }
      }

      if (note.type === "direction") {
          const [dx, dy] = directionToVector(note.direction);
          const mag = Math.hypot(dx, dy) || 1;
          const ux = (dx / mag) * 16;
          const uy = (dy / mag) * 16;
          const endX = screenX + ux;
          const endY = screenY + uy;

          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = (note.beat === 0) ? "#f00" : "#4CAF50";
          ctx.lineWidth = 2;
          ctx.stroke();

          const perpX = -uy * 0.5;
          const perpY = ux * 0.5;
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(endX - ux * 0.4 + perpX, endY - uy * 0.4 + perpY);
          ctx.lineTo(endX - ux * 0.4 - perpX, endY - uy * 0.4 - perpY);
          ctx.closePath();
          ctx.fillStyle = (note.beat === 0) ? "#f00" : "#4CAF50";
          ctx.fill();
      }
    });
    
    // Draw highlight effect
    if (highlightedNoteIndex !== null && highlightedNoteTimer > 0) {
        const note = notes[highlightedNoteIndex];
        let pathBeat;
        if (note.beat === 0 && note.type === "direction") {
            pathBeat = 0;
        } else {
            const originalTime = beatToTime(note.beat, bpm, subdivisions);
            const adjustedTime = originalTime + preDelaySeconds;
            pathBeat = timeToBeat(adjustedTime, bpm, subdivisions);
        }
        const pos = getNotePositionOnPath(pathBeat);
        
        if (pos) {
            const x = pos.x * zoom + viewOffset.x;
            const y = pos.y * zoom + viewOffset.y;

            const alpha = Math.min(1, highlightedNoteTimer * 2);
            const radius = 15 + (0.5 - highlightedNoteTimer) * 30;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(255, 200, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

    // Draw player
    if (isPlaying && !isNaN(demoPlayerPosition.x) && !isNaN(demoPlayerPosition.y)) {
      const screenX = demoPlayerPosition.x * zoom + viewOffset.x;
      const screenY = demoPlayerPosition.y * zoom + viewOffset.y;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.strokeStyle = "blue";
      ctx.fillStyle = "blue";
      ctx.beginPath();
      const spikes = 5;
      const outerRadius = 10;
      const innerRadius = 4;
      for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / spikes;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // --- End of drawing logic ---

  }, [pathData, notes, zoom, viewOffset, subdivisions, isPlaying, demoPlayerPosition, highlightedNoteIndex, highlightedNoteTimer, bpm, preDelay]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - viewOffset.x) / zoom;
    const worldY = (mouseY - viewOffset.y) / zoom;
    
    const newZoom = zoom * delta;
    
    setViewOffset({
        x: mouseX - worldX * newZoom,
        y: mouseY - worldY * newZoom
    });
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) { // Middle mouse button
      isPanning.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setViewOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {
      isPanning.current = false;
    }
  };

  const handleLoadJsonClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        loadJson(file);
      }
    };
    input.click();
  };

  const getNotePositionOnPath = (noteBeat: number) => {
    const { pathDirectionNotes, nodePositions } = pathData;
    for (let i = 0; i < pathDirectionNotes.length - 1; i++) {
        const a = pathDirectionNotes[i];
        const b = pathDirectionNotes[i + 1];
        const pa = nodePositions[i];
        const pb = nodePositions[i + 1];
        if (a.pathBeat <= noteBeat && noteBeat <= b.pathBeat) {
            if (b.pathBeat === a.pathBeat) return pa;
            const interp = (noteBeat - a.pathBeat) / (b.pathBeat - a.pathBeat);
            return { x: pa.x + (pb.x - pa.x) * interp, y: pa.y + (pb.y - pa.y) * interp };
        }
    }
    return null;
  }

  return (
    <div 
      id="main" 
      className={classNames({ 'sidebar-hidden': isSidebarHidden })}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div id="top-bar">
        <button id="save-json" onClick={saveJson}>Save Json</button>
        <button id="load-json" onClick={handleLoadJsonClick}>Load Json</button>
        <button id="sort-notes" onClick={sortNotes}>Sort by Beat</button>
        <button id="clear-notes" onClick={clearNotes}>Clear All</button>
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
      <canvas id="canvas" ref={canvasRef}></canvas>
    </div>
  );
};

export default MainContent;
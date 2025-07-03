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
}

const MainContent: React.FC<MainContentProps> = ({ 
  isSidebarHidden,
  notes,
  zoom,
  setZoom,
  viewOffset,
  setViewOffset
 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // This will be passed from props later
  const subdivisions = 16; 

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

    // drawPath (simplified for now)
    const directionNotes = notes.filter(n => n.type === "direction").sort((a, b) => a.beat - b.beat);
    
    if(directionNotes.length === 0) return;

    let pos = { x: 0, y: 0 };
    ctx.beginPath();
    ctx.moveTo(pos.x * zoom + viewOffset.x, pos.y * zoom + viewOffset.y);

    for (let i = 0; i < directionNotes.length - 1; i++) {
        const a = directionNotes[i];
        const b = directionNotes[i+1];
        const dBeat = b.beat - a.beat;
        const dist = (8 * dBeat) / subdivisions;
        const [dx, dy] = directionToVector(a.direction);
        const mag = Math.hypot(dx, dy) || 1;
        const next = {
            x: pos.x + (dx / mag) * dist,
            y: pos.y + (dy / mag) * dist
        };
        ctx.lineTo(next.x * zoom + viewOffset.x, next.y * zoom + viewOffset.y);
        pos = next;
    }
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- End of drawing logic ---

  }, [notes, zoom, viewOffset, subdivisions]);

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
        <button id="save-json">Save Json</button>
        <button id="load-json">Load Json</button>
        <button id="sort-notes">Sort by Beat</button>
        <button id="clear-notes">Clear All</button>
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
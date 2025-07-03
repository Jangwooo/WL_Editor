export function directionToVector(dir: string | undefined): [number, number] {
    const map: { [key: string]: [number, number] } = {
        none: [0, 0],
        up: [0, -1],
        down: [0, 1],
        left: [-1, 0],
        right: [1, 0],
        upleft: [-1, -1],
        upright: [1, -1],
        downleft: [-1, 1],
        downright: [1, 1]
    };
    return map[dir || 'none'] || [0, 0];
}

export function beatToTime(beat: number, bpm: number, subdivisions: number): number {
    if (bpm === 0 || subdivisions === 0) return 0;
    return (beat * 60) / (bpm * subdivisions);
}

export function timeToBeat(time: number, bpm: number, subdivisions: number): number {
    return Math.round((time * bpm * subdivisions) / 60);
}
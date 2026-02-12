import React, { useEffect, useRef } from 'react';
import '../styles/aura.css';

/**
 * AuraBackground — Renders expanding halo rings with a "wavy" organic line.
 * 
 * Features:
 * - Canvas-based rendering for high performance.
 * - Cyberpunk aesthetic: Neon/Soft gradients (Cyan, Purple, Pink).
 * - "Flowing" aura: Rotating conic gradients and wave undulations.
 * - Smooth animation that doesn't impact scroll performance.
 */

const AuraBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // Visual Configuration
        const RING_LIFETIME = 14000; // Slower, more majestic expansion
        const SPAWN_INTERVAL = 3500;
        const WAVE_COUNT = 12;        // Fewer waves for "softer" look
        const WAVE_SPEED = 0.002;

        // Cyberpunk / Ethereal Gradient Colors
        // We will interpolate these or use them in a gradient
        const COLOR_STOPS = [
            { pos: 0.0, color: '#00f3ff' }, // Cyan Neon
            { pos: 0.25, color: '#bc13fe' }, // Neon Purple
            { pos: 0.5, color: '#4d00c2' }, // Deep Blue
            { pos: 0.75, color: '#ff0055' }, // Cyber Pink
            { pos: 1.0, color: '#00f3ff' }, // Loop back to Cyan
        ];

        interface Ring {
            pawnTime: number;
        }

        // Initialize with some pre-warmed rings
        const now = performance.now();
        let rings: Ring[] = [
            { pawnTime: now - 10000 },
            { pawnTime: now - 6000 },
            { pawnTime: now - 2000 }
        ];

        let lastSpawnTime = now;
        let animationFrameId: number;

        const render = (time: number) => {
            // 1. Handle resize (Basic check, can be optimized with ResizeObserver if needed)
            const dpr = window.devicePixelRatio || 1;
            const displayWidth = window.innerWidth;
            const displayHeight = window.innerHeight;

            if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
                canvas.width = displayWidth * dpr;
                canvas.height = displayHeight * dpr;
                // Scale context to match dpr
                ctx.scale(dpr, dpr);
            }

            // Logical dimensions (CSS pixels)
            const w = displayWidth;
            const h = displayHeight;
            const cx = w / 2;
            const cy = h / 2;
            const maxRadius = Math.max(w, h) * 0.8;

            // 2. Clear
            ctx.clearRect(0, 0, w, h);

            // Global Composite Operation for "Glowing" blend
            // 'screen' or 'lighter' can create nice additive light effects
            ctx.globalCompositeOperation = 'screen';

            // 3. Spawn logic
            if (time - lastSpawnTime > SPAWN_INTERVAL) {
                rings.push({ pawnTime: time });
                lastSpawnTime = time;
            }

            // 4. Update & Draw
            rings = rings.filter(r => (time - r.pawnTime) < RING_LIFETIME);

            // Create a rotating gradient for the "Flowing" color effect
            // We create one gradient for the frame to keep performance high
            // Rotating it over time (time * speed)
            let gradient: CanvasGradient | string = COLOR_STOPS[0].color;
            if (ctx.createConicGradient) {
                const g = ctx.createConicGradient(time * 0.0003, cx, cy);
                COLOR_STOPS.forEach(stop => g.addColorStop(stop.pos, stop.color));
                gradient = g;
            }

            rings.forEach(ring => {
                const age = time - ring.pawnTime;
                const progress = age / RING_LIFETIME; // 0 to 1

                // Expansion: Linear or slight ease-out
                const currentRadius = 80 + progress * (maxRadius - 80);

                // Opacity curve: Smooth fade in/out
                // We keep max opacity handy, but the gradient has its own alpha? 
                // We'll control globalAlpha instead.
                let opacity = 0;
                if (progress < 0.2) opacity = progress / 0.2; // Fast fade in
                else if (progress > 0.8) opacity = 1 - (progress - 0.8) / 0.2; // Fade out
                else opacity = 1;

                // Reduce max opacity slightly to prevent overwhelming brightness with 'screen' blend
                opacity *= 0.7;

                ctx.globalAlpha = opacity;
                ctx.strokeStyle = gradient;

                // Dynamic Line Width
                const lineWidth = (2 + 10 * progress) * 5;
                ctx.lineWidth = lineWidth;

                // Flowing Halo Effect (Shadow)
                // We pulse the blur slightly
                const pulse = Math.sin(time * 0.002) * 10;
                ctx.shadowBlur = 20 + 20 * progress + pulse;
                ctx.shadowColor = COLOR_STOPS[0].color; // Use primary cyan for shadow glow

                // Path Construction
                ctx.beginPath();
                const numSteps = 180; // Optimized resolution
                // Amplitude damping: Large at start, scaling with size, but controlled
                const amplitude = (10 + 20 * progress) * (1 - progress * 0.2);

                for (let i = 0; i <= numSteps; i++) {
                    const angle = (i / numSteps) * Math.PI * 2;

                    // Wave Logic: complex organic wave
                    // Wave 1: Main rotation
                    const w1 = Math.sin(angle * WAVE_COUNT + time * WAVE_SPEED);
                    // Wave 2: Counter-rotation detail
                    const w2 = Math.cos(angle * (WAVE_COUNT * 1.5) - time * (WAVE_SPEED * 1.2));

                    const shapeOffset = (w1 + w2) * amplitude;
                    const r = currentRadius + shapeOffset;

                    const x = cx + Math.cos(angle) * r;
                    const y = cy + Math.sin(angle) * r;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                ctx.closePath();
                ctx.stroke();

                // Optional: Secondary "Flowing" Ring (Fainter, Wider) for extra atmosphere
                // Only draw if performance budget allows (simple check: skip every other frame? No, keep it smooth)
                // We just draw the same path again with different settings if we want a "core" vs "halo" distinction
                // But shadowBlur covers the halo.
            });

            ctx.globalCompositeOperation = 'source-over'; // Reset
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden" aria-hidden="true">
            {/* Ambient Background Base - Deep Dark Blue/Purple Mix */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#110c1d] to-[#0a0a0f] opacity-90" />

            {/* Center Glow Spot */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
                style={{
                    width: '50vmax',
                    height: '50vmax',
                    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.05) 40%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
            />

            {/* Canvas Layer */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ filter: 'blur(0.5px)' }} // Slight soften
            />
        </div>
    );
};

export default AuraBackground;

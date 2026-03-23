import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * TopLoader — YouTube/Vercel-style slim progress bar that runs at the
 * top of the viewport whenever the route changes.
 *
 * Phases:
 *  1. Route change detected → bar jumps to ~30% instantly
 *  2. Slow trickle to ~85% over 400ms (feels like real work is happening)
 *  3. Route fully rendered → snap to 100%, then fade out
 */
export default function TopLoader() {
  const location = useLocation();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  // Store ALL intermediate timer IDs in an array so every one gets cleared.
  const timersRef = useRef([]);
  const completeRef = useRef(null);

  const clear = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    clearTimeout(completeRef.current);
  };

  const start = () => {
    clear();
    setVisible(true);
    setWidth(0);

    // Tiny delay so the 0→30 transition is visible
    requestAnimationFrame(() => {
      setWidth(30); // jump: route change felt immediately

      // Slow trickle toward 85% — push each ID so all can be cancelled.
      timersRef.current.push(setTimeout(() => setWidth(55), 120));
      timersRef.current.push(setTimeout(() => setWidth(72), 280));
      timersRef.current.push(setTimeout(() => setWidth(85), 450));
    });
  };

  const finish = () => {
    clear();
    setWidth(100);
    // Wait for width transition, then fade the bar out
    completeRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 450);
  };

  // Trigger START on every route change
  useEffect(() => {
    start();
    // After a short delay assume the page has "loaded"
    // (lazy chunks typically resolve in < 300 ms on localhost)
    const done = setTimeout(finish, 350);
    return () => { clear(); clearTimeout(done); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!visible && width === 0) return null;

  return (
    <>
      {/* Main bar */}
      <div
        className="top-loader"
        style={{
          width: `${width}%`,
          opacity: visible ? 1 : 0,
        }}
      />
      {/* Glowing leading dot */}
      <div
        className="top-loader-dot"
        style={{
          left: `${width}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </>
  );
}

/**
 * useCardTilt Hook
 *
 * Adds a 3D tilt effect to card elements based on mouse position.
 * When you hover over a card, it tilts toward the cursor - kind of
 * like holding a real card and angling it in the light.
 *
 * How it works:
 * - Tracks the mouse position relative to the card center
 * - Maps that position to rotateX and rotateY values
 * - On mouse leave, smoothly transitions back to flat
 *
 * Usage:
 *   const tiltHandlers = useCardTilt();
 *   <div className="card-tilt" {...tiltHandlers}>...</div>
 *
 * I found that 15deg max rotation feels natural without being too extreme.
 * The cubic-bezier transition gives it a nice springy feel on mouse leave.
 */

import { useCallback } from 'react';

// Max tilt angle in degrees - too high looks weird, too low is barely noticeable
const MAX_TILT = 15;

function useCardTilt() {
  // Calculate tilt based on where the mouse is relative to the card center
  const handleMouseMove = useCallback((e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();

    // Get mouse position as a value from -1 to 1 (center = 0)
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Map to rotation angles
    // rotateY: positive = tilt right, so mouse on right side = positive
    // rotateX: negative = tilt forward/down, so mouse on bottom = positive rotateX
    const rotateY = (x - 0.5) * 2 * MAX_TILT;
    const rotateX = (0.5 - y) * 2 * MAX_TILT;

    // Apply the transform - keep the lift and scale from the CSS hover,
    // but add the rotation on top
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.02)`;
  }, []);

  // Reset tilt when mouse leaves - CSS transition handles the smooth return
  const handleMouseLeave = useCallback((e) => {
    const card = e.currentTarget;
    card.style.transform = '';
  }, []);

  return {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };
}

export default useCardTilt;

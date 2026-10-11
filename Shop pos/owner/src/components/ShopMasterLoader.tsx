import React, { useEffect, useState, useRef } from 'react';
import { ShopMasterLogo } from './ShopMasterLogo';

export interface ShopMasterLoaderProps {
  /**
   * External loading state (e.g. from PosContext fetchAllData)
   */
  isLoading?: boolean;
  /**
   * Callback fired when the exit transition finishes
   */
  onComplete?: () => void;
  /**
   * Minimum time to allow the reveal sequence to complete (default: 1600ms)
   */
  minDuration?: number;
}

/**
 * Premium ShopMaster Progressive Reveal Loading Animation
 *
 * Sequence:
 * 1. Two horizontal speed lines reveal one by one
 * 2. Main blue shopping-cart faceted shape reveals from left to right
 * 3. Circular blue element reveals last
 * 4. Briefly holds the fully assembled logo, then transitions smoothly
 */
export const ShopMasterLoader: React.FC<ShopMasterLoaderProps> = ({
  isLoading = true,
  onComplete,
  minDuration = 1600,
}) => {
  const [animationFinished, setAnimationFinished] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const completionCalledRef = useRef(false);

  useEffect(() => {
    // Respect user's reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setAnimationFinished(true);
      return;
    }

    const timer = setTimeout(() => {
      setAnimationFinished(true);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration]);

  // When animation has completed and background loading is done, transition smoothly
  useEffect(() => {
    if (animationFinished && !isLoading && !isExiting && !isRemoved) {
      setIsExiting(true);

      const exitTimer = setTimeout(() => {
        setIsRemoved(true);
        if (!completionCalledRef.current) {
          completionCalledRef.current = true;
          onComplete?.();
        }
      }, 400); // 400ms smooth fade-out

      return () => clearTimeout(exitTimer);
    }
  }, [animationFinished, isLoading, isExiting, isRemoved, onComplete]);

  if (isRemoved) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-100 bg-white flex items-center justify-center select-none transition-opacity duration-400 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading ShopMaster"
    >
      <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 flex items-center justify-center p-2">
        <ShopMasterLogo
          size="100%"
          className="w-full h-full drop-shadow-xs"
          animated={!animationFinished}
        />
      </div>
    </div>
  );
};

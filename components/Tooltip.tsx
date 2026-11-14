'use client';

import React, { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipAlign = 'start' | 'center' | 'end';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  align?: TooltipAlign;
  delay?: number;
  className?: string;
  bubbleClassName?: string;
  disabled?: boolean;
}

const emptySubscribe = () => () => {};

export function Tooltip({
  content,
  children,
  position = 'top',
  align = 'center',
  delay = 100,
  className = '',
  bubbleClassName = '',
  disabled = false
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    arrowOffset?: number;
    actualPosition: TooltipPosition;
  }>({
    top: 0,
    left: 0,
    actualPosition: position
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    const tooltipEl = tooltipRef.current;
    if (!triggerEl || !tooltipEl) return;

    const triggerRect = triggerEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    const gap = 8;
    const padding = 10;
    let actualPos = position;
    let top = 0;
    let left = 0;

    // Check viewport edges and flip if necessary
    if (position === 'top' && triggerRect.top - tooltipRect.height - gap < padding) {
      actualPos = 'bottom';
    } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height + gap > window.innerHeight - padding) {
      actualPos = 'top';
    } else if (position === 'left' && triggerRect.left - tooltipRect.width - gap < padding) {
      actualPos = 'right';
    } else if (position === 'right' && triggerRect.right + tooltipRect.width + gap > window.innerWidth - padding) {
      actualPos = 'left';
    }

    if (actualPos === 'top') {
      top = triggerRect.top - tooltipRect.height - gap;
      if (align === 'start') left = triggerRect.left;
      else if (align === 'end') left = triggerRect.right - tooltipRect.width;
      else left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
    } else if (actualPos === 'bottom') {
      top = triggerRect.bottom + gap;
      if (align === 'start') left = triggerRect.left;
      else if (align === 'end') left = triggerRect.right - tooltipRect.width;
      else left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
    } else if (actualPos === 'left') {
      left = triggerRect.left - tooltipRect.width - gap;
      if (align === 'start') top = triggerRect.top;
      else if (align === 'end') top = triggerRect.bottom - tooltipRect.height;
      else top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
    } else { // right
      left = triggerRect.right + gap;
      if (align === 'start') top = triggerRect.top;
      else if (align === 'end') top = triggerRect.bottom - tooltipRect.height;
      else top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
    }

    // Clamp inside viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    // Calculate arrow offset relative to the tooltip bubble
    let arrowOffset: number | undefined;
    if (actualPos === 'top' || actualPos === 'bottom') {
      const triggerCenter = triggerRect.left + triggerRect.width / 2;
      arrowOffset = triggerCenter - left;
      arrowOffset = Math.max(14, Math.min(arrowOffset, tooltipRect.width - 14));
    } else {
      const triggerCenter = triggerRect.top + triggerRect.height / 2;
      arrowOffset = triggerCenter - top;
      arrowOffset = Math.max(10, Math.min(arrowOffset, tooltipRect.height - 10));
    }

    setCoords({ top, left, arrowOffset, actualPosition: actualPos });
  }, [position, align]);

  useEffect(() => {
    if (!isVisible) return;

    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isVisible, updatePosition]);

  const showTooltip = () => {
    if (disabled || !content) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const initialTop = position === 'top' ? rect.top - 36 : (position === 'bottom' ? rect.bottom + 8 : rect.top);
        const initialLeft = position === 'left' ? rect.left - 120 : (position === 'right' ? rect.right + 8 : rect.left);
        setCoords({ top: initialTop, left: initialLeft, actualPosition: position });
      }
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && isClient && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 999999
          }}
          className="pointer-events-none transition-opacity duration-150 ease-out animate-in fade-in-0 zoom-in-95"
        >
          <div className="relative inline-flex items-center">
            {/* The Speech Bubble Body */}
            <div 
              className={`px-3.5 py-1.5 text-xs font-medium whitespace-nowrap rounded-full border select-none 
                bg-[#E4E6EB] text-zinc-900 border-[#CBD0D8] 
                dark:bg-[#262626] dark:text-zinc-100 dark:border-zinc-700
                ${bubbleClassName}`}
            >
              {content}
            </div>

            {/* Seamless Speech Bubble Arrow / Tail according to orientation */}
            {coords.actualPosition === 'right' && (
              <svg 
                width="6" 
                height="12" 
                viewBox="0 0 6 12" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ top: coords.arrowOffset !== undefined ? `${coords.arrowOffset}px` : '50%' }}
                className="absolute right-full -translate-y-1/2 translate-x-[1px]"
              >
                <path d="M6 1L1 6L6 11V1Z" className="fill-[#E4E6EB] dark:fill-[#262626]" />
                <path d="M6 1L1 6L6 11" className="stroke-[#CBD0D8] dark:stroke-zinc-700" strokeWidth="1" strokeLinecap="round" />
              </svg>
            )}

            {coords.actualPosition === 'left' && (
              <svg 
                width="6" 
                height="12" 
                viewBox="0 0 6 12" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ top: coords.arrowOffset !== undefined ? `${coords.arrowOffset}px` : '50%' }}
                className="absolute left-full -translate-y-1/2 -translate-x-[1px]"
              >
                <path d="M0 1L5 6L0 11V1Z" className="fill-[#E4E6EB] dark:fill-[#262626]" />
                <path d="M0 1L5 6L0 11" className="stroke-[#CBD0D8] dark:stroke-zinc-700" strokeWidth="1" strokeLinecap="round" />
              </svg>
            )}

            {coords.actualPosition === 'top' && (
              <svg 
                width="12" 
                height="6" 
                viewBox="0 0 12 6" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ left: coords.arrowOffset !== undefined ? `${coords.arrowOffset}px` : '50%' }}
                className="absolute top-full -translate-x-1/2 -translate-y-[1px]"
              >
                <path d="M1 0L6 5L11 0H1Z" className="fill-[#E4E6EB] dark:fill-[#262626]" />
                <path d="M1 0L6 5L11 0" className="stroke-[#CBD0D8] dark:stroke-zinc-700" strokeWidth="1" strokeLinecap="round" />
              </svg>
            )}

            {coords.actualPosition === 'bottom' && (
              <svg 
                width="12" 
                height="6" 
                viewBox="0 0 12 6" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ left: coords.arrowOffset !== undefined ? `${coords.arrowOffset}px` : '50%' }}
                className="absolute bottom-full -translate-x-1/2 translate-y-[1px]"
              >
                <path d="M1 6L6 1L11 6H1Z" className="fill-[#E4E6EB] dark:fill-[#262626]" />
                <path d="M1 6L6 1L11 6" className="stroke-[#CBD0D8] dark:stroke-zinc-700" strokeWidth="1" strokeLinecap="round" />
              </svg>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
export default Tooltip;

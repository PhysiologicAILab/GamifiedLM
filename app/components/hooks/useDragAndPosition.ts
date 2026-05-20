import { useState, useEffect, useRef } from 'react';

export function useDragAndPosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [savedPosition, setSavedPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Calculate center position when component mounts or window resizes
  const getCenterPosition = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const chatWidth = 480;
    const chatHeight = 600;
    
    return {
      x: Math.max(0, (windowWidth - chatWidth) / 2),
      y: Math.max(0, (windowHeight - chatHeight) / 2)
    };
  };

  // Initialize position on mount
  useEffect(() => {
    if (savedPosition === null) {
      const centerPos = getCenterPosition();
      setPosition(centerPos);
      setSavedPosition(centerPos);
    }
  }, [savedPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection and default behaviors
    const rect = chatWindowRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    // Prevent text selection on the entire page during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    document.body.style.pointerEvents = 'none';
    document.body.style.cursor = 'grabbing';
    
    // Re-enable pointer events on the chat window
    if (chatWindowRef.current) {
      chatWindowRef.current.style.pointerEvents = 'auto';
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    e.preventDefault(); // Prevent default behaviors during drag

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Keep window within viewport bounds
    const maxX = window.innerWidth - 480; // Chat window width
    const maxY = window.innerHeight - 600; // Chat window height

    const newPosition = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    };

    setPosition(newPosition);
    setSavedPosition(newPosition); // Save position as user drags
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Restore normal page interaction
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.msUserSelect = '';
    document.body.style.pointerEvents = '';
    document.body.style.cursor = '';
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Cleanup styles on unmount
  useEffect(() => {
    return () => {
      // Reset body styles if component unmounts while dragging
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.msUserSelect = '';
      document.body.style.pointerEvents = '';
      document.body.style.cursor = '';
    };
  }, []);

  const restorePosition = () => {
    if (savedPosition) {
      setPosition(savedPosition);
    }
  };

  return {
    position,
    isDragging,
    chatWindowRef,
    handleMouseDown,
    restorePosition,
  };
}


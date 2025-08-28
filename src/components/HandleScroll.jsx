import React, { useRef, useCallback, useState } from 'react';

const useScrollHandler = () => {
  const scrollTimeout = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const handleScroll = useCallback((event) => {
    setIsScrolling(true);

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  const cleanup = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
  }, []);

  return { handleScroll, isScrolling, cleanup };
};

export default useScrollHandler;

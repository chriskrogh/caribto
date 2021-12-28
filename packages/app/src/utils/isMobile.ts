import { useEffect, useState } from 'react';

const THRESHOLD = 840;

export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        if (isMobile && window.innerWidth > THRESHOLD) {
          setIsMobile(false);
        } else if (!isMobile && window.innerWidth <= THRESHOLD) {
          setIsMobile(true);
        }
      };
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isMobile]);

  return isMobile;
};

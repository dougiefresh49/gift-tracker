'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { ImageToggleButton } from '~/components/image-toggle-button';

interface ImageToggleContextType {
  hideImages: boolean;
  toggleImages: () => void;
}

const ImageToggleContext = createContext<ImageToggleContextType | undefined>(
  undefined
);

const STORAGE_KEY = 'gift-tracker-hide-images';

export function ImageToggleProvider({ children }: { children: ReactNode }) {
  const [hideImages, setHideImages] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setHideImages(saved === 'true');
    }
  }, []);

  const toggleImages = () => {
    setHideImages((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  };

  return (
    <ImageToggleContext.Provider value={{ hideImages, toggleImages }}>
      {children}
      <div className="fixed bottom-24 right-4 z-50">
        <ImageToggleButton />
      </div>
    </ImageToggleContext.Provider>
  );
}

export function useImageToggle() {
  const context = useContext(ImageToggleContext);
  if (context === undefined) {
    throw new Error('useImageToggle must be used within ImageToggleProvider');
  }
  return context;
}

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ImageToggleContextType {
  hideImages: boolean;
  toggleImages: () => void;
  isDevMode: boolean;
}

const ImageToggleContext = createContext<ImageToggleContextType | undefined>(
  undefined
);

export function ImageToggleProvider({ children }: { children: ReactNode }) {
  const [hideImages, setHideImages] = useState(true);
  const isDevMode = process.env.NODE_ENV === 'development';

  const toggleImages = () => {
    setHideImages((prev) => !prev);
  };

  return (
    <ImageToggleContext.Provider
      value={{ hideImages, toggleImages, isDevMode }}
    >
      {children}
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

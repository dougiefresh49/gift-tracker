'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ImageToggleButton } from '~/components/image-toggle-button';

interface ImageToggleContextType {
  hideImages: boolean;
  toggleImages: () => void;
}

const ImageToggleContext = createContext<ImageToggleContextType | undefined>(
  undefined
);

export function ImageToggleProvider({ children }: { children: ReactNode }) {
  const [hideImages, setHideImages] = useState(false);

  const toggleImages = () => {
    setHideImages((prev) => !prev);
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

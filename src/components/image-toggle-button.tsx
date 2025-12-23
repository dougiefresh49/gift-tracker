'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useImageToggle } from '~/contexts/image-toggle-context';

export function ImageToggleButton() {
  const { hideImages, toggleImages, isDevMode } = useImageToggle();

  if (!isDevMode) return null;

  return (
    <button
      onClick={toggleImages}
      className="fixed bottom-24 right-4 z-50 bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
      title={hideImages ? 'Show images' : 'Hide images'}
    >
      {hideImages ? (
        <>
          <EyeOff size={20} />
          <span className="text-sm font-bold">Show</span>
        </>
      ) : (
        <>
          <Eye size={20} />
          <span className="text-sm font-bold">Hide</span>
        </>
      )}
    </button>
  );
}


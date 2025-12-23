'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useImageToggle } from '~/contexts/image-toggle-context';

export function ImageToggleButton() {
  const { hideImages, toggleImages } = useImageToggle();

  return (
    <button
      onClick={toggleImages}
      className="bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-slate-700 transition-colors text-sm flex items-center gap-2"
    >
      {hideImages ? <EyeOff size={16} /> : <Eye size={16} />}
      {hideImages ? 'Show Images' : 'Hide Images'}
    </button>
  );
}


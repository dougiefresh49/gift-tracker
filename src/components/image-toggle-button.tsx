'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useImageToggle } from '~/contexts/image-toggle-context';
import { Button } from '~/components/ui/button';

export function ImageToggleButton() {
  const { hideImages, toggleImages } = useImageToggle();

  return (
    <Button
      onClick={toggleImages}
      variant="secondary"
      size="icon"
      className="h-10 w-10 rounded-full shadow-lg"
      title={hideImages ? 'Show Images' : 'Hide Images'}
    >
      {hideImages ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </Button>
  );
}

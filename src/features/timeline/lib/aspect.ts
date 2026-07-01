import type { AspectRatio } from '@/core/types';

export function aspectRatioToValue(ratio: AspectRatio): number {
  switch (ratio) {
    case '9:16': return 9 / 16;
    case '1:1': return 1;
    case '16:9': return 16 / 9;
    case '4:5': return 4 / 5;
    case 'custom': return 9 / 16;
  }
}

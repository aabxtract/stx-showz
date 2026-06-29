/* eslint-disable @typescript-eslint/no-explicit-any */

declare class BarcodeDetector {
  constructor(options?: { formats?: string[] });
  detect(source: CanvasImageSource | HTMLVideoElement): Promise<BarcodeDetectorResult[]>;
}

interface BarcodeDetectorResult {
  rawValue: string;
  format: string;
  bbox?: DOMRectReadOnly;
  cornerPoints?: { x: number; y: number }[];
}

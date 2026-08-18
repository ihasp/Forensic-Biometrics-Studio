import { ImageFFT } from "./fftProcessor";

export type FftWorkerRequest =
    | {
          id: number;
          type: "FORWARD";
          pixels: Uint8ClampedArray;
          width: number;
          height: number;
          fftW: number;
          fftH: number;
      }
    | {
          id: number;
          type: "INVERSE";
          complexData: Float32Array;
          maskData: Uint8ClampedArray;
          maskWidth: number;
          maskHeight: number;
          fftW: number;
          fftH: number;
          outputW: number;
          outputH: number;
      };

export type FftWorkerResponse =
    | {
          id: number;
          type: "FORWARD_SUCCESS";
          complexData: Float32Array;
          width: number;
          height: number;
          spectrum: Uint8Array;
      }
    | {
          id: number;
          type: "INVERSE_SUCCESS";
          pixelData: Uint8ClampedArray;
          outputW: number;
          outputH: number;
      }
    | {
          id: number;
          type: "ERROR";
          error: string;
      };

/* eslint-disable no-restricted-globals, @typescript-eslint/no-explicit-any */
(self as any).onmessage = (e: MessageEvent<FftWorkerRequest>) => {
    const msg = e.data;
    try {
        if (msg.type === "FORWARD") {
            const processor = new ImageFFT(msg.fftW, msg.fftH);
            const result = processor.forward({
                data: msg.pixels,
                width: msg.width,
                height: msg.height,
            });

            const { complexData, spectrum, width, height } = result;

            (self as any).postMessage(
                {
                    id: msg.id,
                    type: "FORWARD_SUCCESS",
                    complexData,
                    width,
                    height,
                    spectrum,
                } satisfies FftWorkerResponse,
                [complexData.buffer, spectrum.buffer]
            );
        } else if (msg.type === "INVERSE") {
            const processor = new ImageFFT(msg.fftW, msg.fftH);
            const filteredData = processor.applyMask(
                msg.complexData,
                msg.maskData,
                msg.maskWidth,
                msg.maskHeight
            );
            const resultImage = processor.inverse(
                filteredData,
                msg.outputW,
                msg.outputH
            );

            const pixelData = resultImage.data;
            (self as any).postMessage(
                {
                    id: msg.id,
                    type: "INVERSE_SUCCESS",
                    pixelData,
                    outputW: msg.outputW,
                    outputH: msg.outputH,
                } satisfies FftWorkerResponse,
                [pixelData.buffer]
            );
        }
    } catch (err) {
        (self as any).postMessage({
            id: msg.id,
            type: "ERROR",
            error: err instanceof Error ? err.message : String(err),
        } satisfies FftWorkerResponse);
    }
};

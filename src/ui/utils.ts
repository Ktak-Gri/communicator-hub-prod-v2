// apps/hub/src/ui/utils.ts

export function encode(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

export function decode(arrayBuffer: ArrayBuffer): Float32Array {
  const view = new DataView(arrayBuffer);
  const length = view.byteLength / 2;
  const result = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    result[i] = view.getInt16(i * 2, true) / 0x8000;
  }

  return result;
}

export async function decodeAudioData(
  audioContext: AudioContext,
  arrayBuffer: ArrayBuffer
): Promise<AudioBuffer> {
  return await audioContext.decodeAudioData(arrayBuffer.slice(0));
}
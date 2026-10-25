/**
 * Universal Native 16kHz PCM WAV Audio Recorder
 * Records uncompressed WAV directly in the browser so that Python backends
 * (and serverless functions like Vercel) can decode audio natively without requiring external ffmpeg.
 */

export interface WavRecorderInstance {
  stop: () => Promise<Blob>;
  cancel: () => void;
}

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const channelData = buffer.getChannelData(0);
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = channelData.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt Sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data Sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < channelData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

export async function startWavRecording(stream: MediaStream): Promise<WavRecorderInstance> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass({ sampleRate: 16000 });
  const source = audioContext.createMediaStreamSource(stream);

  // Buffer size 4096 gives smooth 16kHz audio capture
  const bufferSize = 4096;
  const scriptNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
  const recordedSamples: Float32Array[] = [];
  let totalLength = 0;

  scriptNode.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    const copy = new Float32Array(input.length);
    copy.set(input);
    recordedSamples.push(copy);
    totalLength += input.length;
  };

  source.connect(scriptNode);
  scriptNode.connect(audioContext.destination);

  return {
    stop: async (): Promise<Blob> => {
      // Disconnect audio nodes
      scriptNode.disconnect();
      source.disconnect();

      // Combine samples into one AudioBuffer
      const audioBuffer = audioContext.createBuffer(1, totalLength, audioContext.sampleRate);
      const combined = audioBuffer.getChannelData(0);
      let offset = 0;
      for (const chunk of recordedSamples) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      await audioContext.close();
      return audioBufferToWav(audioBuffer);
    },
    cancel: () => {
      try {
        scriptNode.disconnect();
        source.disconnect();
        audioContext.close();
      } catch (e) {
        // Ignore close error on cancel
      }
    }
  };
}

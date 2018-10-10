import { hadrEmmisiveWorker } from '../workers/hdrEmissive.worker'
export const hdrConverterEmmisive = (
  width,
  height,
  rgbeBuffer = new Uint8Array(),
) => {
  return new Promise((resolve, reject) => {
    var blobURL = URL.createObjectURL(new Blob(['(', hadrEmmisiveWorker.toString(), ')()'], { type: 'application/javascript' }));
    const worker = new Worker(blobURL);
    worker.postMessage({ rgbeBuffer, width, height });

    worker.addEventListener('message', event => {
      if (event.data.progress) {
        console.log('dataProgress=', event.data.progress);
      } else {
        console.log('dataBack', event.data);
        URL.revokeObjectURL(blobURL);
        const header = 'FORMAT=32-bit_rle_rgbe\n';
        const blankSpace = '\n';
        const Resolution = `-Y ${height} +X ${width}\n`;
        const text = header + blankSpace + Resolution;
        const blob = new Blob([text, event.data.binary], { type: "octet/stream" });
        resolve(blob)
      }
    })
  })
}
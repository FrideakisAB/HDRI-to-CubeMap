import { Vector3 as V3 } from 'three'
import { hdrProcRenderer, hdrRenderTarget, procCamera, hdrScene } from '../components/process'
import { mainCamera } from '../components/base';
import { updateMaterial } from '../materials/sphereMat';
import { hdrConverterEmmisive } from '../../converters/hdrConverterEmissive';
const renderCatch = {
  blobs: [],
  names: [],
  zipping: false,
  progNow: 0,
  progTotal: 0,
  progMax: 0,
  canvas: document.createElement('canvas'),
}


const calcAngle = () => {
  const direction = new V3
  mainCamera.getWorldDirection(direction);
  const angle = direction.multiply(new V3(1, 0, 1)).angleTo(new V3(0, 0, -1));
  if (direction.x < 0) {
    return angle;
  } else {
    return -angle;
  }
}
const packBlobsSep = (writer, callback = href => { }, progress = prog => { }) => {
  const { names, blobs, } = renderCatch;

  const nester = (startIndex = 0, endIndex = 5, callback = () => { }) => {
    writer.file(names[startIndex], blobs[startIndex], {base64: true});
    progress(1);
    callback(writer);

    if (startIndex >= endIndex) {
      callback();
    } else {
      nester(startIndex + 1, endIndex, callback);
    }
  }
  nester(0, renderCatch.blobs.length - 1, () => {
  });
  renderCatch.blobs = [];
  renderCatch.names = [];
}



const storeBlobsSep = (name1, writer, name, callback = href => { }, progress = prog => { }) => {
  const width = hdrRenderTarget.width;
  const height = hdrRenderTarget.height;
  const rgbeBuffer = new Uint8Array(width * height * 4);
  hdrProcRenderer.readRenderTargetPixels(hdrRenderTarget, 0, 0, width, height, rgbeBuffer);
  hdrConverterEmmisive(width, height, rgbeBuffer).then(blob => {
    renderCatch.blobs.push(blob);
    renderCatch.names.push(`${name1 + name}.hdr`)
    renderCatch.progNow++;
    if (renderCatch.blobs.length === renderCatch.progMax) {
      packBlobsSep(writer, callback, progress);
    }
  })
}
const hdrProcRenderSep = (maxProgress, name, writer, size = 64, callback = (href) => { }, progress = prog => { }) => {
  renderCatch.progMax = maxProgress;
  renderCatch.blobs = [];
  renderCatch.names = [];
  renderCatch.progNow = 0;
  renderCatch.progTotal = 12;
  hdrProcRenderer.setSize(size, size);
  hdrRenderTarget.setSize(size, size);
  procCamera.rotation.set(0, 0, 0);

  const angle = calcAngle();
  procCamera.rotateY(angle);

  //+x
  updateMaterial();
  procCamera.rotateY(-Math.PI / 2);
  hdrProcRenderer.render(hdrScene, procCamera);
  hdrProcRenderer.render(hdrScene, procCamera, hdrRenderTarget);
  storeBlobsSep(name, writer, 'px', callback, progress);
  //-x
  updateMaterial();
  procCamera.rotateY(Math.PI);
  hdrProcRenderer.render(hdrScene, procCamera);
  hdrProcRenderer.render(hdrScene, procCamera, hdrRenderTarget);
  storeBlobsSep(name, writer, 'nx', callback, progress);
  //+y
  updateMaterial();
  procCamera.rotateY(-Math.PI / 2);
  procCamera.rotateX(Math.PI / 2);
  hdrProcRenderer.render(hdrScene, procCamera);
  hdrProcRenderer.render(hdrScene, procCamera, hdrRenderTarget);
  storeBlobsSep(name, writer, 'py', callback, progress);
  //-y
  updateMaterial();
  procCamera.rotateX(-Math.PI);
  hdrProcRenderer.render(hdrScene, procCamera);
  hdrProcRenderer.render(hdrScene, procCamera, hdrRenderTarget);
  storeBlobsSep(name, writer, 'ny', callback, progress);
  //+z
  updateMaterial();
  procCamera.rotateX(Math.PI / 2);
  hdrProcRenderer.render(hdrScene, procCamera);
  hdrProcRenderer.render(hdrScene, procCamera, hdrRenderTarget);
  storeBlobsSep(name, writer, 'pz', callback, progress);
  //-z
  updateMaterial();
  procCamera.rotateY(Math.PI);
  hdrProcRenderer.render(hdrScene, procCamera);
  hdrProcRenderer.render(hdrScene, procCamera, hdrRenderTarget);
  storeBlobsSep(name, writer, 'nz', callback, progress);

  // packBlobs(callback);
}
const hdrProcRenderUnity = (maxProgress, name, writer, size = 64, callback = href => { }, progress = prog => { }) => {
  renderCatch.progMax = maxProgress;
  renderCatch.progNow = 0;
  renderCatch.progTotal = 4;
  const { canvas } = renderCatch;
  canvas.width = size * 4;
  canvas.height = size * 3;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  hdrProcRenderer.setSize(size, size);
  procCamera.rotation.set(0, 0, 0);

  const angle = calcAngle();
  procCamera.rotateY(angle);

  updateMaterial();
  hdrProcRenderer.render(hdrScene, procCamera);
  ctx.drawImage(hdrProcRenderer.domElement, size, size);

  updateMaterial();
  procCamera.rotateY(-Math.PI / 2);
  hdrProcRenderer.render(hdrScene, procCamera);
  ctx.drawImage(hdrProcRenderer.domElement, size * 2, size);

  updateMaterial();
  procCamera.rotateY(-Math.PI / 2);
  hdrProcRenderer.render(hdrScene, procCamera);
  ctx.drawImage(hdrProcRenderer.domElement, size * 3, size);

  updateMaterial();
  procCamera.rotateY(-Math.PI / 2);
  hdrProcRenderer.render(hdrScene, procCamera);
  ctx.drawImage(hdrProcRenderer.domElement, 0, size);

  updateMaterial();
  procCamera.rotateY(-Math.PI / 2);
  procCamera.rotateX(Math.PI / 2);
  hdrProcRenderer.render(hdrScene, procCamera);
  ctx.drawImage(hdrProcRenderer.domElement, size, 0);

  updateMaterial();
  procCamera.rotateX(-Math.PI);
  hdrProcRenderer.render(hdrScene, procCamera);
  ctx.drawImage(hdrProcRenderer.domElement, size, size * 2);

  renderCatch.progNow++

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  hdrConverterEmmisive(canvas.width, canvas.height, imageData.data, false).then(blob => {
    renderCatch.blobs.push(blob);
    renderCatch.names.push(`${name}.hdr`)
    renderCatch.progNow++;
    if (renderCatch.blobs.length === renderCatch.progMax) {
      packBlobsSep(writer, callback, progress);
    }
  })
}
const hdrProcRenderUE4 = (maxProgress, name, writer, size = 64, callback = href => { }, progress = prog => { }) => {
  renderCatch.progMax = maxProgress;
  renderCatch.progNow = 0;
  renderCatch.progTotal = 4;
  const { canvas } = renderCatch;
  canvas.width = size * 6;
  canvas.height = size * 1;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  hdrProcRenderer.setSize(size, size);
  procCamera.rotation.set(0, 0, 0);

  const angle = calcAngle();
  procCamera.rotateY(angle);
  //+z
  updateMaterial();
  hdrProcRenderer.render(hdrScene, procCamera);
  ctx.drawImage(hdrProcRenderer.domElement, 3 * size, 0);
  //+x
  procCamera.rotateY(-Math.PI / 2);
  procCamera.rotateZ(-Math.PI / 2);
  updateMaterial();
  hdrProcRenderer.render(hdrScene, procCamera);
  ctx.drawImage(hdrProcRenderer.domElement, 0, 0);
  //-z
  procCamera.rotateZ(Math.PI / 2);
  procCamera.rotateY(-Math.PI / 2);
  procCamera.rotateZ(Math.PI);
  updateMaterial();
  hdrProcRenderer.render(hdrScene, procCamera);
  ctx.drawImage(hdrProcRenderer.domElement, 2 * size, 0);
  //-x
  procCamera.rotateZ(-Math.PI);
  procCamera.rotateY(-Math.PI / 2);
  procCamera.rotateZ(Math.PI / 2);
  updateMaterial();
  hdrProcRenderer.render(hdrScene, procCamera);
  ctx.drawImage(hdrProcRenderer.domElement, 1 * size, 0);
  //+y
  procCamera.rotateZ(-Math.PI / 2);
  procCamera.rotateY(-Math.PI / 2);
  procCamera.rotateX(Math.PI / 2);
  updateMaterial();
  hdrProcRenderer.render(hdrScene, procCamera);
  ctx.drawImage(hdrProcRenderer.domElement, 4 * size, 0);
  //-y
  procCamera.rotateX(-Math.PI);
  procCamera.rotateZ(Math.PI);
  updateMaterial();
  hdrProcRenderer.render(hdrScene, procCamera);
  ctx.drawImage(hdrProcRenderer.domElement, 5 * size, 0);

  renderCatch.progNow++
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  hdrConverterEmmisive(canvas.width, canvas.height, imageData.data, false).then(blob => {
    renderCatch.blobs.push(blob);
    renderCatch.names.push(`${name}.hdr`)
    renderCatch.progNow++;
    if (renderCatch.blobs.length === renderCatch.progMax) {
      packBlobsSep(writer, callback, progress);
    }
  })
}


export { hdrProcRenderSep, hdrProcRenderUnity, hdrProcRenderUE4 }


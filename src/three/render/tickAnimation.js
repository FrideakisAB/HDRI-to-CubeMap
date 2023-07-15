import cameraControl from '../controls/cameraControl';
import {renderProps}from '../components/props';
export default () => {
  if (renderProps.isResetCamera) {
    renderProps.isResetCamera = false;
    cameraControl.resetTarget();
  }
  cameraControl.update();
}
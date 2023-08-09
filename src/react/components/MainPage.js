import React from 'react';
import { Paper, Button, Tabs, Tab, withStyles, Typography } from '@material-ui/core';
import { Slider } from '@material-ui/lab';
import Select from '@material-ui/core/Select';
import SwipeableViews from 'react-swipeable-views';
import { imageProps, renderProps } from '../../three/components/props';
import { updateImage } from '../../three/textures/userTexture'
import { setExposure, hdrToneMapping } from '../../three/components/base'
import { updateConv, hdrToneMappingConv, setExposureConv } from '../../three/components/convert';
import {hdrToneMappingProc} from '../../three/components/process'
import GridRenders from './GridRender';
import SaveDialog from './SaveDialog';

function TabContainer(props) {
  const { children, dir } = props;

  return (
    <Typography component="div" dir={dir} style={{ padding: 0 }}>
      {children}
    </Typography>
  );
}

function checkFileSupport(file) {
  const format = file.name.split('.').slice(-1)[0]
  const formats = ['png', 'jpg', 'hdr']
  return formats.includes(format)
}

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    width: 500,
    position: 'relative',
    minHeight: 200,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.unit * 2,
    right: theme.spacing.unit * 2,
  },
  fabGreen: {

  },
});

let names = [];

class MainPage extends React.Component {

  state = {
    showCanvas: true,
    openSaveDialog: false,
    tabVal: 0,
    cubeUpdated: false,
    exposure: renderProps.exposure / renderProps.maxExposure * 100,
    selectedIndex: 0,
    fileCurrentName: []
  }

  onNext = () => {
    const index = (this.state.selectedIndex + 1) % names.length;
    const name = names[index];
    this.setState(() => ({ fileCurrentName: name, selectedIndex: index }));
    this.changeEditedImage(index);
  }
  onPrev = () => {
    const index = (names.length + this.state.selectedIndex - 1) % names.length;
    const name = names[index];
    this.setState(() => ({ fileCurrentName: name, selectedIndex: index }));
    this.changeEditedImage(index);
  }

  onSaveOpen = () => {
    this.setState(() => ({ openSaveDialog: true }))
  }
  onReset = () => {
    renderProps.isResetCamera = true
  }
  onSaveClose = () => {
    this.setState(() => ({ openSaveDialog: false }))
  }

  changeEditedImage = (fileIndex) => {
    const file = imageProps.files[fileIndex];
    const format = file.name.split('.').slice(-1)[0]
    const exposureVal = imageProps.exposures[fileIndex];
    this.setState(() => ({ showCanvas: true }))
      imageProps.file = file;
      imageProps.loaded = true;
      imageProps.format = format;
      updateImage(() => {
        if (format === 'hdr') {
          hdrToneMapping(true);
          hdrToneMappingConv(true);
          hdrToneMappingProc(true);
        } else {
          hdrToneMapping(false);
          hdrToneMappingConv(false);
          hdrToneMappingProc(false);
        }
        this.setState(() => ({ exposure: exposureVal }));
        renderProps.exposure = (exposureVal * (renderProps.maxExposure / 100)).toFixed(2)
        setExposure();
        setExposureConv();
      });
  }

  onFileUpload = (e) => {
    names = [];

    var files = "";
    imageProps.files = [];
    imageProps.exposures = [];
    for (const file of e.target.files) {
      if (checkFileSupport(file)) {
        imageProps.files.push(file);
        imageProps.exposures.push(4.0 / (renderProps.maxExposure / 100));
        names.push(file.name);
        files += file.name + ";";
      }
    }

    const name = names[0];
    this.setState(() => ({ fileCurrentName: name, selectedIndex: 0 }));
    this.changeEditedImage(0);
  }
  onExposureChange = (e, val) => {
    this.setState(() => ({ exposure: val }));
    renderProps.exposure = (val * (renderProps.maxExposure / 100)).toFixed(2)
    imageProps.exposures[this.state.selectedIndex] = val;
    setExposure();
    setExposureConv();
  }
  onTabChange = (e, tabVal) => {
    this.setState(() => ({ tabVal }), () => {
      if (!this.state.cubeUpdated) {
        updateConv();
        this.setState(() => ({ cubeUpdated: true }))
      }
    });
  }
  handleChangeIndex = index => {
    this.setState(() => ({ tabVal: index }));
  };

  handleChange = (name) => {
    const index = names.indexOf(name);
    this.setState(() => ({ fileCurrentName: name, selectedIndex: index }));
    this.changeEditedImage(index);
  };

  render() {
    return (
      <div>
        <SaveDialog open={this.state.openSaveDialog} onClose={this.onSaveClose} />
        <Paper style={{ paddingTop: 1, marginTop: 20, marginLeft: 'auto', marginRight: 'auto', width: '82vw', height: 'calc(36vw + 120px)', background: '#eee' }}>
          <Paper style={{ width: '82vw', display: "flex"}} elevation={3}>
            <Paper style={{ width: '18vw' }}>
              <Tabs
                value={this.state.tabVal}
                onChange={this.onTabChange}
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab label={"3D view"} />
                <Tab label={"CubeMap view"} />
              </Tabs>
            </Paper>
            <Paper style={{ width: '64vw' }}>
              <div>
                <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 550 }}>
                  Exposure = {(this.state.exposure * (renderProps.maxExposure / 100)).toFixed(2)}
                </div>
                <Slider style={{ width: '63vw'}} value={this.state.exposure} onChange={this.onExposureChange} />
              </div>
            </Paper>
          </Paper>
          <Paper style={{ width: '82vw', height: '36vw', display: "flex"}} elevation={3}>
            <Paper style={{ width: '18vw', height: '36vw'}}
              elevation={3}>
              <p>HDRIs:</p>
              <Select style={{ width: '18vw'}}
                multiple={false}
                native
                name="file-selection-edit"
                id='selected_file'
                value={this.state.fileCurrentName}
                onChange={e => this.handleChange(e.target.value)}
              >
                {names.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
              <Button onClick={this.onPrev} variant="outlined" component="span" color="secondary" style={{ width: '9vw', marginTop: '4px'}}>
                Prev
              </Button>
              <Button onClick={this.onNext} variant="outlined" component="span" color="secondary" style={{ width: '9vw', marginTop: '4px'}}>
                Next
              </Button>
            </Paper>
            <Paper
              id={'canv-container'}
              style={{ width: '64vw', height: '36vw'}}
              // hidden={!this.state.showCanvas}

              elevation={3}
            >
              <SwipeableViews
                axis={'x'}
                index={this.state.tabVal}
                onChangeIndex={this.handleChangeIndex}
              >
                <TabContainer>
                  <canvas
                    id={'MainCanvas'}
                    style={{ width: '64vw', height: '36vw', borderRadius: 4 }}
                  />
                </TabContainer>
                <TabContainer>
                  <GridRenders />
                </TabContainer>
              </SwipeableViews>
            </Paper>
          </Paper>
          <input
            style={{ display: 'none' }}
            id="flat-button-file"
            type="file"
            multiple="multiple"
            onChange={this.onFileUpload}
          />
          <Paper style={{ width: '80vw', marginLeft: 'auto', marginRight: 'auto', marginTop: 15, background: '#ddd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label htmlFor="flat-button-file" style={{ margin: 4 }}>
                <Button variant="contained" component="span" color="primary">
                  Upload HDRI
                </Button>
              </label>
              <Button onClick={this.onReset} variant="contained" component="span" style={{ margin: 4 }} color="primary">
                Reset camera
              </Button>
              <Button onClick={this.onSaveOpen} variant="contained" component="span" disabled={!this.state.showCanvas} style={{ margin: 4 }}>
                Save
              </Button>
            </div>
          </Paper>
        </Paper>

      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(MainPage);
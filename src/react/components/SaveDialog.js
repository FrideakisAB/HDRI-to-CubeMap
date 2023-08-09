import React from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, withStyles, Paper,
  LinearProgress, Select, MenuItem, InputLabel, FormControl
} from '@material-ui/core';
import { saveAs } from 'file-saver';
import ClassNames from 'classnames';
import { setExposure, hdrToneMapping } from '../../three/components/base'
import { updateImage } from '../../three/textures/userTexture'
import { updateConv, hdrToneMappingConv, setExposureConv } from '../../three/components/convert';
import {hdrToneMappingProc, setExposureProc} from '../../three/components/process'
import { procRenderSep, procRenderUnity, procRenderUE4 } from '../../three/render/renderProc';
import { hdrProcRenderSep, hdrProcRenderUnity, hdrProcRenderUE4 } from '../../three/render/hdrRenderProc';
import CrossLayout from './saveDialogComp/CrossLayout';
import LineLayout from './saveDialogComp/LineLayout';
import SeperateLayout from './saveDialogComp/SeperateLayout';
import ResolutionSelect from './saveDialogComp/ResolutionSelect';
import FormatSelect from './saveDialogComp/FormatSelect';
import { imageProps, renderProps } from '../../three/components/props';
const styles = theme => ({
  optionUnity: {
    width: 496,
    height: 224,
    background: '#444',
    '&:hover': {
      background: '#bbb',//'#6666ff'
      cursor: 'pointer'
    },
  },
  option: {
    width: 496,
    height: 96,
    background: '#444',
    '&:hover': {
      background: '#bbb',
      cursor: 'pointer'
    },
  },
  selected: {
    background: '#bbbbff',
    '&:hover': {
      background: '#bbbbff'
    }
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing.unit * 2,
  },
})



class SaveDialog extends React.Component {
  state = {
    selected: 0,
    url: '',
    download: '',
    processed: false,
    processing: true,
    progress: 0,
    maxProgress: 0,
    saveDisable: false,
    resolution: 256,
    format: 'png',
    zip: null,
  }


  proccessFiles = () => event => {
    this.setState(() => ({ saveDisable: true, processing: false, processed: true, progress: 0 }))

    this.state.zip = new JSZip();
    var multiplierCount = (this.state.selected === 3? 6 : 1);
    this.state.maxProgress = imageProps.files.length * multiplierCount;
    console.log("Total files:" + this.state.maxProgress)
      for (const file of imageProps.files) {
        const format = file.name.split('.').slice(-1)[0]
        const exposureVal = imageProps.exposures[imageProps.files.indexOf(file)];
        if (true) {
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
            renderProps.exposure = (exposureVal * (renderProps.maxExposure / 100)).toFixed(2)
            setExposure();
            setExposureConv();
            setExposureProc(renderProps.exposure);

            if (this.state.format == "hdr") {
              this.hdrProccess(file.name.split('.')[0], this.state.zip, href => {});
            } else {
              this.regularProccess(file.name.split('.')[0], this.state.zip, href => {});
            }
          });
        }
        
      }
  }
  hdrProccess = (name, writer, callback) => {
    if (this.state.selected === 1) {
      hdrProcRenderUnity(this.state.maxProgress, name, writer, this.state.resolution, href => {
        callback(href);
      }, progres => {
        this.setState(() => ({
          progress: this.state.progress+1
        }))
      })
    }
    if (this.state.selected === 2) {
      hdrProcRenderUE4(this.state.maxProgress, name, writer, this.state.resolution, href => {
        callback(href);
      }, progres => {
        this.setState(() => ({
          progress: this.state.progress+1
        }))
      })
    }
    if (this.state.selected === 3) {
      hdrProcRenderSep(this.state.maxProgress, name, writer, this.state.resolution, href => {
        callback(href);
      }, progres => {
        this.setState(() => ({
          progress: this.state.progress+1
        }))
      })
    }
  }
  regularProccess = (name, writer, callback) => {
    if (this.state.selected === 1) {
      procRenderUnity(this.state.maxProgress, name, writer, this.state.resolution, href => {
        callback(href);
      }, progres => {
        this.setState(() => ({
          progress: this.state.progress+1
        }))
      })
    }
    if (this.state.selected === 2) {
      procRenderUE4(this.state.maxProgress, name, writer, this.state.resolution, href => {
        callback(href);
      }, progres => {
        this.setState(() => ({
          progress: this.state.progress+1
        }))
      })
    }
    if (this.state.selected === 3) {
      procRenderSep(this.state.maxProgress, name, writer, this.state.resolution, href => {
        callback(href);
      }, progres => {
        this.setState(() => ({
          progress: this.state.progress+1
        }))
      })
    }
  }
  saveFiles = () => {
    this.state.zip.generateAsync({type:"blob"}).then(function (blob) {
      saveAs(blob, 'Cubemap.zip')
    });
    this.onClose();
  }
  handleSelect = (index = 0) => event => {
    this.setState(() => ({ selected: index }))
  }
  onSelectChange = name => event => {
    this.setState({ [name]: event.target.value });
  }
  onClose = () => {
    this.props.onClose();
    this.setState(() => ({
      url: '',
      download: '',
      processed: false,
      saveDisable: false,
      progress: 0
    }))
  }
  render() {
    const { classes } = this.props;
    const { selected } = this.state;
    return (
      <Dialog
        open={this.props.open}
        onClose={this.onClose}
      >
        <DialogTitle>
          Chose Your Layout
        </DialogTitle>
        <DialogContent style={{ height: 450 }}>
          <div style={{ display: 'flex' }}>
            <ResolutionSelect
              classes={classes}
              onChange={this.onSelectChange('resolution')}
              value={this.state.resolution}
            />
            <FormatSelect
              classes={classes}
              onChange={this.onSelectChange('format')}
              value={this.state.format}
            />
          </div>
          <CrossLayout classes={classes} selected={selected} onClick={this.handleSelect(1)} />
          <LineLayout classes={classes} selected={selected} onClick={this.handleSelect(2)} />
          <SeperateLayout classes={classes} selected={selected} onClick={this.handleSelect(3)} />
        </DialogContent>
        <LinearProgress variant="determinate" value={this.state.progress / parseFloat(this.state.maxProgress)} />

        <DialogActions>

          {this.state.processed ?
            <Button
              id={'SaveButton'}
              variant='contained'
              color='primary'
              disabled={selected === 0 || !( this.state.progress === this.state.maxProgress )}
              onClick={this.saveFiles}
            >
              Save
            </Button>
            :
            <Button
              variant='contained'
              disabled={selected === 0 || this.state.saveDisable}
              onClick={this.proccessFiles()}
            >
              Process
            </Button>
          }
        </DialogActions>
      </Dialog>
    )
  }
}

export default withStyles(styles)(SaveDialog);

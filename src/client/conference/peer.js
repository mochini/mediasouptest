import PropTypes from 'prop-types'
import React from 'react'

class Peer extends React.Component {

  static propTypes = {
    audioTrack: PropTypes.object,
    videoTrack: PropTypes.object,
  }

  audio = null
  audioTrack = null
  canvas = null
  video = null
  videoTrack = null

  render() {
    return (
      <div className="maha-peer">
        <video { ...this._getVideo() } />
        <audio { ...this._getAudio() } />
        <canvas { ...this._getCanvas() } />
      </div>
    )
  }

  componentDidMount() {
    const { audioTrack, videoTrack } = this.props
		this._handleSetTracks(audioTrack, videoTrack);
  }

  componentDidUpdate(prevProps) {
    const { audioTrack, videoTrack } = this.props
    if(audioTrack !== prevProps.audioTrack) {
      this._handleSetTracks(audioTrack, videoTrack)
    }
    if(videoTrack !== prevProps.videoTrack) {
      this._handleSetTracks(audioTrack, videoTrack)
    }
  }

  _getAudio() {
    return {
      ref: node => this.audio = node,
      autoPlay: true,
      playsInline: true,
      muted: false,
      controls: false
    }
  }

  _getCanvas() {
    return {
      ref: node => this.canvas = node,
			className: ''
    }
  }

  _getVideo() {
    return {
      ref: node => this.video = node,
      className: '',
      autoPlay: true,
      playsInline: true,
      muted: false,
      controls: false
    }
  }

  _handleSetTracks(audioTrack, videoTrack) {
    if(audioTrack === this.audioTrack && videoTrack === this._videoTrack) return
		this.audioTrack = audioTrack
    this.videoTrack = videoTrack
    if(audioTrack) {
			const stream = new MediaStream
			stream.addTrack(audioTrack)
			this.audio.srcObject = stream;
      this.audio.play()
		} else {
			this.audio.srcObject = null;
		}
    if(videoTrack) {
			const stream = new MediaStream
			stream.addTrack(videoTrack)
      this.video.srcObject = stream
      this.video.oncanplay = () => this.setState({ videoCanPlay: true })
      this.video.onplay = () => {
        this.setState({ videoElemPaused: false })
        this.audio.play()
      }
      this.video.onpause = () => this.setState({ videoElemPaused: true });
      this.video.play()
      // this._startVideoResolution()
		} else {
			this.video.srcObject = null
		}
  }

}

export default Peer

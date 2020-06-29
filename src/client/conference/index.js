import PropTypes from 'prop-types'
import React from 'react'
import Peer from './peer'

class Conference extends React.Component {

  static propTypes = {
    consumers: PropTypes.array,
    audioTrack: PropTypes.object,
    videoTrack: PropTypes.object,
  }

  render() {
    const consumers = this._getVideoConsumers()
    return (
      <div className="maha-conference">
        <div className="maha-conference-item">
          <Peer { ...this._getPeer() } />
        </div>
        { consumers.map((consumer, index) => (
          <div className="maha-conference-item" key={`consumer_${index}`}>
            <Peer { ...this._getConsumer(consumer) } />
          </div>
        ))}
      </div>
    )
  }

  _getVideoConsumers() {
    return this.props.consumers.filter(consumer => {
      return consumer.track.kind === 'video'
    })
  }

  _getConsumer(consumer) {
    const { audioTrack } = this.props
    return {
      audioTrack,
      videoTrack: consumer.track
    }
  }

  _getPeer() {
    const { audioTrack, videoTrack } = this.props
    return {
      audioTrack,
      videoTrack
    }
  }

}

export default Conference

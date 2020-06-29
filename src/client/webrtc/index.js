import * as mediasoupClient from "mediasoup-client"
import protooClient from 'protoo-client'
import { hot } from 'react-hot-loader'
import Conference from '../conference'
import PropTypes from 'prop-types'
import React from 'react'
import _ from 'lodash'

class WebRTC extends React.Component {

  closed = false
  consumers = []
  device = null
  micProducer = null
  protoo = null
  recvTransport = null
  sendTransport = null
  webcam = {
		device: null,
		resolution: 'hd'
	}
  webcamProducer = null
  webcams = {}

  state = {
    consumers: [],
    audioTrack: null,
    videoTrack: null,
    peers: []
  }

  render() {
    return (
      <Conference { ...this._getConference() } />
    )
  }

  componentDidMount() {
    this.device = this._getDevice()
    this.protoo = this._getProtoo()
  }

  _getConference() {
    const { audioTrack, consumers, videoTrack } = this.state
    return {
      audioTrack,
      consumers,
      videoTrack
    }
  }

  _getDevice() {
    const device = new mediasoupClient.Device()
    return device
  }

  _getProtoo() {
    const roomId = 'one'
    const peerId = _.random(100000000, 999999999).toString(36)
    const transport = new protooClient.WebSocketTransport(`ws://localhost:3001?roomId=${roomId}&peerId=${peerId}`)
    const protoo = new protooClient.Peer(transport)
    protoo.on('close', this._handleProtooClose.bind(this))
    protoo.on('disconnected', this._handleProtooDisconnected.bind(this))
    protoo.on('failed', this._handleProtooFailed.bind(this))
    protoo.on('notification', this._handleProtooNotification.bind(this))
    protoo.on('open', this._handleProtooOpen.bind(this))
    protoo.on('request', this._handleProtooRequest.bind(this))
    return protoo
  }

  async _getRecvTransport() {
    const transport = await this.protoo.request('createWebRtcTransport', {
      forceTcp: false,
      producing: false,
      consuming: true,
      sctpCapabilities: this.device.sctpCapabilities
    })
    const recvTransport = await this.device.createRecvTransport({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters,
      iceServers: []
    })
    recvTransport.on('connect', this._handleRecvTransportConnect.bind(this))
    return recvTransport
  }

  async _getSendTransport() {
    const transport = await this.protoo.request('createWebRtcTransport', {
      forceTcp: false,
      producing: true,
      consuming: false,
      sctpCapabilities: this.device.sctpCapabilities
    })
    const sendTransport = await this.device.createSendTransport({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters,
      iceServers: [],
      proprietaryConstraints: {
        optional: [
          { googDscp: true }
        ]
      }
    })
    sendTransport.on('connect', this._handleSendTransportConnect.bind(this))
    sendTransport.on('connectionstatechange', this._handleSendTransportConnectionStateChange.bind(this))
    sendTransport.on('produce', this._handleSendTransportProduce.bind(this))
    sendTransport.on('producedata', this._handleSendTransportProduceData.bind(this))
    return sendTransport
  }

  _handleProtooClose() {
    if(this.closed) return
    this.closed = true
    console.debug('close()')
    this.protoo.close()
    if(this.sendTransport) this.sendTransport.close()
    if(this.recvTransport) this.recvTransport.close()
  }

  async _handleJoin() {
    if(this.closed) return
    this.closed = true
    console.debug('close()')
    this.protoo.close()
    if(this.sendTransport) this.sendTransport.close()
    if(this.recvTransport) this.recvTransport.close()
  }

  // protoo

  _handleProtooClose() {
    console.log('_handleProtooClose')
  }

  _handleProtooDisconnected() {
    console.log('_handleProtooDisconnected')
  }

  _handleProtooFailed() {
    console.log('_handleProtooFailed')
  }

  _handleProtooNotification(notification) {
    console.log(notification.method)
    if(notification.method === 'activeSpeaker') {
      this._handleProtooNotificationActiveSpeaker(notification)
    }
    if(notification.method === 'consumerClosed') {
      this._handleProtooNotificationConsumerClosed(notification)
    }
    if(notification.method === 'consumerLayersChanged') {
      this._handleProtooNotificationConsumerLayersChanged(notification)
    }
    if(notification.method === 'consumerPaused') {
      this._handleProtooNotificationConsumerPaused(notification)
    }
    if(notification.method === 'consumerResumed') {
      this._handleProtooNotificationConsumerResumed(notification)
    }
    if(notification.method === 'consumerScore') {
      this._handleProtooNotificationConsumerScore(notification)
    }
    if(notification.method === 'dataConsumerClosed') {
      this._handleProtooNotificationDataConsumerClosed(notification)
    }
    if(notification.method === 'newPeer') {
      this._handleProtooNotificationNewPeer(notification)
    }
    if(notification.method === 'peerClosed') {
      this._handleProtooNotificationPeerClosed(notification)
    }
    if(notification.method === 'peerDisplayNameChanged') {
      this._handleProtooNotificationPeerDisplayNameChanged(notification)
    }
    if(notification.method === 'producerScore') {
      this._handleProtooNotificationProducerScore(notification)
    }
  }

  _handleProtooNotificationActiveSpeaker(notification) {
    console.log('_handleProtooNotificationActiveSpeaker', notification)
  }

  _handleProtooNotificationConsumerClosed(notification) {
    const { consumerId } = notification.data
    delete this.consumers[consumerId]
    this.setState({
      consumers: [
        ...this.state.consumers.filter(consumer => {
          return consumer.id !== consumerId
        })
      ]
    })
  }

  _handleProtooNotificationConsumerLayersChanged(notification) {
    console.log('_handleProtooNotificationConsumerLayersChanged', notification)
  }

  _handleProtooNotificationConsumerPaused(notification) {
    console.log('_handleProtooNotificationConsumerPaused', notification)
  }

  _handleProtooNotificationConsumerResumed(notification) {
    console.log('_handleProtooNotificationConsumerResumed', notification)
  }

  _handleProtooNotificationConsumerScore(notification) {
    console.log('_handleProtooNotificationConsumerScore', notification)
  }

  _handleProtooNotificationDataConsumerClosed(notification) {
    console.log('_handleProtooNotificationDataConsumerClosed', notification)
  }

  _handleProtooNotificationNewPeer(notification) {
    this.setState({
      peers: [
        ...this.state.peers,
        notification.data
      ]
    })
  }

  _handleProtooNotificationPeerClosed(notification) {
    const { peerId } = notification.data
    this.setState({
      peers: [
        ...this.state.peers.filter(peer => {
          return peer.id !== peerId
        })
      ]
    })
  }

  _handleProtooNotificationPeerDisplayNameChanged(notification) {
    console.log('_handleProtooNotificationPeerDisplayNameChanged', notification)
  }

  _handleProtooNotificationProducerScore(notification) {
    console.log('_handleProtooNotificationProducerScore', notification)
  }

  async _handleProtooOpen() {
    const routerRtpCapabilities = await this.protoo.request('getRouterRtpCapabilities')
    await this.device.load({ routerRtpCapabilities })
    this.sendTransport = await this._getSendTransport()
    this.recvTransport = await this._getRecvTransport()
    this.protoo.request('join', {
      displayName: 'mochini',
      device: this.device,
      rtpCapabilities: this.device.rtpCapabilities,
      sctpCapabilities: this.device.sctpCapabilities
    })
    await this._handleMicEnableMic()
    await this._handleWebcamEnableWebcam()
  }

  _handleProtooRequest(request, accept, reject) {
    if(request.method === 'newConsumer') {
      this._handleProtooRequestNewConsumer(request, accept, reject)
    }
    if(request.method === 'newDataConsumer') {
      this._handleProtooRequestNewDataConsumer(request, accept, reject)
    }
  }

  async _handleProtooRequestNewConsumer(request, accept, reject) {
    const { peerId, producerId, id, kind, rtpParameters, type, appData, producerPaused } = request.data
    const consumer = await this.recvTransport.consume({
  		id,
  		producerId,
  		kind,
  		rtpParameters,
  		appData: {
        ...appData,
        peerId
      }
		})
    this.consumers[consumer.id] = consumer
		consumer.on('transportclose', () => {
			delete this.consumers[consumer.id]
		})
		const { spatialLayers, temporalLayers } = mediasoupClient.parseScalabilityMode(consumer.rtpParameters.encodings[0].scalabilityMode)
    this.setState({
      consumers: [
        ...this.state.consumers,
        {
					id: consumer.id,
					type: type,
					locallyPaused: false,
					remotelyPaused: producerPaused,
					rtpParameters: consumer.rtpParameters,
					spatialLayers: spatialLayers,
					temporalLayers: temporalLayers,
					preferredSpatialLayer: spatialLayers - 1,
					preferredTemporalLayer: temporalLayers - 1,
					priority: 1,
					codec: consumer.rtpParameters.codecs[0].mimeType.split('/')[1],
					track: consumer.track
				}
      ]
    })
		accept()
    // if(consumer.kind === 'video' && store.getState().me.audioOnly)
    // 							this._pauseConsumer(consumer);
  }

  _handleProtooRequestNewDataConsumer(request, accept, reject) {
    console.log('_handleNewDataConsumer', { request, accept, reject })
  }

  /// microphone

  async _getAudioStream() {
    if(!this.externalAudio) {
      return await navigator.mediaDevices.getUserMedia({
				audio: {
          source: 'device'
        }
			})
    } else {
      return await navigator.mediaDevices.getUserMedia({
				audio: {
  				source: this._externalAudio.startsWith('http') ? 'url': 'file',
  				file: this._externalAudio,
  				url: this._externalAudio
  			}
  		})
    }
  }

  async _handleMicDisableMic() {
    if(!this.micProducer)
    this.micProducer.close()
    await this.protoo.request('closeProducer', {
      producerId: this.micProducer.id
    })
    this.micProducer = null
  }

  async _handleMicEnableMic() {
    if(this.micProducer) return
    if(!this.device.canProduce('audio')) return
    const stream = await this._getAudioStream()
    const track = stream.getAudioTracks()[0]
    this.setState({
      audioTrack: track
    })
    this.micProducer = await this.sendTransport.produce({
			track,
			codecOptions: {
				opusStereo: true,
				opusDtx: true
			}
		})
    this.micProducer.on('transportclose', this._handleMicTransportClose.bind(this))
    this.micProducer.on('trackended', this._handleMicTrackEnded.bind(this))
  }

  async _handleMicMuteMic() {
    console.debug('muteMic()')
		this.micProducer.pause()
    await this._protoo.request('pauseProducer', {
      producerId: this.micProducer.id
    })
    // store.dispatch(stateActions.setProducerPaused(this._micProducer.id));
  }

  _handleMicTransportClose() {
    this.micProducer = null
  }

  async _handleMicTrackEnded() {
    await this._handleMicDisableMic()
  }

  async _handleMicUnmuteMic() {
    console.debug('unmuteMic()')
		this.micProducer.resume()
    await this._protoo.request('resumeProducer', {
      producerId: this.micProducer.id
    })
    // store.dispatch(stateActions.setProducerResumed(this._micProducer.id));
  }

  /// webcam

  async _getVideoStream() {
    if(!this.externalVideo) {
      return await navigator.mediaDevices.getUserMedia({
				video: {
          source: 'device'
        }
			})
    } else {
      return await navigator.mediaDevices.getUserMedia({
				video: {
  				source: this.externalVideo.startsWith('http') ? 'url': 'file',
  				file: this.externalVideo,
  				url: this.externalVideo
  			}
  		})
    }
  }

  async _handleWebcamChangeWebcam() {
    console.debug('changeWebcam()')
		// store.dispatch(stateActions.setWebcamInProgress(true));
		await this._updateWebcams()
		const array = Array.from(this.webcamProducer.keys())
		const deviceId = this.webcam.device ? this.webcam.device.deviceId : undefined;
		let idx = array.indexOf(deviceId)
    idx = idx < array.length - 1 ? idx + 1 : 0
		this.webcam.device = this._webcams.get(array[idx])
		console.debug('changeWebcam() | new selected webcam [device:%o]', this.webcam.device)
		this.webcam.resolution = 'hd'
		if(!this.webcam.device) throw new Error('no webcam devices')
		this.webcamProducer.track.stop()
		console.debug('changeWebcam() | calling getUserMedia()');
		const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId : {
          exact: this.webcam.device.deviceId
        },
        ...VIDEO_CONSTRAINS[this.webcam.resolution]
      }
    })
		const track = stream.getVideoTracks()[0]
		await this.webcamProducer.replaceTrack({ track })
		// store.dispatch(stateActions.setProducerTrack(this._webcamProducer.id, track))
		// store.dispatch(stateActions.setWebcamInProgress(false))
	}

  async _handleWebcamChangeWebcamResolution() {
		console.debug('changeWebcamResolution()')
		// store.dispatch(stateActions.setWebcamInProgress(true))
    if(this.webcam.resolution === 'qvga') {
      this.webcam.resolution === 'vga'
    } else if(this.webcam.resolution === 'hd') {
      this.webcam.resolution === 'qvga'
    } else {
      this.webcam.resolution === 'hd'
    }
		console.debug('changeWebcamResolution() | calling getUserMedia()');
		const stream = await navigator.mediaDevices.getUserMedia({
			video : {
				deviceId : {
          exact: this.webcam.device.deviceId
        },
				...VIDEO_CONSTRAINS[this.webcam.resolution]
			}
		})
		const track = stream.getVideoTracks()[0]
		await this.webcamProducer.replaceTrack({ track });
		// store.dispatch(stateActions.setProducerTrack(this._webcamProducer.id, track));
		// store.dispatch(stateActions.setWebcamInProgress(false));
	}

  async _handleWebcamDisableWebcam() {
    if(!this.webcamProducer)
    this.webcamProducer.close()
    await this.protoo.request('closeProducer', {
      producerId: this.webcamProducer.id
    })
    this.webcamProducer = null
  }

  async _handleWebcamEnableWebcam() {
    console.debug('enableWebcam()')
    if(this.webcamProducer) return
    if(this.shareProducer) await this._handleShareDisableShare()
    if(!this.device.canProduce('video')) {
      console.error('enableWebcam() | cannot produce video');
      return
    }
    const stream = await this._getVideoStream()
    const track = stream.getVideoTracks()[0]
    this.setState({
      videoTrack: track
    })
    this.webcamProducer = await this.sendTransport.produce({ track })
    this.micProducer.on('transportclose', this._handleWebcamTransportClose.bind(this))
    this.micProducer.on('trackended', this._handleWebcamTrackEnded.bind(this))
  }

  _handleWebcamTransportClose() {
    this.webcamProducer = null
  }

  async _handleWebcamTrackEnded() {
    await this._handleWebcamDisableWebcam()
  }

  async _handleWebcamUpdateWebcams() {
    console.debug('_updateWebcams()')
		this.webcams = {}
		console.debug('_updateWebcams() | calling enumerateDevices()')
		const devices = await navigator.mediaDevices.enumerateDevices()
    devices.map(device => {
      if(device.kind === 'videoinput'){
        this.webcams[device.deviceId] = device
      }
    })
		const array = Object.values(this.webcams)
		const len = array.length
		const currentWebcamId = this.webcam.device ? this.webcam.device.deviceId : undefined
		console.debug('_updateWebcams() [webcams:%o]', array)
		if (len === 0) this.webcam.device = null
		if(!this._webcams.has(currentWebcamId)) this.webcam.device = array[0]
		// store.dispatch( stateActions.setCanChangeWebcam(this._webcams.size > 1))
	}

  /// recvTransport

  _handleRecvTransportConnect({ dtlsParameters }, callback, errback) {
    this.protoo.request('connectWebRtcTransport', {
      transportId: this.recvTransport.id,
      dtlsParameters
    }).then(callback).catch(errback)
  }

  /// sendTransport

  _handleSendTransportConnect({ dtlsParameters }, callback, errback) {
    this.protoo.request('connectWebRtcTransport', {
      transportId: this.sendTransport.id,
      dtlsParameters
    }).then(callback).catch(errback)
  }

  _handleSendTransportConnectionStateChange(connectionState) {
    if(connectionState !== 'connected') return
    // enable chat data
    // enable bot?
  }

  _handleSendTransportProduce({ kind, rtpParameters, appData }, callback, errback) {
    this.protoo.request('produce', {
      transportId: this.sendTransport.id,
      kind,
      rtpParameters,
      appData
    }).then(callback).catch(errback)
  }

  _handleSendTransportProduceData({ sctpStreamParameters, label, protocol, appData }, callback, errback) {
    this.protoo.request('produceData',{
			transportId: this.sendTransport.id,
			sctpStreamParameters,
			label,
			protocol,
			appData
    }).then(callback).catch(errback)
  }

}

export default WebRTC

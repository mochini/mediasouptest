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
  mic = null
  protoo = null
  recvTransport = null
  sendTransport = null
  webcam = null

  _handleProtooClose = this._handleProtooClose.bind(this)
  _handleProtooDisconnected = this._handleProtooDisconnected.bind(this)
  _handleProtooFailed = this._handleProtooFailed.bind(this)
  _handleMicTransportClose = this._handleMicTransportClose.bind(this)
  _handleMicTrackEnded = this._handleMicTrackEnded.bind(this)
  _handleProtooNotification = this._handleProtooNotification.bind(this)
  _handleProtooOpen = this._handleProtooOpen.bind(this)
  _handleProtooRequest = this._handleProtooRequest.bind(this)
  _handleRecvTransportConnect = this._handleRecvTransportConnect.bind(this)
  _handleSendTransportConnect = this._handleSendTransportConnect.bind(this)
  _handleSendTransportConnectionStateChange = this._handleSendTransportConnectionStateChange.bind(this)
  _handleSendTransportProduce = this._handleSendTransportProduce.bind(this)
  _handleSendTransportProduceData = this._handleSendTransportProduceData.bind(this)
  _handleWebcamTransportClose = this._handleWebcamTransportClose.bind(this)
  _handleWebcamTrackEnded = this._handleWebcamTrackEnded.bind(this)

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
    protoo.on('close', this._handleProtooClose)
    protoo.on('disconnected', this._handleProtooDisconnected)
    protoo.on('failed', this._handleProtooFailed)
    protoo.on('notification', this._handleProtooNotification)
    protoo.on('open', this._handleProtooOpen)
    protoo.on('request', this._handleProtooRequest)
    return protoo
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
    sendTransport.on('connect', this._handleSendTransportConnect)
    sendTransport.on('connectionstatechange', this._handleSendTransportConnectionStateChange)
    sendTransport.on('produce', this._handleSendTransportProduce)
    sendTransport.on('producedata', this._handleSendTransportProduceData)
    return sendTransport
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
    recvTransport.on('connect', this._handleRecvTransportConnect)
    return recvTransport
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
    if(!this.mic)
    this.mic.close()
    await this.protoo.request('closeProducer', {
      producerId: this.mic.id
    })
    this.mic = null
  }

  async _handleMicEnableMic() {
    if(this.mic) return
    if(!this.device.canProduce('audio')) return
    const stream = await this._getAudioStream()
    const track = stream.getAudioTracks()[0]
    this.setState({
      audioTrack: track
    })
    this.mic = await this.sendTransport.produce({
			track,
			codecOptions: {
				opusStereo: true,
				opusDtx: true
			}
		})
    this.mic.on('transportclose', this._handleMicTransportClose)
    this.mic.on('trackended', this._handleMicTrackEnded)
  }

  _handleMicTransportClose() {
    this.mic = null
  }

  async _handleMicTrackEnded() {
    await this._handleMicDisableMic()
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

  async _handleWebcamDisableWebcam() {
    if(!this.webcam)
    this.webcam.close()
    await this.protoo.request('closeProducer', {
      producerId: this.webcam.id
    })
    this.webcam = null
  }

  async _handleWebcamEnableWebcam() {
    if(this.webcam) return
    if(!this.device.canProduce('video')) return
    const stream = await this._getVideoStream()
    const track = stream.getVideoTracks()[0]
    this.setState({
      videoTrack: track
    })
    this.webcam = await this.sendTransport.produce({ track })
    this.mic.on('transportclose', this._handleWebcamTransportClose)
    this.mic.on('trackended', this._handleWebcamTrackEnded)
  }

  _handleWebcamTransportClose() {
    this.webcam = null
  }

  async _handleWebcamTrackEnded() {
    await this._handleWebcamDisableWebcam()
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

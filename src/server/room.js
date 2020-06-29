import * as protoo from 'protoo-server'

class Room {

  audioLevelObserver = null
  closed = false
  peers = []
  room = null
  roomId = null
  router = null

  static async create(roomId, worker) {
    const room = new protoo.Room()
    const router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2
        },
        {
          kind: 'video',
          mimeType: 'video/H264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
            'level-asymmetry-allowed': 1
          }
        }
      ]
    })
    const audioLevelObserver = await router.createAudioLevelObserver({
			maxEntries: 1,
			threshold: -80,
			interval: 800
		})
    return new Room({
      roomId,
      room,
      router,
      audioLevelObserver
    })
  }

  constructor({ roomId, room, router, audioLevelObserver }) {
    this.roomId = roomId
    this.room = room
    this.router = router
    this.audioLevelObserver = audioLevelObserver
    this.audioLevelObserver.on('volumes', this._handleAudioLevelObserverVolumes.bind(this))
    this.audioLevelObserver.on('silence', this._handleAudioLevelObserverSilence.bind(this))
  }

  async addPeer(peerId, transport) {
    const existingPeer = this.room.getPeer(peerId)
    if(existingPeer) existingPeer.close()
    const peer = await this.room.createPeer(peerId, transport)
    peer.data.consume = undefined
		peer.data.joined = false
		peer.data.displayName = undefined
		peer.data.device = undefined
		peer.data.rtpCapabilities = undefined
		peer.data.sctpCapabilities = undefined
    peer.data.transports = {}
		peer.data.producers = {}
		peer.data.consumers = {}
		peer.data.dataProducers = {}
		peer.data.dataConsumers = {}
    peer.on('request', this._handlePeerRequest.bind(this, peer))
    peer.on('close', this._handlePeerClose.bind(this, peer))
  }

  _getJoinedPeers({ excludePeer = undefined } = {}) {
    return this.room.peers.filter(peer => {
      return peer.data.joined && peer !== excludePeer
    })
  }

  _handleClose() {
    console.debug('close()')
		this.closed = true
		this.room.close()
		this.router.close()
		// this._bot.close()
		this.emit('close')
		// if (this._networkThrottled){
		// 	throttle.stop({}).catch(() => {});
		// }
  }

  // audioLevelObserver

  _handleAudioLevelObserverSilence() {
    this._getJoinedPeers().map(peer => {
      peer.notify('activeSpeaker', {
        peerId : null
      }).catch(() => {});
    })
  }

  _handleAudioLevelObserverVolumes(volumes) {
    const { producer, volume } = volumes[0]
    this._getJoinedPeers().map(peer => {
      peer.notify('activeSpeaker', {
        peerId : producer.appData.peerId,
        volume : volume
      }).catch(() => {});
    })
  }

  // consumer

  async _handleConsumerCreateConsumer({ consumerPeer, producerPeer, producer }) {
    const canConsume = this.router.canConsume({
			producerId: producer.id,
			rtpCapabilities: consumerPeer.data.rtpCapabilities
		})
    if(!consumerPeer.data.rtpCapabilities || !canConsume) return
    const transport = Object.values(consumerPeer.data.transports).find(transport => {
      return transport.appData.consuming
    })
    if(!transport) {
      console.warn('_createConsumer() | Transport for consuming not found');
      return
    }
    const consumer = await transport.consume({
			producerId: producer.id,
			rtpCapabilities: consumerPeer.data.rtpCapabilities,
			paused: true
		})
    consumerPeer.data.consumers[consumer.id] = consumer
    consumer.on('layerschange', this._handleConsumerProducerLayersChange.bind(this, consumerPeer, consumer))
    consumer.on('producerclose', this._handleConsumerProducerClose.bind(this, consumerPeer, consumer))
    consumer.on('producerpause', this._handleConsumerProducerPause.bind(this, consumerPeer, consumer))
    consumer.on('producerresume', this._handleConsumerProducerResume.bind(this, consumerPeer, consumer))
    consumer.on('score', this._handleConsumerScore.bind(this, consumerPeer, consumer))
    consumer.on('trace', this._handleConsumerTrace.bind(this, consumer))
    consumer.on('transportclose', this._handleConsumerTransportClose.bind(this, consumerPeer, consumer))
    await consumerPeer.request('newConsumer', {
			peerId: producerPeer.id,
			producerId: producer.id,
			id: consumer.id,
			kind: consumer.kind,
			rtpParameters: consumer.rtpParameters,
			type: consumer.type,
			appData: producer.appData,
			producerPaused: consumer.producerPaused
		})
		await consumer.resume()
		consumerPeer.notify('consumerScore', {
			consumerId: consumer.id,
			score: consumer.score
		}).catch(() => {})
  }

  _handleConsumerProducerLayersChange(consumerPeer, consumer, layers) {
    consumerPeer.notify('consumerLayersChanged', {
			consumerId: consumer.id,
			spatialLayer: layers ? layers.spatialLayer: null,
			temporalLayerlayers: layers ? layers.temporalLayer: null
		}).catch(() => {});
  }

  _handleConsumerProducerClose(consumerPeer, consumer) {
    console.log('_handleConsumerProducerClose')
    delete consumerPeer.data.consumers[consumer.id]
		consumerPeer.notify('consumerClosed', {
      consumerId: consumer.id
    }).catch(() => {})
  }

  _handleConsumerProducerPause(consumerPeer, consumer) {
		consumerPeer.notify('consumerPaused', {
      consumerId: consumer.id
    }).catch(() => {})
  }

  _handleConsumerProducerResume(consumerPeer, consumer) {
    consumerPeer.notify('consumerResumed', {
      consumerId: consumer.id
    }).catch(() => {})
  }

  _handleConsumerScore(consumerPeer, consumer, score) {
    consumerPeer.notify('consumerScore', {
      consumerId: consumer.id,
      score
    }).catch(() => {})
  }

  _handleConsumerTrace(consumer, trace) {
    console.debug('consumer "trace" event [producerId:%s, trace.type:%s, trace:%o]', consumer.id, trace.type, trace)
  }

  _handleConsumerTransportClose(consumerPeer, consumer) {
    consumerPeer.data.consumers.delete(consumer.id);
  }

  // peer

  _handlePeerClose(peer) {
    if(this.closed) return
    console.debug('protoo Peer "close" event [peerId:%s]', peer.id)
    if(peer.data.joined){
      this._getJoinedPeers({ excludePeer: peer }).map(otherPeer => {
        otherPeer.notify('peerClosed', {
          peerId: peer.id
        }).catch(() => {});
      })
    }
    Object.values(peer.data.transports).map(transport => {
      transport.close()
    })
    if(this.room.peers.length > 0) return
    console.info('last Peer in the room left, closing the room [roomId:%s]', this._roomId)
    this._handleClose()
  }

  async _handlePeerRequest(peer, request, accept, reject) {
    if(request.method === 'connectWebRtcTransport') {
      await this._handlePeerRequestConnectWebRtcTransport(peer, request, accept, reject)
    } else if(request.method === 'createWebRtcTransport') {
      await this._handlePeerRequestCreateWebRtcTransport(peer, request, accept, reject)
    } else if(request.method === 'getRouterRtpCapabilities') {
      await this._handlePeerRequestGetRouterRtpCapabilities(peer, request, accept, reject)
    } else if(request.method === 'join') {
      await this._handlePeerRequestJoin(peer, request, accept, reject)
    } else if(request.method === 'produce') {
      await this._handlePeerRequestProduce(peer, request, accept, reject)
    } else if(request.method === 'restartIce') {
      await this._handlePeerRequestRestartIce(peer, request, accept, reject)
    }
  }

  async _handlePeerRequestConnectWebRtcTransport(peer, request, accept, reject) {
    const { transportId, dtlsParameters } = request.data
    const transport = peer.data.transports[transportId]
    if (!transport) throw new Error(`transport with id "${transportId}" not found`)
    await transport.connect({ dtlsParameters })
    accept()
  }

  async _handlePeerRequestCreateWebRtcTransport(peer, request, accept, reject) {
    const { forceTcp, producing, consuming, sctpCapabilities } = request.data
    const transport = await this.router.createWebRtcTransport({
      listenIps: [
        {
          ip: '127.0.0.1',
          announcedIp: '127.0.0.1'
        }
      ],
      initialAvailableOutgoingBitrate: 1000000,
      minimumAvailableOutgoingBitrate: 600000,
      maxSctpMessageSize: 262144,
      maxIncomingBitrate: 1500000,
      enableSctp: !!sctpCapabilities,
      numSctpStreams: (sctpCapabilities || {}).numStreams,
      appData: { producing, consuming }
    })
    transport.on('dtlsstatechange', this._handleTransportDtlsStateChange.bind(this))
    transport.on('sctpstatechange', this._handleTransportSctpStateChange.bind(this))
    peer.data.transports[transport.id] = transport
    accept({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters
    })
  }

  _handlePeerRequestGetRouterRtpCapabilities(peer, request, accept, reject) {
    accept(this.router.rtpCapabilities)
  }

  async _handlePeerRequestJoin(peer, request, accept, reject) {
    console.log('peer join')
    if(peer.data.joined) throw new Error('peer already joined')
    peer.data.joined = true
		peer.data.displayName = request.data.displayName
		peer.data.device = request.data.device
		peer.data.rtpCapabilities = request.data.rtpCapabilities
		peer.data.sctpCapabilities = request.data.sctpCapabilities
    const joinedPeers = this._getJoinedPeers()
    accept({
      peers: joinedPeers.filter(joinedPeer => {
        return joinedPeer.id !== peer.id
      }).map(joinedPeer => ({
        id: joinedPeer.id,
        displayName: joinedPeer.data.displayName,
        device: joinedPeer.data.id,
      }))
    })
    joinedPeers.map(producerPeer => {
      Object.values(producerPeer.data.producers).map(producer => {
        this._handleConsumerCreateConsumer({
          consumerPeer: peer,
          producerPeer,
          producer
        })
      })
      // Object.values(producerPeer.data.dataProducers).map(dataProducer => {
      //   if(dataProducer.label === 'bot') continue
      //   this._handleConsumerCreateDataConsumer({
      //     dataConsumerPeer: peer,
      //     dataProducerPeer: producerPeer,
      //     dataProducer
      //   })
      // })
    })
    // this._createDataConsumer({
		// 	dataConsumerPeer: peer,
		// 	dataProducerPeer: null,
		// 	dataProducer: this._bot.dataProducer
		// })
    this._getJoinedPeers({ excludePeer: peer }).map(otherPeer => {
      otherPeer.notify('newPeer', {
        id          : peer.id,
        displayName : peer.data.displayName,
        device      : peer.data.device
      }).catch(() => {});
    })
  }

  async _handlePeerRequestRestartIce(peer, request, accept, reject) {
    const { transportId } = request.data
    const transport = peer.data.transports[transportId]
    if(!transport) throw new Error(`transport with id "${transportId}" not found`)
    const iceParameters = await transport.restartIce()
    accept(iceParameters)
  }

  async _handlePeerRequestProduce(peer, request, accept, reject) {
    if(!peer.data.joined) throw new Error('Peer not yet joined')
    const { transportId, kind, rtpParameters } = request.data
		const transport = peer.data.transports[transportId]
    if(!transport) throw new Error(`transport with id "${transportId}" not found`)
    const producer = await transport.produce({
			kind,
			rtpParameters,
			appData: {
        ...request.data.appData,
        peerId: peer.id
      }
		})
    peer.data.producers[producer.id] = producer
    producer.on('score', this._handleProducerScore.bind(this, peer, producer))
    producer.on('videoorientationchange', this._handleProducerVideoOrientationChange.bind(this, producer))
    producer.on('trace', this._handleProducerTrace.bind(this, producer))
		accept({
      id: producer.id
    })
    this._getJoinedPeers({ excludePeer: peer }).map(consumerPeer => {
      this._handleConsumerCreateConsumer({
				consumerPeer,
				producerPeer: peer,
				producer
			})
    })
    if(producer.kind === 'audio') {
			await this.audioLevelObserver.addProducer({
        producerId: producer.id
      })
		}
  }

  // producer

  _handleProducerScore(peer, producer, score) {
    peer.notify('producerScore', {
      producerId: producer.id,
      score
    }).catch(() => {})
  }

  _handleProducerTrace(producer, trace) {
    console.debug('producer "trace" event [producerId:%s, trace.type:%s, trace:%o]', producer.id, trace.type, trace);
  }

  _handleProducerVideoOrientationChange(producer, videoOrientation) {
    console.debug('producer "videoorientationchange" event [producerId:%s, videoOrientation:%o]', producer.id, videoOrientation);
  }

  //transport

  _handleTransportDtlsStateChange(dtlsState) {
    if (dtlsState === 'failed' || dtlsState === 'closed')
      console.warn('WebRtcTransport "dtlsstatechange" event [dtlsState:%s]', dtlsState)
  }

  _handleTransportSctpStateChange(sctpState) {
    console.debug('WebRtcTransport "sctpstatechange" event [sctpState:%s]', sctpState)
  }

}

export default Room

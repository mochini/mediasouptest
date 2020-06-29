import { WebSocketServer } from 'protoo-server'
import Room from './room'
import Url from 'url'

class SignalServer {

  protoo = null
  rooms = {}
  worker = null

  _handleConnectionRequest = this._handleConnectionRequest.bind(this)

  constructor(server, worker) {
    this.worker = worker
    this.protoo = new WebSocketServer(server, {
  		maxReceivedFrameSize: 960000,
  		maxReceivedMessageSize: 960000,
  		fragmentOutgoingMessages: true,
  		fragmentationThreshold: 960000
  	})
    this.protoo.on('connectionrequest', this._handleConnectionRequest)
  }

  async _getRoom(roomId) {
    if(this.rooms[roomId]) return this.rooms[roomId]
    this.rooms[roomId] = await Room.create(roomId, this.worker)
    return this.rooms[roomId]
  }

  async _handleConnectionRequest(info, accept, reject) {
    const url = Url.parse(info.request.url, true)
    const transport = accept()
    const room = await this._getRoom(url.query.roomId)
    await room.addPeer(url.query.peerId, transport)
  }

}

export default SignalServer

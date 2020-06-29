export const setRoomUrl = (url) => ({
  type: 'SET_ROOM_URL',
  url
})

export const setRoomState = (state) => ({
  type: 'SET_ROOM_STATE',
  state
})

export const setRoomActiveSpeaker = (peerId) => ({
  type: 'SET_ROOM_ACTIVE_SPEAKER',
  payload: peerId
})

export const setRoomStatsPeerId = (peerId) => ({
  type: 'SET_ROOM_STATS_PEER_ID',
  peerId
})

export const setRoomFaceDetection = (flag) => ({
  type: 'SET_FACE_DETECTION',
  flag
}

export const setMe = ({ peerId, displayName, displayNameSet, device }) => ({
  type: 'SET_ME',
  peerId,
  displayName,
  displayNameSet,
  device
})

export const setMediaCapabilities = ({ canSendMic, canSendWebcam }) => ({
  type: 'SET_MEDIA_CAPABILITIES',
  canSendMic,
  canSendWebcam
})

export const setCanChangeWebcam = (flag) => ({
  type: 'SET_CAN_CHANGE_WEBCAM',
  flag
})

export const setDisplayName = (displayName) => ({
  type: 'SET_DISPLAY_NAME',
  displayName
})

export const setAudioOnlyState = (enabled) => ({
  type: 'SET_AUDIO_ONLY_STATE',
  enabled
})

export const setAudioOnlyInProgress = (flag) => ({
  type: 'SET_AUDIO_ONLY_IN_PROGRESS',
  flag
})

export const setAudioMutedState = (enabled) => ({
  type: 'SET_AUDIO_MUTED_STATE',
  enabled
})

export const setRestartIceInProgress = (flag) => ({
  type: 'SET_RESTART_ICE_IN_PROGRESS',
  flag
})

export const addProducer = (producer) => ({
  type: 'ADD_PRODUCER',
  producer
})

export const removeProducer = (producerId) => ({
  type: 'REMOVE_PRODUCER',
  producerId
})

export const setProducerPaused = (producerId) => ({
  type: 'SET_PRODUCER_PAUSED',
  producerId
})

export const setProducerResumed = (producerId) => ({
  type: 'SET_PRODUCER_RESUMED',
  producerId
})

export const setProducerTrack = (producerId, track) => ({
  type: 'SET_PRODUCER_TRACK',
  producerId,
  track
})

export const setProducerScore = (producerId, score) => ({
  type: 'SET_PRODUCER_SCORE',
  producerId,
  score
})

export const addDataProducer = (dataProducer) => ({
  type: 'ADD_DATA_PRODUCER',
  dataProducer
})

export const removeDataProducer = (dataProducerId) => ({
  type: 'REMOVE_DATA_PRODUCER',
  dataProducerId
})

export const setWebcamInProgress = (flag) => ({
  type: 'SET_WEBCAM_IN_PROGRESS',
  flag
})

export const setShareInProgress = (flag) => ({
  type: 'SET_SHARE_IN_PROGRESS',
  flag
})

export const addPeer = (peer) => ({
  type: 'ADD_PEER',
  peer
})

export const removePeer = (peerId) => ({
  type: 'REMOVE_PEER',
  peerId
})

export const setPeerDisplayName = (displayName, peerId) => ( {
  type: 'SET_PEER_DISPLAY_NAME',
  displayName,
  peerId
})

export const addConsumer = (consumer, peerId) => ({
  type: 'ADD_CONSUMER',
  consumer,
  peerId
})

export const removeConsumer = (consumerId, peerId) => ({
  type: 'REMOVE_CONSUMER',
  consumerId,
  peerId
})

export const setConsumerPaused = (consumerId, originator) => ({
  type: 'SET_CONSUMER_PAUSED',
  consumerId,
  originator
})

export const setConsumerResumed = (consumerId, originator) => ({
  type: 'SET_CONSUMER_RESUMED',
  consumerId,
  originator
})

export const setConsumerCurrentLayers = (consumerId, spatialLayer, temporalLayer) => ({
  type: 'SET_CONSUMER_CURRENT_LAYERS',
  consumerId,
  spatialLayer,
  temporalLayer
})

export const setConsumerPreferredLayers = (consumerId, spatialLayer, temporalLayer) => ({
  type: 'SET_CONSUMER_PREFERRED_LAYERS',
  consumerId,
  spatialLayer,
  temporalLayer
})

export const setConsumerPriority = (consumerId, priority) => ({
  type: 'SET_CONSUMER_PRIORITY',
  consumerId,
  priority
})

export const setConsumerTrack = (consumerId, track) => ({
  type: 'SET_CONSUMER_TRACK',
  consumerId,
  track
})

export const setConsumerScore = (consumerId, score) => ({
  type: 'SET_CONSUMER_SCORE',
  consumerId,
  score
})

export const addDataConsumer = (dataConsumer, peerId) => ({
  type: 'ADD_DATA_CONSUMER',
  dataConsumer,
  peerId
})

export const removeDataConsumer = (dataConsumerId, peerId) => ({
  type: 'REMOVE_DATA_CONSUMER',
  dataConsumerId,
  peerId
})

export const addNotification = (notification) => ({
  type: 'ADD_NOTIFICATION',
  notification
})

export const removeNotification = (notificationId) => ({
  type: 'REMOVE_NOTIFICATION',
  notificationId
})

export const removeAllNotifications = () => ({
  type: 'REMOVE_ALL_NOTIFICATIONS'
})

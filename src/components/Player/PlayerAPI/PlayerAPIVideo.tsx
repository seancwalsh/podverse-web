import OmniAural, { useOmniAural } from 'omniaural'
import { createRef, useEffect } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import PlayerVideo from 'react-player'
import { retrieveLatestChaptersForEpisodeId } from '~/services/mediaRef'
import { playerGetDuration, playerUpdateDuration, playerUpdatePlaybackPosition } from '~/services/player/player'
import { videoInitialize, videoPause, videoPlay, videoSeekTo } from '~/services/player/playerVideo'
import { enrichChapterDataForPlayer, handleChapterUpdateInterval } from '~/services/player/playerChapters'
import { generateChapterFlagPositions, setClipFlagPositions } from '~/services/player/playerFlags'
import { addOrUpdateHistoryItemOnServer } from '~/services/userHistoryItem'
import { OmniAuralState } from '~/state/omniauralState'

type Props = unknown

export const PlayerAPIVideo = (props: Props) => {
  const [player] = useOmniAural('player') as [OmniAuralState['player']]
  // const [historyItemsIndex] = useOmniAural('historyItemsIndex')
  const historyItemsIndex = OmniAural.state.historyItemsIndex.value()
  const { currentNowPlayingItem, muted, paused, playSpeed, video, volume } = player
  const { src } = video

  useEffect(() => {
    videoInitialize()
  }, [])

  /* Never initialize PlayerAPIs on the server-side. */
  if (typeof window === 'undefined') {
    return null
  }

  const _onEnded = () => {
    addOrUpdateHistoryItemOnServer({
      nowPlayingItem: currentNowPlayingItem,
      playbackPosition: 0,
      mediaFileDuration: playerGetDuration(),
      forceUpdateOrderDate: false,
      skipSetNowPlaying: true,
      completed: true
    })
  }

  const _onLoadedMetaData = async () => {
    if (currentNowPlayingItem.clipStartTime) {
      videoSeekTo(currentNowPlayingItem.clipStartTime)
    }
    const duration = playerGetDuration()

    const historyItem = historyItemsIndex.episodes[currentNowPlayingItem.episodeId]

    if (Number.isInteger(currentNowPlayingItem.clipStartTime)) {
      setClipFlagPositions(currentNowPlayingItem, duration)
    } else if (historyItem) {
      videoSeekTo(historyItem.p)
    }

    const playbackPosition = currentNowPlayingItem.clipStartTime || historyItem?.p || 0

    addOrUpdateHistoryItemOnServer({
      nowPlayingItem: currentNowPlayingItem,
      playbackPosition,
      mediaFileDuration: duration,
      forceUpdateOrderDate: true,
      skipSetNowPlaying: false
    })

    if (currentNowPlayingItem.episodeChaptersUrl) {
      const data = await retrieveLatestChaptersForEpisodeId(currentNowPlayingItem.episodeId)
      const [chapters] = data
      const enrichedChapters = enrichChapterDataForPlayer(chapters, duration)
      const chapterFlagPositions = generateChapterFlagPositions(enrichedChapters, duration)
      OmniAural.setChapterFlagPositions(chapterFlagPositions)
      OmniAural.setChapters(enrichedChapters)
    }
  }

  const _onListen = () => {
    unstable_batchedUpdates(() => {
      playerUpdatePlaybackPosition()
      playerUpdateDuration()
      handleChapterUpdateInterval()
    })
  }

  window.playerVideo = createRef()

  return (
    <div className='video-player-wrapper'>
      <PlayerVideo
        controls
        onDuration={_onLoadedMetaData}
        onEnded={_onEnded}
        onPause={videoPause}
        onPlay={videoPlay}
        onSeek={_onListen}
        onProgress={_onListen}
        muted={muted}
        playbackRate={playSpeed}
        playing={!paused}
        ref={(ref) => {
          window.playerVideo = ref
        }}
        url={src}
        volume={volume ? volume / 100 : 0}
      />
    </div>
  )
}

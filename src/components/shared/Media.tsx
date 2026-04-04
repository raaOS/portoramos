"use client"
import { forwardRef } from 'react'
import MediaVideo, { MediaVideoProps } from './components/MediaVideo'
import MediaImage, { MediaImageProps } from './components/MediaImage'

export type MediaProps = ({
  kind: 'video'
} & MediaVideoProps) | ({
  kind: 'image'
} & MediaImageProps)

const Media = forwardRef<HTMLVideoElement, MediaProps>((props, ref) => {
  if (props.kind === 'video') {
    return <MediaVideo {...props} ref={ref} />
  }

  return <MediaImage {...props} />
})

Media.displayName = 'Media'

export default Media

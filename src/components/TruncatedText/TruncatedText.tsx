import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ShowMoreText from 'react-show-more-text'
import striptags from 'striptags'
import { sanitizeTextHtml } from '~/lib/utility/sanitize'

type Props = {
  dangerouslySetInnerHtml?: boolean
  lines: number
  text: string
}

export const TruncatedText = ({ dangerouslySetInnerHtml = false, lines, text }: Props) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  return (
    <ShowMoreText
      anchorClass='truncated-text-anchor'
      className='truncated-text'
      less={t('Show Less')}
      lines={lines}
      more={t('Show More')}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {dangerouslySetInnerHtml && (
        <div
          dangerouslySetInnerHTML={{
            __html: isExpanded ? sanitizeTextHtml(text) : sanitizeTextHtml(striptags(text))
          }}
        />
      )}
      {!dangerouslySetInnerHtml && <div>{striptags(text)}</div>}
    </ShowMoreText>
  )
}

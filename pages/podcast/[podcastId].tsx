import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import type { Episode, MediaRef, Podcast } from 'podverse-shared'
import { useEffect, useState } from 'react'
import { ClipListItem, EpisodeListItem, List, PageHeader, PageScrollableContent,
  Pagination, PodcastPageHeader, SideContent } from '~/components'
import { scrollToTopOfPageScrollableContent } from '~/components/PageScrollableContent/PageScrollableContent'
import { calcListPageCount } from '~/lib/utility/misc'
import { PV } from '~/resources'
import { getPodcastById } from '~/services/podcast'
import { getEpisodesByQuery } from '~/services/episode'
import { getMediaRefsByQuery } from '~/services/mediaRef'
import { getServerSideAuthenticatedUserInfo } from '~/services/auth'
import { Page } from '~/lib/utility/page'

interface ServerProps extends Page {
  serverClips: MediaRef[]
  serverClipsPageCount: number
  serverEpisodes: Episode[]
  serverEpisodesPageCount: number
  serverFilterPage: number
  serverFilterSort: string
  serverFilterType: string
  serverPodcast: Podcast
}

type FilterState = {
  filterPage?: number
  filterSort?: string
  filterType?: string
}

const keyPrefix = 'pages_podcast'

/* *TODO* 
    Rewrite this file to follow the patterns in pages/podcasts and pages/search.
    Move all functions inside the render function,
    get rid of the filterState,
    stop passing in filterState as a parameter,
    and instead get and set the filterState fields individually.
    Keep the sections in the same order
    (Initialization, useEffects, Client-Side Queries, Render Helpers).
*/

export default function Podcast(props: ServerProps) {
  const { serverClips, serverClipsPageCount, serverFilterPage, serverFilterSort,
    serverFilterType, serverEpisodes, serverEpisodesPageCount, serverPodcast } = props
  const { id } = serverPodcast

  const { t } = useTranslation()

  const [filterState, setFilterState] = useState({
    filterPage: serverFilterPage,
    filterSort: serverFilterSort,
    filterType: serverFilterType
  } as FilterState)
  const { filterPage, filterSort, filterType } = filterState
  const [episodesListData, setEpisodesListData] = useState<Episode[]>(serverEpisodes)
  const [episodesPageCount, setEpisodesPageCount] = useState<number>(serverEpisodesPageCount)
  const [clipsListData, setClipsListData] = useState<MediaRef[]>(serverClips)
  const [clipsPageCount, setClipsPageCount] = useState<number>(serverClipsPageCount)
  
  const pageTitle = serverPodcast.title || t('untitledPodcast')
  const pageSubHeader = filterType === PV.Filters.type._episodes
    ? t('Episodes') : t('Clips')
  const pageCount = filterType === PV.Filters.type._episodes
    ? episodesPageCount : clipsPageCount

  useEffect(() => {
    (async () => {
      if (filterType === PV.Filters.type._episodes) {
        const { data } = await clientQueryEpisodes(
          { page: filterPage, podcastId: id, sort: filterSort },
          filterState
        )
        const [newEpisodesListData, newEpisodesListCount] = data
        setEpisodesListData(newEpisodesListData)
        setEpisodesPageCount(calcListPageCount(newEpisodesListCount))
      } else if (filterType === PV.Filters.type._clips) {
        const { data } = await clientQueryClips(
          { page: filterPage, podcastId: id, sort: filterSort },
          filterState
        )
        const [newClipsListData, newClipsListCount] = data
        setClipsListData(newClipsListData)
        setClipsPageCount(calcListPageCount(newClipsListCount))
      }
      scrollToTopOfPageScrollableContent()
    })()
  }, [filterPage, filterSort, filterType])

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PodcastPageHeader podcast={serverPodcast} />
      <PageScrollableContent>
        <div className='row'>
          <div className='column flex-stretch'>
            <PageHeader
              isSubHeader
              primaryOnChange={(selectedItems: any[]) => {
                const selectedItem = selectedItems[0]
                setFilterState({ filterPage: 1, filterSort, filterType: selectedItem.key })
              }}
              primaryOptions={generateTypeOptions(t)}
              primarySelected={filterType}
              sortOnChange={(selectedItems: any[]) => {
                const selectedItem = selectedItems[0]
                setFilterState({ filterPage: 1, filterSort: selectedItem.key, filterType })
              }}
              sortOptions={generateSortOptions(t)}
              sortSelected={filterSort}
              text={pageSubHeader} />
            <List>
              {
                filterType === PV.Filters.type._episodes && (
                  generateEpisodeListElements(episodesListData, serverPodcast)
                )
              }
              {
                filterType === PV.Filters.type._clips && (
                  generateClipListElements(clipsListData, serverPodcast)
                )
              }
            </List>
            <Pagination
              currentPageIndex={filterPage}
              handlePageNavigate={(newPage) => {
                setFilterState({ filterPage: newPage, filterSort, filterType })
              }}
              handlePageNext={() => {
                const newPage = filterPage + 1
                if (newPage <= pageCount) {
                  setFilterState({ filterPage: newPage, filterSort, filterType })
                }
              }}
              handlePagePrevious={() => {
                const newPage = filterPage - 1
                if (newPage > 0) {
                  setFilterState({ filterPage: newPage, filterSort, filterType })
                }
              }}
              pageCount={pageCount} />
          </div>
          <div className='column'>
            <SideContent>
              {/* *TODO* Make the links in About description clickable */}
              <h2>{t('About')}</h2>
              <div className='text'>{serverPodcast.description}</div>
            </SideContent>
          </div>
        </div>
      </PageScrollableContent>
    </>
  )
}

/* Client-Side Queries */

type ClientQueryEpisodes = {
  page?: number
  podcastId?: string
  sort?: string
}

const clientQueryEpisodes = async (
  { page, podcastId, sort }: ClientQueryEpisodes,
  filterState: FilterState
) => {
  const finalQuery = {
    podcastId,
    ...(page ? { page } : { page: filterState.filterPage }),
    ...(sort ? { sort } : { sort: filterState.filterSort })
  }
  return getEpisodesByQuery(finalQuery)
}

type ClientQueryClips = {
  page?: number
  podcastId?: string
  sort?: string
}

const clientQueryClips = async (
  { page, podcastId, sort }: ClientQueryClips,
  filterState: FilterState
) => {
  const finalQuery = {
    podcastId,
    includeEpisode: true,
    ...(page ? { page } : { page: filterState.filterPage }),
    ...(sort ? { sort } : { sort: filterState.filterSort })
  }
  return getMediaRefsByQuery(finalQuery)
}

/* Render Helpers */

const generateTypeOptions = (t: any) => [
  { label: t('Episodes'), key: PV.Filters.type._episodes },
  { label: t('Clips'), key: PV.Filters.type._clips }
]

const generateSortOptions = (t: any) => [
  { label: t('Recent'), key: PV.Filters.sort._mostRecent },
  { label: t('Top - Past Day'), key: PV.Filters.sort._topPastDay },
  { label: t('Top - Past Week'), key: PV.Filters.sort._topPastWeek },
  { label: t('Top - Past Month'), key: PV.Filters.sort._topPastMonth },
  { label: t('Top - Past Year'), key: PV.Filters.sort._topPastYear },
  { label: t('Top - All Time'), key: PV.Filters.sort._topAllTime },
  { label: t('Oldest'), key: PV.Filters.sort._oldest },
  { label: t('Random'), key: PV.Filters.sort._random }
]

const generateEpisodeListElements = (listItems: Episode[], podcast: Podcast) => {
  return listItems.map((listItem, index) =>
    <EpisodeListItem
      episode={listItem}
      key={`${keyPrefix}-${index}`}
      podcast={podcast}
      />
  )
}

const generateClipListElements = (listItems: MediaRef[], podcast: Podcast) => {
  return listItems.map((listItem, index) =>
    <ClipListItem
      mediaRef={listItem}
      podcast={podcast}
      key={`${keyPrefix}-${index}`} />
  )
}

/* Server-Side Logic */

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { locale, params, req } = ctx
  const { cookies } = req
  const { podcastId } = params

  const userInfo = await getServerSideAuthenticatedUserInfo(cookies)

  const serverFilterType = PV.Filters.type._episodes
  const serverFilterSort = PV.Filters.sort._mostRecent
  const serverFilterPage = 1

  const response = await getPodcastById(podcastId as string)
  const podcast = response.data

  let serverEpisodes = []
  let serverEpisodesPageCount = 0
  let serverClips = []
  let serverClipsPageCount = 0
  if (serverFilterType === PV.Filters.type._episodes) {
    const response = await getEpisodesByQuery({
      podcastId: podcastId,
      sort: serverFilterSort
    })
    const [episodesListData, episodesListDataCount] = response.data
    serverEpisodes = episodesListData
    serverEpisodesPageCount = calcListPageCount(episodesListDataCount)
  } else {
    // handle mediaRefs query
  }

  const serverProps: ServerProps = {
    serverUserInfo: userInfo,
    ...(await serverSideTranslations(locale, PV.i18n.fileNames.all)),
    serverCookies: cookies,
    serverClips,
    serverClipsPageCount,
    serverEpisodes,
    serverEpisodesPageCount,
    serverFilterPage,
    serverFilterSort,
    serverFilterType,
    serverPodcast: podcast
  }

  return {
    props: serverProps
  }
}

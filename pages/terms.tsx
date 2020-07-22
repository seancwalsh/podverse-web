import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import Meta from '~/components/Meta/Meta'
import config from '~/config'
import PV from '~/lib/constants'
import { pageIsLoading } from '~/redux/actions'
const { BASE_URL } = config()

type Props = {
  meta?: any
}

type State = {}

class Terms extends Component<Props, State> {

  static async getInitialProps({ req, store }) {
    store.dispatch(pageIsLoading(false))

    const meta = {
      currentUrl: BASE_URL + PV.paths.terms,
      description: PV.pages.terms._Description,
      title: PV.pages.terms._Title
    }

    return { meta }
  }

  render() {
    const { meta } = this.props

    return (
      <Fragment>
        <Meta
          description={meta.description}
          ogDescription={meta.description}
          ogTitle={meta.title}
          ogType='website'
          ogUrl={meta.currentUrl}
          robotsNoIndex={false}
          title={meta.title}
          twitterDescription={meta.description}
          twitterTitle={meta.title} />
        <h3>{PV.pages.terms.TermsOfService}</h3>
        <p>
          {PV.pages.terms.PodverseTerms_1}
        </p>
        <p>
          {PV.pages.terms.PodverseTerms_2}
        </p>
        <p>
          {PV.pages.terms.PodverseTerms_3}
        </p>
        <p>
          {PV.pages.terms.PodverseTerms_4}
        </p>
        <p>
          {PV.pages.terms.PodverseTerms_5}
        </p>
        <p>
          {PV.pages.terms.PodverseTerms_6}
        </p>
        <p>
          {PV.pages.terms.PodverseTerms_7}
        </p>
      </Fragment>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(Terms)
import React from 'react'
import PropTypes from 'prop-types'
import { ApolloProvider, getDataFromTree } from 'react-apollo'
import Head from 'next/head'
import initApollo from './initApollo'

// Gets the display name of a JSX component for dev tools
function getComponentDisplayName(Component) {
  return Component.displayName || Component.name || 'Unknown'
}

export default (appSyncConfig, options) => {
  return (ComposedComponent) => {
    return class WithData extends React.Component {
      static displayName = `WithData(${getComponentDisplayName(
        ComposedComponent
      )})`
      static propTypes = {
        serverState: PropTypes.object.isRequired
      }
  
      static async getInitialProps(ctx) {
        // Initial serverState with apollo (empty)
        let serverState
  
        // Evaluate the composed component's getInitialProps()
        let composedInitialProps = {}
        if (ComposedComponent.getInitialProps) {
          composedInitialProps = await ComposedComponent.getInitialProps(ctx)
        }
  
        // Run all GraphQL queries in the component tree
        // and extract the resulting data
        const apollo = initApollo(null, appSyncConfig, options)
        try {
          // create the url prop which is passed to every page
          const url = {
            query: ctx.query,
            asPath: ctx.asPath,
            pathname: ctx.pathname,
          };
  
          // Run all GraphQL queries
          await getDataFromTree(
            <ComposedComponent ctx={ctx} url={url} {...composedInitialProps} />,
            {
              router: {
                asPath: ctx.asPath,
                pathname: ctx.pathname,
                query: ctx.query
              },
              client: apollo
            }
          )
        } catch (error) {
          // Prevent Apollo Client GraphQL errors from crashing SSR.
          // Handle them in components via the data.error prop:
          // http://dev.apollodata.com/react/api-queries.html#graphql-query-data-error
        }
  
        if (!process.browser) {
          // getDataFromTree does not call componentWillUnmount
          // head side effect therefore need to be cleared manually
          Head.rewind()
        }
  
        // Extract query data from the Apollo store
        serverState = {
          apollo: {
            data: apollo.cache.extract()
          }
        }
  
        return {
          serverState,
          ...composedInitialProps
        }
      }
  
      constructor(props) {
        super(props)
        this.apollo = initApollo(this.props.serverState.apollo.data, appSyncConfig, options)
      }
  
      render() {
        return (
          <ApolloProvider client={this.apollo}>
            <ComposedComponent {...this.props} />
          </ApolloProvider>
        )
      }
    }
  }
}
module.exports = {
  api: {
    cacheRefreshDuration: 60 * 1000 // 1 minute
  },
  airtable: {
    base: 'https://api.airtable.com/v0',
    table: 'apptMNA9Pvrb7Bizk',
    path: {
      highlights: {
        pathname: 'Highlights',
        options: {
          view: 'Grid+view'
        }
      },
      publications: {
        pathname: 'Publications',
        options: {
          view: 'Grid+view'
        }
      },
      members: {
        pathname: 'Members',
        options: {
          view: 'Grid+view'
        }
      },
      gallery: {
        pathname: 'Gallery',
        options: {
          view: 'Grid+view'
        }
      },
      openings: {
        pathname: 'Openings',
        options: {
          view: 'Grid+view'
        }
      }
    }
  }
}
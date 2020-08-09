// dependencies
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

// consts
require('dotenv').config();
const consts = require('./consts');

// macros
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const urlBase = `${consts.airtable.base}/${consts.airtable.table}`;
const headers = { 'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}` };

let lastAirtableCall = 0;
const cmsDataCache = {};

// route
app.get('/cms', async(req, res) => {
  const now = new Date().getTime();
  
  // It's been long enough since we checked the airtable before, so let's call airtable endpoints
  if (now - lastAirtableCall > consts.api.cacheRefreshDuration) {
    console.log('Need to fetch fresh data, generating cache.')
    const endpoints = Object.keys(consts.airtable.path);
    for (const endpoint of endpoints) {
      await new Promise(async (next) => {
        const url = `${urlBase}/${consts.airtable.path[endpoint].pathname}?view=Grid+view`;
        try {
          const response = await axios.default.get(url, { headers });
          cmsDataCache[endpoint] = response.data;
          next();
        } catch (error) {
          console.error(error);
        }
      });
    }

    lastAirtableCall = new Date().getTime();
    res.send(cmsDataCache);
  } else {
    console.log('cache is fresh enough.')
    res.send(cmsDataCache);
  }
});

async function getTableDataWithUrl(url) {
  try {
    const response = await axios.default.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

app.listen(4200, () => {
  console.log('Listening on *:4200');
});
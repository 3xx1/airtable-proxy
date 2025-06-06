// dependencies
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');

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

// refresh cached data per day
const updateDataCache = async () => {
  const endpoints = Object.keys(consts.airtable.path);
  
  const cmsDataCache = {};
  for (const endpoint of endpoints) {
    const url = `${urlBase}/${consts.airtable.path[endpoint].pathname}?view=Grid+view`;
    const response = await axios.default.get(url, { headers });
    cmsDataCache[endpoint] = response.data;
  }

  fs.writeFileSync(consts.api.cacheFilePath, JSON.stringify(cmsDataCache, null, 2));
  return cmsDataCache;
}

// route
app.get('/cms', async(req, res) => {
  const cacheString = fs.readFileSync(consts.api.cacheFilePath, 'utf8');
  const cache = JSON.parse(cacheString) || {};
  if (cache) {
    res.send(cache);
  } else {
    res.status(500).send('CMS cache not found');
  }
});

app.listen(4200, () => {
  console.log('Listening on *:4200');
});

// Update cache for the first run
updateDataCache();

// Update cache every 24 hours
setInterval(() => {
  updateDataCache();
}, consts.api.cacheRefreshDuration);

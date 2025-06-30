// dependencies
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// consts
require('dotenv').config();
const consts = require('./consts');

const cacheImagesDir = './cache-images';

// macros
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const urlBase = `${consts.airtable.base}/${consts.airtable.table}`;
const headers = { 'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}` };

// Download image and save to local
async function downloadImage(url, filePath) {
  const response = await axios.default.get(url, { responseType: 'stream' });
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// refresh cached data per day
const updateDataCache = async () => {
  const endpoints = Object.keys(consts.airtable.path);

  // remove cache file
  // fs.rmSync(cacheImagesDir, { recursive: true, force: true }, (err) => {
  //   if (err) {
  //     console.error('Error removing cache-images directory:', err);
  //   }
  // });
  

  if (fs.existsSync(cacheImagesDir)) {
    for (const file of fs.readdirSync(cacheImagesDir)) {
      fs.rmSync(path.join(cacheImagesDir, file), { recursive: true, force: true });
    }
  } else {
    fs.mkdirSync(cacheImagesDir);
  }
  
  let cmsDataCache = {};
  for (const endpoint of endpoints) {
    const url = `${urlBase}/${consts.airtable.path[endpoint].pathname}?view=Grid+view`;
    const response = await axios.default.get(url, { headers });
    cmsDataCache[endpoint] = response.data;
  }

  // highlight image download
  cmsDataCache['highlights'].records.forEach(async (record) => {
    if (record.fields.thumbnail && record.fields.thumbnail.length > 0) {
      const imageUrl = record.fields.thumbnail[0].url;
      const recordId = record.id;
      if (imageUrl) {
        const filePath = `${cacheImagesDir}/${recordId}.${record.fields.thumbnail[0].type.split('/').pop()}`;
        await downloadImage(imageUrl, filePath);
      }
    }
  });

  // download publication images
  cmsDataCache['publications'].records.forEach(async (record) => {
    if (record.fields.thumbnail && record.fields.thumbnail.length > 0) {
      const imageUrl = record.fields.thumbnail[0].url;
      const recordId = record.id;
      if (imageUrl) {
        const filePath = `${cacheImagesDir}/${recordId}.${record.fields.thumbnail[0].type.split('/').pop()}`;
        await downloadImage(imageUrl, filePath);
      }
    }
  });

  // download members images
  cmsDataCache['members'].records.forEach(async (record) => {
    if (record.fields.portrait && record.fields.portrait.length > 0) {
      const imageUrl = record.fields.portrait[0].url;
      const recordId = record.id;
      if (imageUrl) {
        const filePath = `${cacheImagesDir}/${recordId}_portrait.${record.fields.portrait[0].type.split('/').pop()}`;
        await downloadImage(imageUrl, filePath);
      }
    }

    if (record.fields.cv && record.fields.cv.length > 0) {
      const cvUrl = record.fields.cv[0].url;
      const recordId = record.id;
      if (cvUrl) {
        const filePath = `${cacheImagesDir}/${recordId}_cv.${record.fields.cv[0].type.split('/').pop()}`;
        await downloadImage(cvUrl, filePath);
      }
    }
  });

  // download gallery images
  cmsDataCache['gallery'].records.forEach(async (record) => {
    if (record.fields.image && record.fields.image.length > 0) {
      const imageUrl = record.fields.image[0].url;
      const recordId = record.id;
      if (imageUrl) {
        const filePath = `${cacheImagesDir}/${recordId}.${record.fields.image[0].type.split('/').pop()}`;
        await downloadImage(imageUrl, filePath);
      }
    }
  });

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

// serve cache-images directory
app.use('/cache-images', express.static(cacheImagesDir));

app.listen(4200, () => {
  console.log('Listening on *:4200');
});

// Update cache for the first run
updateDataCache();

// Update cache every 24 hours
setInterval(() => {
  updateDataCache();
}, consts.api.cacheRefreshDuration);

require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

function createHash(data) {
    return crypto.createHash("shake256", { outputLength: 4 })
      .update(data)
      .digest("hex");
}

app.use(bodyParser.urlencoded({extended: false}))

let urls;

fs.readFile('./db.json', 'utf8', (error, data) => {
     if(error){
        console.log(error);
        return;
     }
     urls = JSON.parse(data);
})

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl/', function(req, res){
  try {
    const uri = new URL(req.body.url);
  } catch (error) {
    return res.json({ error: "invalid url" });
  }
  const uri = new URL(req.body.url);
  const prefix = /^https?:\/\//i;
  dns.lookup(uri.hostname, function(err, address, family){
    if(err || !prefix.test(uri.href)){
      res.json({error: "invalid url"})
    }
    
    let hash = createHash(address);
    urls[hash] = uri.href;

    fs.writeFile('./db.json', JSON.stringify(urls, null, 2), (error) => {
      if (error) {
        console.log('An error has occurred ', error);
        return;
      }
      console.log('Data written successfully to disk');
    });
    
    res.json({
      original_url: uri.href,
      short_url: hash,
    })
  })
})

app.get('/api/shorturl/:hash', function(req, res){
  let hash = req.params.hash;
  if(urls.hasOwnProperty(hash)){
    res.redirect(urls[hash])
  }else{
    res.json({error: "No short URL found for the given input"})
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

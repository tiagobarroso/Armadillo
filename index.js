var express = require('express');
const { Parser } = require('json2csv');
var scrap = require('./modules/scrap');

var app = express();

app.use(express.json())
app.use(express.urlencoded({extended: true}));

app.get('/*', (req, res) => {
    res.sendFile(req.url, { root : `${__dirname}/views` });
});

app.post('/api/process', async (req, res) => {
    
    if(req.body && req.body.urls){

        let  lines = await scrap.scrapUrls(req.body.urls);

        const parser = new Parser({delimiter: ';'});
        const csv = parser.parse(lines);

        res.attachment('filename.csv');
        res.status(200).send(csv);
    }

    return res.status(200).send();
});

app.listen({ port: process.env.PORT || 8000 });

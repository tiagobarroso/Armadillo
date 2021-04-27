var pupe = require('puppeteer');
const cheerio = require('cheerio');

let browser = null;
let page = null;

const fieldConfigs = [
        { 
            field : "tipo",
            selector: 'body > div.main > div.s-d-l-m > div.s-d-l1 > div.s-d-ld > div.s-d-ld-i-main > div.s-d-ld-i3.f-d > div:nth-child(1) > p:nth-child(1) > a'
        },
        { 
            field : "areaTotal",
            selector: 'body > div.main > div.s-d-l-m > div.s-d-l1 > div.s-d-ld > div.s-d-ld-i-main > div.s-d-ld-i3.f-d',
            findWhereContentHas: 'm2',
            removeStrings: ['<span>Área Total:</span>', 'm2'],
            onlyNumbers: true
        },
        { 
            field : "cidade",
            selector: '.s-d-ld-i2',
            getStrBtw : { first: 'Endereço: ', second: '/'}
        },
        { 
            field : "bairro",
            selector: 'body > div.main > div.s-d-l-m > div.l-cab > ol > li:nth-child(9) > a > span'
        },
        { 
            field : "primeiroLeilao",
            selector: 'body > div.main > div.s-d-l-m > div.s-d-il > div.s-d-il-i-main.f-d > p:nth-child(1)'
        },
        { 
            field : "segundoLeilao",
            selector: 'body > div.main > div.s-d-l-m > div.s-d-il > div.s-d-il-i-main.f-d > p:nth-child(2)'
        },
        { 
            field : "leiloeiro",
            selector: 'body > div.main > div.s-d-l-m > div.s-d-l1 > div.s-d-lb > div.s-d-lb1 > div.d-n-v > h2'
        }
];

const scrapUrl = async (url) => {

    await page.goto(url, {waitUntil: 'load', timeout: 0});

    let bodyHTML = await page.evaluate(() =>  document.documentElement.outerHTML);
    const $ = cheerio.load(bodyHTML);

    let obj = {};

    for(let field of fieldConfigs){
    
        var elements = await $(field.selector);

        if(!elements || elements.length == 0){
            obj[field.field] = '';
            continue;
        }

        if(field.findWhereContentHas){
            
            let ps = elements.find('p');

            let elth = ps.toArray().find(e => $(e).text().includes(field.findWhereContentHas));

            if(elth){
                elements = $(elth);
            }else{
                obj[field.field] = '';
                continue;
            }            
        }

        let value = elements.text();

        if(field.removeStrings){

            for(let strToRemove of field.removeStrings){
                value = value.replace(strToRemove, '');
            }
        }

        if(field.onlyNumbers){
            value = value.replace(/\D/g, "");
        }

        if(field.getStrBtw){
            value = getStringBetween(value, field.getStrBtw.first, field.getStrBtw.second);
        }

        obj[field.field] = value;
    }

    return obj;
}

const getElem = async (selector) => {
    return await page.$$(selector);
}

const scrapUrls = async (urls) => {

    browser = await pupe.launch({headless: true});
    page = await browser.newPage();

    let csvLines = [];
    for(let url of urls){
        csvLines.push(await scrapUrl(url));
    }

    browser.close();

    return csvLines;
}

const getStringBetween = (str, first, second) => {
    return  str.substring(
        str.lastIndexOf(first) + 1, 
        str.lastIndexOf(second)
    );
}

module.exports = {
    scrapUrl,
    scrapUrls
}

//https://www.zukerman.com.br/apartamento-universitario-caruaru-pe-21681-154052
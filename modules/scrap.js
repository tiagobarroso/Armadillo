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
            findWhereContentHas: { value: 'm2', tag : 'p'},
            getStrBtw : { first: ': ', second: 'm2'}
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
            field : "primeiroLeilaoData",
            selector: 'body > div.main > div.s-d-l-m > div.s-d-il > div.s-d-il-i-main.f-d > p:nth-child(1)',
            findWhereContentHas: { value:'1º Leilão'},
            getStrBtw : { first: '1º Leilão:', second: 'às'}
        },
        { 
            field : "primeiroLeilaoValor",
            selector: 'body > div.main > div.s-d-l-m > div.s-d-il > div.s-d-il-i-main.f-d > p:nth-child(1)',
            findWhereContentHas: { value:'1º Leilão'},
            getStrBtw : { first: ' R$'}
        },
        { 
            field : "segundoLeilaoData",
            selector: 'body > div.main > div.s-d-l-m > div.s-d-il > div.s-d-il-i-main.f-d > p:nth-child(2)',
            findWhereContentHas: { value:'2º'},
            getStrBtw : { first: '2º Leilão:', second: 'às'}
        },
        { 
            field : "segundoLeilaoValor",
            selector: 'body > div.main > div.s-d-l-m > div.s-d-il > div.s-d-il-i-main.f-d > p:nth-child(2)',
            findWhereContentHas: { value:'2º'},
            getStrBtw : { first: ' R$'},
            removeStrings: ['(* O 2º Leilão somente ocorrerá se não for vendido em 1º Leilão )']
        },
        { 
            field : "leiloeiro",
            selector: 'body > div.main > div.s-d-l-m > div.s-d-l1 > div.s-d-lb > div.s-d-lb1 > div.d-n-v > h2'
        }
];

const fieldConfigs2 = [
    { 
        field : "primeiroLeilaoData",
        selector: 'body > div.main > div.s-d-l-m > div.s-d-il > div.s-d-il-i-main.f-d',
        findWhereContentHas: { value:'Data:'},
        getStrBtw : { first: 'Data:', second: 'às'}
    },
    { 
        field : "primeiroLeilaoValor",
        selector: 'body > div.main > div.s-d-l-m > div.s-d-il > div.s-d-il-i-main.f-d',
        findWhereContentHas: { value:'Data:'},
        getStrBtw : { first: ' R$', second: ',00'}
    }
];

const fieldConfigs3 = [
    { 
        field : "primeiroLeilaoData",
        selector: 'body > div.main > div.s-d-l-m > div.s-d-il > div.s-d-il-i-main.f-d',
        findWhereContentHas: { value:'1ª Praça:', tag: 'p'},
        getStrBtw : { first: '1ª Praça:', second: 'às'}
    },
    { 
        field : "primeiroLeilaoValor",
        selector: 'body > div.main > div.s-d-l-m > div.s-d-il > div.s-d-il-i-main.f-d',
        findWhereContentHas: { value:'1ª Praça:', tag: 'p'},
        getStrBtw : { first: ' R$'}
    },
    { 
        field : "segundoLeilaoData",
        selector: 'body > div.main > div.s-d-l-m > div.s-d-il > div.s-d-il-i-main.f-d',
        findWhereContentHas: { value:'2ª Praça:', tag: 'p'},
        getStrBtw : { first: '2ª Praça:', second: 'às'}
    },
    { 
        field : "segundoLeilaoValor",
        selector: 'body > div.main > div.s-d-l-m > div.s-d-il > div.s-d-il-i-main.f-d',
        findWhereContentHas: { value:'2ª Praça:', tag: 'p'},
        getStrBtw : { first: ' R$'}
    }
];

const scrapUrl = async (url) => {

    await page.goto(url, { timeout: 0});

    let bodyHTML = await page.evaluate(() =>  document.documentElement.outerHTML);
    const $ = cheerio.load(bodyHTML);

    let obj = {};

    for(let field of fieldConfigs){
    
        var value = await sniff($, field);

        if(!value){
            let fallback = fieldConfigs2.find(f2 => f2.field == field.field);

            if(fallback){
                value = await sniff($, fallback);
            }                

            if(!value){
                fallback = fieldConfigs3.find(f3 => f3.field == field.field);

                if(fallback){
                    value = await sniff($, fallback);
                }
            }
        }

        obj[field.field] = value;
    }

    return obj;
}

const sniff = async ($, field) => {

    var elements = await $(field.selector);

        if(!elements || elements.length == 0){
            return '';
        }

        if(field.findWhereContentHas){
            
            if(field.findWhereContentHas.tag)
                elements = elements.find(field.findWhereContentHas.tag);

            let elth = elements.toArray().find(e => $(e).text().includes(field.findWhereContentHas.value));

            if(elth){
                elements = $(elth);
            }else{
                return '';
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

        return  value;
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
        str.indexOf(first) + first.length, 
        second ? str.indexOf(second) : str.length
    );
}

module.exports = {
    scrapUrl,
    scrapUrls
}

//https://www.zukerman.com.br/apartamento-universitario-caruaru-pe-21681-154052
const machine = require('machine');
const moment = require('moment');
const yauzl = require('yauzl');
const got = require('got');
const fs = require('fs');
const csv = require('csv');
const util = require('util');
const mysql = require('mysql');

let date = moment().format("DD"),
    month = moment().format("MMM").toUpperCase(),
    year = moment().format("YYYY"),
    today = moment().format("YYYY-MM-DD");

let filename = "cm" + date + month + year + "bhav.csv",
    directory = ".tmp/bhavcopy/";
    
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'panda',
    database: 'investnreap'
});

connection.connect = util.promisify(connection.connect);
connection.query = util.promisify(connection.query);
connection.end = util.promisify(connection.end);

util.inspect.defaultOptions = {
    colors: true
};
    
const clearData = async function () {
    
    const query = "delete from bhavcopy where date = '" + today + "'";
    await connection.query(query);
    return true;
}

const processFile = async function () {
    
    try {
        
        let csvdata = fs.readFileSync(directory + filename);
        let query = "insert into bhavcopy (symbol, series, open, high, low, close, last, tottrdqty, tottrdval, totaltrades, date) VALUES ?";
    
        let csv_parse = util.promisify(csv.parse);
        let data = await csv_parse(csvdata);
        insertdata = [];
        
        for (let i = 1; i < data.length; i++) {
            
            insertdata.push([
                data[i][0],
                data[i][1],
                data[i][2],
                data[i][3],
                data[i][4],
                data[i][5],
                data[i][6],
                data[i][8],
                data[i][9],
                data[i][11],
                today,
            ]);
        }
        await connection.query(query, [insertdata]);
        
        fs.unlinkSync(directory + filename);
        fs.unlinkSync(directory + filename + '.zip');
        
    } catch (err) {
        console.trace(err);
    }
};

const findPotentials = async function () {
  
    try {
        
        let companiesquery = 'select c.name, c.symbol from companies c inner join index_companies ic on ic.company_id = c.id inner join indexes i on ic.index_id = i.id where i.name = ?';
        let bhavcopyquery = "select close, date from bhavcopy where symbol = ? and series = 'EQ' order by date desc limit 5";
        
        let companies = await connection.query(companiesquery, ['Nifty 50']);
        
        let date;
        
        for (let row of companies) {
            
            let bhavcopy = await connection.query(bhavcopyquery, [row.symbol]);
            let close = bhavcopy[0].close, bullish = false, bearish = false;
            let prices = {};
            date = moment(bhavcopy[0].date).format("YYYY-MM-DD");
            prices[date] = bhavcopy[0].close;
            
            for (let j = 1; j < bhavcopy.length; j++) {
                
                if (close < bhavcopy[j].close) {
                    bearish = true;
                } else if (close > bhavcopy[j].close) {
                    bullish = true;
                }
                
                date = moment(bhavcopy[j].date).format("YYYY-MM-DD");
                prices[date] = bhavcopy[j].close;
                close = bhavcopy[j].close;
            }
            
            if (bullish && !bearish) {
                console.log(util.format("%s [%s]: BULLISH\n\t%j\n", row.name, row.symbol, prices));
            } else if (!bullish && bearish) {
                console.log(util.format("%s [%s]: BEARISH\n\t%j\n", row.name, row.symbol, prices));
            }
        }
        
    } catch (err) {
        console.trace(err);
    }
};

const callable = machine({
    
    identity: 'bhavcopy',
    fn: async function (inputs, exits) {
        
        let url = "https://www.nseindia.com/content/historical/EQUITIES/" + year + "/" + month + "/" + filename + '.zip';
        
        await clearData();
        
        let download = got.stream(url).pipe(fs.createWriteStream(directory + filename + '.zip'));
        
        download.on('finish', function () {
            
            yauzl.open(directory + filename + '.zip', function (err, zipfile) {

                if (err) {
                    console.trace(err);
                    return;
                }

                zipfile.on('entry', function (entry) {
                    zipfile.openReadStream(entry, function (err, readStream) {
                        if (err) {
                            console.trace(err);
                            return;
                        }
                        let unzip = readStream.pipe(fs.createWriteStream(directory + filename));
                        
                        unzip.on('finish', async function () {
                            
                            await processFile();
                            await findPotentials();
                            await connection.end();
                        });
                    });

                });
            });
            
        });
        
        return exits.success(true);
    }
});

(async function () {
    
    try {
        await connection.connect();
        await callable();
    } catch (err) {
        console.trace(err);
    }
    
})();
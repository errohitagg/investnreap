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
                            await connection.end();
                            console.log("Data Generated");
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
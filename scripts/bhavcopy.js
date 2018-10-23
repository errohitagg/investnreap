const machine = require('machine');
const moment = require('moment');
const yauzl = require('yauzl');
const got = require('got');
const fs = require('fs');
const csv = require('csv');
const util = require('util');
const mysql = require('mysql');
const process = require('process');

let date = moment().format("DD"),
    month = moment().format("MMM").toUpperCase(),
    year = moment().format("YYYY"),
    today = moment().format("YYYY-MM-DD");

let filename = "cm" + date + month + year + "bhav.csv",
    directory = ".tmp/bhavcopy/";
    
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'coulomb',
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

const callable = machine({
    
    identity: 'bhavcopy',
    fn: async function (inputs, exits) {
        
        let url = "https://www.nseindia.com/content/historical/EQUITIES/" + year + "/" + month + "/" + filename + '.zip';
        
        await clearData();
        
        let stream = got.stream(url);
        
        stream.on('error', async function (error, body, response) {
           
            console.log("Status Code : " + error.statusCode);
            console.log("URL : " + error.url);
            await connection.end();
        });
        
        let download = stream.pipe(fs.createWriteStream(directory + filename + '.zip'));
        
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
        
        let args = process.argv;
        if (args.length > 2) {
            
            let inputDate = moment(args[2]);
            date = inputDate.format("DD");
            month = inputDate.format("MMM").toUpperCase();
            year = inputDate.format("YYYY");
            today = inputDate.format("YYYY-MM-DD");
            filename = "cm" + date + month + year + "bhav.csv";
        }
        
        await connection.connect();
        await callable();
    } catch (err) {
        console.trace(err);
    }
    
})();

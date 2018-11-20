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
    monthint = moment().format("MM"),
    year = moment().format("YYYY"),
    today = moment().format("YYYY-MM-DD");
    
let filename = "cm" + date + month + year + "bhav.csv",
    index_filename = 'ind_close_all_' + date + monthint + year + '.csv',
    directory = "/opt/my-work/investnreap/.tmp/bhavcopy/";
    
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

const clearIndexData = async function () {

    const query = "delete from index_snapshot where date = '" + today + "'";
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

const processIndexFile = async function () {
    
    try {
        
        let indexlist = {};
        let indexquery = "select * from indexes";
        let indexresult = await connection.query(indexquery);
        for (let row of indexresult) {
            indexlist[row.name] = row.id;
        }
        
        let csvdata = fs.readFileSync(directory + index_filename);
        let query = "insert into index_snapshot (index_id, open, high, low, close, date) VALUES ?";

        let csv_parse = util.promisify(csv.parse);
        let data = await csv_parse(csvdata);
        insertdata = [];

        for (let i = 1; i < data.length; i++) {

            if (indexlist[data[i][0]] !== undefined) {
                insertdata.push([
                    indexlist[data[i][0]],
                    data[i][2],
                    data[i][3],
                    data[i][4],
                    data[i][5],
                    today
                ]);
            }
        }
        await connection.query(query, [insertdata]);

        fs.unlinkSync(directory + index_filename);
        
    } catch (err) {
        console.trace(err);
    }
}

const callable1 = machine({
    
    identity: 'bhavcopy',
    fn: async function (inputs, exits) {
        
        let url = "https://www.nseindia.com/content/historical/EQUITIES/" + year + "/" + month + "/" + filename + '.zip';
        
        await clearData();
        
        await new Promise(function (resolve, reject) {
           
            let stream = got.stream(url);

            stream.on('error', async function (error, body, response) {

                console.log("Status Code : " + error.statusCode);
                console.log("URL : " + error.url);
                return reject();
            });

            let download = stream.pipe(fs.createWriteStream(directory + filename + '.zip'));

            download.on('finish', function () {

                yauzl.open(directory + filename + '.zip', function (err, zipfile) {

                    if (err) {
                        console.trace(err);
                        return reject();
                    }

                    zipfile.on('entry', function (entry) {
                        zipfile.openReadStream(entry, function (err, readStream) {
                            if (err) {
                                console.trace(err);
                                return reject();
                            }
                            let unzip = readStream.pipe(fs.createWriteStream(directory + filename));

                            unzip.on('finish', async function () {
                                await processFile();
                                return resolve();
                            });
                        });

                    });
                });

            });
        });
        
        return exits.success(true);
    }
});

const callable2 = machine({

    identity: 'indexcopy',
    fn: async function (inputs, exits) {

        let url = "http://www.niftyindices.com/Daily_Snapshot/" + index_filename;

        await clearIndexData();
        
        await new Promise(function (resolve, reject) {
            
            let stream = got.stream(url);

            stream.on('error', function (error, body, response) {

                console.log("Status Code : " + error.statusCode);
                console.log("URL : " + error.url);
                return reject();
            });

            let download = stream.pipe(fs.createWriteStream(directory + index_filename));

            download.on('finish', async function () {
                
                await processIndexFile();
                return resolve();
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
            monthint = inputDate.format("MM");
            year = inputDate.format("YYYY");
            today = inputDate.format("YYYY-MM-DD");
            filename = "cm" + date + month + year + "bhav.csv";
            index_filename = 'ind_close_all_' + date + monthint + year + '.csv';
        }
        
        await connection.connect();
        
        await callable1();
        await callable2();
        
        if (connection.threadId) {
            await connection.end();
        }
        
    } catch (err) {
        
        console.trace(err);
        if (connection.threadId) {
            await connection.end();
        }
    }
    
})();

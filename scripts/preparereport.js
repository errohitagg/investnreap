const machine = require('machine');
const moment = require('moment');
const util = require('util');
const mysql = require('mysql');

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

const findBhavTrend = async function (symbol, date, limit) {
    
    let bhavcopyquery = "select close, date from bhavcopy where symbol = ? and series = 'EQ' and date <= ? order by date desc limit ?";
    let bhavcopy = await connection.query(bhavcopyquery, [symbol, date, limit]);
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
        return "BULLISH";
    } else if (!bullish && bearish) {
        return "BEARISH";
    } else {
        return null;
    }
}

const reportLongTrend = async function (date) {
    
    try {

        let companiesquery = 'select c.name, c.symbol from companies c inner join index_companies ic on ic.company_id = c.id inner join indexes i on ic.index_id = i.id where i.name = ?';
        let companies = await connection.query(companiesquery, ['Nifty 50']);

        for (let row of companies) {

            let result1 = await findBhavTrend(row.symbol, date, 5),
                result2 = await findBhavTrend(row.symbol, date, 10),
                result3 = await findBhavTrend(row.symbol, date, 30);

            if (result1 != null || result2 != null || result3 != null) {
                console.log(util.format("%s [%s]", row.name, row.symbol));
                if (result1) {
                    console.log(util.format("\t%s in 5 days", result1));
                }
                if (result2) {
                    console.log(util.format("\t%s in 10 days", result2));
                }
                if (result3) {
                    console.log(util.format("\t%s in 30 days", result3));
                }
                console.log();
            }
        }

    } catch (err) {
        console.trace(err);
    }
}

const reportShortTrend = async function (date) {
    
    try {

        let companiesquery = 'select c.name, c.symbol from companies c inner join index_companies ic on ic.company_id = c.id inner join indexes i on ic.index_id = i.id where i.name = ?';
        let companies = await connection.query(companiesquery, ['Nifty 50']);

        for (let row of companies) {

            let result1 = await findBhavTrend(row.symbol, date, 7),
                result2 = await findBhavTrend(row.symbol, date, 10),
                result3 = await findBhavTrend(row.symbol, date, 15);
            
            if (result1 != null || result2 != null || result3 != null) {
                console.log(util.format("%s [%s]", row.name, row.symbol));
                if (result1) {
                    console.log(util.format("\t%s in 7 days", result1));
                }
                if (result2) {
                    console.log(util.format("\t%s in 10 days", result2));
                }
                if (result3) {
                    console.log(util.format("\t%s in 15 days", result3));
                }
                console.log();
            }
        }

    } catch (err) {
        console.trace(err);
    }
};

const callable = machine({

    identity: 'prepare report',
    fn: async function (inputs, exits) {

        await reportShortTrend(moment().format("YYYY-MM-DD"));
        await reportLongTrend(moment().format("YYYY-MM-DD"));
        await connection.end();
        
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

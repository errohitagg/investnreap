const machine = require('machine');
const moment = require('moment');
const util = require('util');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const fs = require('fs');

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'coulomb',
    password: 'panda',
    database: 'investnreap'
});

let directory = '.tmp/monthly-trend/',
    filename = 'monthly-trend-' + moment().format("YYYY_MM_DD") + '.xlsx';

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
    
    var finalResult = [];
    try {

        let companiesquery = 'select c.name, c.symbol from companies c inner join index_companies ic on ic.company_id = c.id inner join indexes i on ic.index_id = i.id where i.name = ?';
        let companies = await connection.query(companiesquery, ['Nifty 50']);

        for (let row of companies) {

            let result1 = await findBhavTrend(row.symbol, date, 5),
                result2 = await findBhavTrend(row.symbol, date, 10),
                result3 = await findBhavTrend(row.symbol, date, 30);

            if (result1 != null || result2 != null || result3 != null) {
                finalResult.push({
                    name: row.name,
                    symbol: row.symbol,
                    five: result1,
                    ten: result2,
                    thirty: result3
                });
            }
        }

    } catch (err) {
        console.trace(err);
    }
    return finalResult;
}

const reportShortTrend = async function (date) {
    
    var finalResult = [];
    try {

        let companiesquery = 'select c.name, c.symbol from companies c inner join index_companies ic on ic.company_id = c.id inner join indexes i on ic.index_id = i.id where i.name = ?';
        let companies = await connection.query(companiesquery, ['Nifty 50']);

        for (let row of companies) {

            let result1 = await findBhavTrend(row.symbol, date, 5),
                result2 = await findBhavTrend(row.symbol, date, 7),
                result3 = await findBhavTrend(row.symbol, date, 10);
            
            if (result1 != null || result2 != null || result3 != null) {
                finalResult.push({
                    name: row.name,
                    symbol: row.symbol,
                    five: result1,
                    seven: result2,
                    ten: result3
                });
            }
        }

    } catch (err) {
        console.trace(err);
    }
    return finalResult;
};

var mailTrends = function (shortTrend, longTrend) {
    
    var mailhtml = "";
    mailhtml += "<h1>Short Trend:</h1>";
    if (shortTrend.length > 0) {
        mailhtml += "<table cellspacing='1' cellpadding='1' border='1'>";
        mailhtml += "<tr>";
        mailhtml += "<th>Company</th>";
        mailhtml += "<th>Symbol</th>";
        mailhtml += "<th>5 days</th>";
        mailhtml += "<th>7 days</th>";
        mailhtml += "<th>10 days</th>";
        mailhtml += "</tr>";
        for (let trend of shortTrend) {
            mailhtml += "<tr>";
            mailhtml += "<td>" + trend.name + "</td>";
            mailhtml += "<td>" + trend.symbol + "</td>";
            mailhtml += "<td>" + (trend.five != null ? trend.five : '-') + "</td>";
            mailhtml += "<td>" + (trend.seven != null ? trend.seven : '-') + "</td>";
            mailhtml += "<td>" + (trend.ten != null ? trend.ten : '-') + "</td>";
            mailhtml += "</tr>";
        }
        mailhtml += "</table >";
    } else {
        mailhtml += "<p>No particular short trend</p>";
    }
    
    mailhtml += "<h1>Long Trend:</h1>";
    if (shortTrend.length > 0) {
        mailhtml += "<table cellspacing='1' cellpadding='1' border='1'>";
        mailhtml += "<tr>";
        mailhtml += "<th>Company</th>";
        mailhtml += "<th>Symbol</th>";
        mailhtml += "<th>5 days</th>";
        mailhtml += "<th>10 days</th>";
        mailhtml += "<th>30 days</th>";
        mailhtml += "</tr>";
        for (let trend of shortTrend) {
            mailhtml += "<tr>";
            mailhtml += "<td>" + trend.name + "</td>";
            mailhtml += "<td>" + trend.symbol + "</td>";
            mailhtml += "<td>" + (trend.five != null ? trend.five : '-') + "</td>";
            mailhtml += "<td>" + (trend.ten != null ? trend.ten : '-') + "</td>";
            mailhtml += "<td>" + (trend.thirty != null ? trend.thirty : '-') + "</td>";
            mailhtml += "</tr>";
        }
        mailhtml += "</table >";
    } else {
        mailHtml += "<p>No particular long trend</p>";
    }
    
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: "rohit.playground@gmail.com",
            pass: "Gmail@251189"
        }
    });

    let mailOptions = {
        from: '"Rohit Aggarwal" <rohit.playground@gmail.com>',
        to: 'er.rohitaggarwal1989@gmail.com, prateek.varshney10@gmail.com',
        subject: 'Aggregated Trend Report - Nifty50',
        html: mailhtml,
        attachments: [
            {
                filename: filename,
                path: directory + filename
            }
        ]
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        
        fs.unlinkSync(directory + filename);
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}

const callable = machine({

    identity: 'prepare report',
    fn: async function (inputs, exits) {

        var shorttrend = await reportShortTrend(moment().format("YYYY-MM-DD"));
        var longtrend = await reportLongTrend(moment().format("YYYY-MM-DD"));
        mailTrends(shorttrend, longtrend);
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

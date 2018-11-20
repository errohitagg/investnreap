const machine = require('machine');
const moment = require('moment');
const util = require('util');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const fs = require('fs');
const _ = require('lodash');

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'coulomb',
    password: 'panda',
    database: 'investnreap'
});

var shortTrendIn = [3, 5, 7],
    longTrendIn = [7, 10, 12];

let directory = '/opt/my-work/investnreap/.tmp/monthly-trend/',
    filename = 'monthly-trend-' + moment().format("YYYY_MM_DD") + '.xlsx';

connection.connect = util.promisify(connection.connect);
connection.query = util.promisify(connection.query);
connection.end = util.promisify(connection.end);

util.inspect.defaultOptions = {
    colors: true
};

const findBhavTrend = async function (symbol, date, limit) {
    
    let bhavcopyquery = "select close, date from bhavcopy where symbol = ? and series = 'EQ' and date <= ? order by date desc limit ?";
    let bhavcopy = await connection.query(bhavcopyquery, [symbol, date, limit + 1]);
    let close = bhavcopy[0].close, bullish = false, bearish = false;
    let prices = {};
    
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

const reportTrend = async function (date, trendList) {
    
    var finalResult = [];
    try {

        let companiesquery = 'select c.name, c.symbol from companies c inner join index_companies ic on ic.company_id = c.id inner join indexes i on ic.index_id = i.id where i.name = ? and ic.status = ?';
        let companies = await connection.query(companiesquery, ['Nifty 50', 1]);

        for (let row of companies) {
            
            let trend = [];
            for (let trendIn of trendList) {
                let result = await findBhavTrend(row.symbol, date, trendIn);
                trend.push(result);
            }
            let trendResult = _.reduce(trend, function (sum, val) {
                return sum + (val != null ? 1 : 0);
            }, 0);
            if (trendResult > 0) {
                finalResult.push({
                    name: row.name,
                    symbol: row.symbol,
                    trend: trend
                });
            }
        }

    } catch (err) {
        console.trace(err);
    }
    return finalResult;
}

var mailTrends = function (shortTrend, longTrend) {
    
    var mailhtml = "";
    mailhtml += "<h1>Short Trend:</h1>";
    if (shortTrend.length > 0) {
        mailhtml += "<table cellspacing='1' cellpadding='1' border='1'>";
        mailhtml += "<tr>";
        mailhtml += "<th>Company</th>";
        mailhtml += "<th>Symbol</th>";
        for (let trendIn of shortTrendIn) {
            mailhtml += "<th>" + trendIn + " days</th>";
        }
        mailhtml += "</tr>";
        for (let trend of shortTrend) {
            mailhtml += "<tr>";
            mailhtml += "<td>" + trend.name + "</td>";
            mailhtml += "<td>" + trend.symbol + "</td>";
            for (let i = 0; i < shortTrendIn.length; i++) {
                mailhtml += "<td>" + (trend.trend[i] != null ? trend.trend[i] : '-') + "</td>";
            }
            mailhtml += "</tr>";
        }
        mailhtml += "</table >";
    } else {
        mailhtml += "<p>No particular short trend</p>";
    }
    
    mailhtml += "<h1>Long Trend:</h1>";
    if (longTrend.length > 0) {
        mailhtml += "<table cellspacing='1' cellpadding='1' border='1'>";
        mailhtml += "<tr>";
        mailhtml += "<th>Company</th>";
        mailhtml += "<th>Symbol</th>";
        for (let trendIn of longTrendIn) {
            mailhtml += "<th>" + trendIn + " days</th>";
        }
        mailhtml += "</tr>";
        for (let trend of longTrend) {
            mailhtml += "<tr>";
            mailhtml += "<td>" + trend.name + "</td>";
            mailhtml += "<td>" + trend.symbol + "</td>";
            for (let i = 0; i < longTrendIn.length; i++) {
                mailhtml += "<td>" + (trend.trend[i] != null ? trend.trend[i] : '-') + "</td>";
            }
            mailhtml += "</tr>";
        }
        mailhtml += "</table >";
    } else {
        mailhtml += "<p>No particular long trend</p>";
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

        var shorttrend = await reportTrend(moment().format("YYYY-MM-DD"), shortTrendIn);
        var longtrend = await reportTrend(moment().format("YYYY-MM-DD"), longTrendIn);
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

const machine = require('machine');
const moment = require('moment');
const util = require('util');
const mysql = require('mysql');
const _ = require('lodash');
const xl = require('excel4node');
const fs = require('fs');

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'coulomb',
    password: 'panda',
    database: 'investnreap'
});

let directory = '/opt/my-work/investnreap/.tmp/monthly-trend/',
    filename = 'monthly-trend-' + moment().format("YYYY_MM_DD") + '.xlsx';

connection.connect = util.promisify(connection.connect);
connection.query = util.promisify(connection.query);
connection.end = util.promisify(connection.end);

util.inspect.defaultOptions = {
    colors: true
};

const findMonthlyTrend = async function (symbol, date) {

    let startdate = moment(date);
    startdate.subtract(1, 'days');
    
    startdate = startdate.format("YYYY-MM-DD");
    
    let monthlyquery = "select close, date from bhavcopy where symbol = ? and series = 'EQ' and date >= ? order by date asc";
    let bhavcopy = await connection.query(monthlyquery, [symbol, startdate]);
    let data = [], outputdate;
    
    data.push({
        date: moment(bhavcopy[0].date).format("YYYY-MM-DD"),
        close: bhavcopy[0].close
    });
    let lastvalue = bhavcopy[0].close;
    
    for (let j = 1; j < bhavcopy.length; j++) {
        
        data.push({
            date: moment(bhavcopy[j].date).format("YYYY-MM-DD"),
            close: bhavcopy[j].close,
            change: lastvalue < bhavcopy[j].close ? 1 : (lastvalue > bhavcopy[j].close ? -1 : 0)
        });
        lastvalue = bhavcopy[j].close;
    }
    
    return data;
}

const reportMonthlyTrend = async function (date, month) {

    try {
        
        let startdate = moment(date);
        startdate.subtract(month, 'months');
        
        let indexquery = 'select s.date, s.close from index_snapshot as s inner join indexes as i on i.id = s.index_id where i.name = ? and s.date >= ? order by s.date asc';
        let indexes = await connection.query(indexquery, ['Nifty 50', startdate.format("YYYY-MM-DD")]);
        
        let companiesquery = 'select c.name, c.symbol from companies c inner join index_companies ic on ic.company_id = c.id inner join indexes i on ic.index_id = i.id where i.name = ? and ic.status = ?';
        let companies = await connection.query(companiesquery, ['Nifty 50', 1]);
        
        let datesquery = 'select distinct date from bhavcopy where date >= ? order by date asc';
        let dates = await connection.query(datesquery, [startdate.format("YYYY-MM-DD")]);
        
        let resultdata = [
            {
                name: "Name",
                symbol: "Symbol",
                positives: "Positives",
                negatives: "Negatives"
            }
        ];
        
        for (let date of dates) {
            date = moment(date.date).format("YYYY-MM-DD");
            resultdata[0][date] = date;
        }
        
        let resultset = {
            name: "Nifty 50",
            symbol: "",
            positives: "",
            negatives: ""
        }
        for (let row of indexes) {
            let indexdate = moment(row.date).format("YYYY-MM-DD");
            resultset[indexdate] = row.close;
        }
        resultdata.push(resultset);
        
        for (let row of companies) {

            let result = await findMonthlyTrend(row.symbol, startdate);
            let positive = _.sumBy(result, function (data) {
                return data.change > 0 ? 1 : 0;
            });
            let negative = _.sumBy(result, function (data) {
                return data.change < 0 ? 1 : 0;
            });
            
            let resultset = {
                name: row.name,
                symbol: row.symbol,
                positives: positive,
                negatives: negative
            }
            
            for (let data of result) {
                resultset[data.date] = data.close;
            }
            resultdata.push(resultset);
        }
        
        return resultdata;

    } catch (err) {
        console.trace(err);
    }
};

const reportTradedTrend = async function (date, month) {
    
    try {
        
        let startdate = moment(date), enddate = moment(date);
        startdate.subtract(month, 'months');
        let dates = [];
        
        do {
            
            let checkquery = "select date from index_snapshot where date <= ? order by date desc limit 1";
            let checkdate = await connection.query(checkquery, [enddate.format("YYYY-MM-DD")]);
            
            if (checkdate && checkdate[0]) {
                dates.push(checkdate[0].date);
            }
            enddate.subtract(20, 'days');
            
        } while (startdate < enddate);
        
        let tradedquery = 'select c.id, c.name, c.symbol, s.name as sector from companies c inner join sectors s on c.sector_id = s.id where c.traded = ?';
        let tradedcompanies = await connection.query(tradedquery, [1]);
        
        let result = [
            {
                company: "Company Name",
                symbol: "Symbol",
                sector: "Sector"
            }
        ];
        
        for (let date of dates) {
            date = moment(date).format("YYYY-MM-DD");
            result[0][date] = date;
        }
        
        for (let company of tradedcompanies) {
            
            let bhavquery = 'select close, date from bhavcopy where symbol = ? and series = ? and date in (?)';
            let bhavs = await connection.query(bhavquery, [company.symbol, 'EQ', dates]);
            
            let resultdata = {
                company: company.name,
                symbol: company.symbol,
                sector: company.sector
            };
            
            for (let bhav of bhavs) {
                date = moment(bhav.date).format("YYYY-MM-DD");
                resultdata[date] = bhav.close;
            }
            result.push(resultdata);
        }
        
        return result;

    } catch (err) {
        console.trace(err);
    }
}

const prepareReport = machine({
    
    identity: 'prepare report',
    inputs: {
        monthlyTrend: {
            type: 'ref',
            required: true
        },
        tradedTrend: {
            type: 'ref',
            required: true
        }
    },
    fn: async function (inputs, exits) {
        
        let workbook = new xl.Workbook();
        let monthlysheet = workbook.addWorksheet('MonthTrend');

        let negativeStyle = workbook.createStyle({
            fill: {
                type: 'pattern',
                patternType: 'solid',
                bgColor: '#ffb9b9',
                fgColor: '#ffb9b9'
            }
        }), positiveStyle = workbook.createStyle({
            fill: {
                type: 'pattern',
                patternType: 'solid',
                bgColor: '#b9ffb9',
                fgColor: '#b9ffb9'
            }
        });
        
        let index = 1;
        let rowIndex = 1;
        let monthlyTrendRestricted = ['name', 'symbol', 'positives', 'negatives'];
        let dateIndexMap = {};
        
        monthlysheet.cell(rowIndex, index++).string(inputs.monthlyTrend[0].name);
        monthlysheet.cell(rowIndex, index++).string(inputs.monthlyTrend[0].symbol);
        for (let key in inputs.monthlyTrend[0]) {
            if (monthlyTrendRestricted.indexOf(key) === -1) {
                dateIndexMap[inputs.monthlyTrend[0][key]] = index;
                monthlysheet.cell(rowIndex, index++).string(inputs.monthlyTrend[0][key]);
            }
        }
        monthlysheet.cell(rowIndex, index++).string(inputs.monthlyTrend[0].positives);
        monthlysheet.cell(rowIndex, index++).string(inputs.monthlyTrend[0].negatives);
        rowIndex++;
        index = 1;
        
        for (let i = 1; i < inputs.monthlyTrend.length; i++) {
            
            monthlysheet.cell(rowIndex, index++).string(inputs.monthlyTrend[i].name);
            monthlysheet.cell(rowIndex, index++).string(inputs.monthlyTrend[i].symbol);
            
            let lastvalue = Number.MIN_VALUE;
            for (let key in inputs.monthlyTrend[i]) {
                
                if (monthlyTrendRestricted.indexOf(key) === -1) {
                    
                    let value = inputs.monthlyTrend[i][key];
                    if (lastvalue < value && lastvalue != Number.MIN_VALUE) {
                        monthlysheet.cell(rowIndex, dateIndexMap[key]).string(value.toString()).style(positiveStyle);
                    } else if (lastvalue > value) {
                        monthlysheet.cell(rowIndex, dateIndexMap[key]).string(value.toString()).style(negativeStyle);
                    } else {
                        monthlysheet.cell(rowIndex, dateIndexMap[key]).string(value.toString());
                    }
                    lastvalue = value;
                    index++;
                }
            }
            
            monthlysheet.cell(rowIndex, index++).string(inputs.monthlyTrend[i].positives.toString());
            monthlysheet.cell(rowIndex, index++).string(inputs.monthlyTrend[i].negatives.toString());
            
            rowIndex++;
            index = 1;
        }
        
        let tradedsheet = workbook.addWorksheet('TradedTrend');
        
        index = 1;
        rowIndex = 1;
        let tradedTrendRestricted = ['company', 'symbol', 'sector'];
        dateIndexMap = {};
        
        tradedsheet.cell(rowIndex, index++).string(inputs.tradedTrend[0].company);
        tradedsheet.cell(rowIndex, index++).string(inputs.tradedTrend[0].symbol);
        tradedsheet.cell(rowIndex, index++).string(inputs.tradedTrend[0].sector);
        for (let key in inputs.tradedTrend[0]) {
            if (tradedTrendRestricted.indexOf(key) === -1) {
                dateIndexMap[inputs.tradedTrend[0][key]] = index;
                tradedsheet.cell(rowIndex, index++).string(inputs.tradedTrend[0][key]);
            }
        }
        rowIndex++;
        index = 1;
        
        for (let i = 1; i < inputs.tradedTrend.length; i++) {
            
            tradedsheet.cell(rowIndex, index++).string(inputs.tradedTrend[i].company);
            tradedsheet.cell(rowIndex, index++).string(inputs.tradedTrend[i].symbol);
            tradedsheet.cell(rowIndex, index++).string(inputs.tradedTrend[i].sector);
            
            for (let key in inputs.tradedTrend[i]) {
                if (tradedTrendRestricted.indexOf(key) === -1) {
                    
                    let value = inputs.tradedTrend[i][key] || "";
                    tradedsheet.cell(rowIndex, dateIndexMap[key]).string(value.toString());
                    lastvalue = value;
                    index++;
                }
            }
            
            rowIndex++;
            index = 1;
        }
        
        let fd = fs.openSync(directory + filename, 'w');
        fs.closeSync(fd);
        
        workbook.write(directory + filename);
        return exits.success(true);
    }
});

const callable1 = machine({

    identity: 'monthly trend',
    fn: async function (inputs, exits) {

        let trend = await reportMonthlyTrend(moment().format("YYYY-MM-DD"), 1);
        return exits.success(trend);
    }
});

const callable2 = machine({
    
    identity: 'traded trend',
    fn: async function (inputs, exits) {
        
        let trend = await reportTradedTrend(moment().format("YYYY-MM-DD"), 3);
        return exits.success(trend);
    }
});

(async function () {

    try {
        
        await connection.connect();
        
        let monthlyTrend = await callable1();
        let tradedTrend = await callable2();
        await prepareReport({ monthlyTrend: monthlyTrend, tradedTrend: tradedTrend });
        
        await connection.end();
        
    } catch (err) {
        console.trace(err);
    }
})();

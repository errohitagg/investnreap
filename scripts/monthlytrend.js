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
        
        let dateindexes = {}, startindex = 2;
        for (let date of dates) {
            date = moment(date.date).format("YYYY-MM-DD");
            dateindexes[date] = startindex++;
        }
        
        let workbook = new xl.Workbook();
        let sheet = workbook.addWorksheet('MonthTrend');

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
        let finalIndex;
        sheet.cell(rowIndex, index++).string('Name');
        sheet.cell(rowIndex, index++).string('Symbol');
        for (let date in dateindexes) {
            sheet.cell(rowIndex, index++).string(date);
        }
        sheet.cell(rowIndex, index++).string('Positives');
        sheet.cell(rowIndex, index++).string('Negatives');
        rowIndex++;
        finalIndex = index;
        
        index = 1;
        sheet.cell(rowIndex, index++).string("Nifty 50");
        let nifty50value = indexes[0].close;
        for (let row of indexes) {
            
            let indexdate = moment(row.date).format("YYYY-MM-DD");
            if (dateindexes[indexdate] === undefined) {
                continue;
            }
            
            if (nifty50value < row.close) {
                sheet.cell(rowIndex, dateindexes[indexdate] + 1).number(row.close).style(positiveStyle);
                nifty50value = row.close;
            } else if (nifty50value > row.close) {
                sheet.cell(rowIndex, dateindexes[indexdate] + 1).number(row.close).style(negativeStyle);
                nifty50value = row.close;
            } else {
                sheet.cell(rowIndex, dateindexes[indexdate] + 1).number(row.close);
            }
        }
        rowIndex++;
        
        for (let row of companies) {

            let result = await findMonthlyTrend(row.symbol, startdate);
            let positive = _.sumBy(result, function (data) {
                return data.change > 0 ? 1 : 0;
            });
            let negative = _.sumBy(result, function (data) {
                return data.change < 0 ? 1 : 0;
            });
            
            index = 1;
            sheet.cell(rowIndex, index++).string(row.name);
            sheet.cell(rowIndex, index++).string(row.symbol);
            for (let data of result) {
                
                if (dateindexes[data.date] == undefined) {
                    continue;
                }
                
                if (data.change > 0) {
                    sheet.cell(rowIndex, dateindexes[data.date] + 1).number(data.close).style(positiveStyle);
                } else if (data.change < 0) {
                    sheet.cell(rowIndex, dateindexes[data.date] + 1).number(data.close).style(negativeStyle);
                } else {
                    sheet.cell(rowIndex, dateindexes[data.date] + 1).number(data.close);
                }
            }
            
            sheet.cell(rowIndex, finalIndex - 2).number(positive);
            sheet.cell(rowIndex, finalIndex - 1).number(negative);
            rowIndex++;
        }
        
        let fd = fs.openSync(directory + filename, 'w');
        fs.closeSync(fd);
        
        workbook.write(directory + filename);

    } catch (err) {
        console.trace(err);
    }
};

const callable = machine({

    identity: 'monthly trend',
    fn: async function (inputs, exits) {

        await reportMonthlyTrend(moment().format("YYYY-MM-DD"), 1);
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

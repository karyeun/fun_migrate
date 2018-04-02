var sql = require('mssql');
var db = require('./lib/db');
var nconf = require('nconf');
nconf.file('./config.json');
var mssql_user = nconf.get('mssql-user');
var mssql_password = nconf.get('mssql-password');
var mssql_server = nconf.get('mssql-server');
var mssql_database = nconf.get('mssql-database');

console.log('fun-mssql-mongo-migration');
console.log('args -> ');
var gateway = '';
var count = '0';
var clean = false;
process.argv.forEach(function(val, index, array) {
    //if (index > 1) console.log(index + ': ' + val);
    if (index === 2) gateway = val;
    else if (index === 3) count = val;
    else if (index === 4) clean = val;
});

console.log('gateway: ' + gateway);
console.log('record to insert: ' + (count == 0 ? '*' : count));
console.log('clean mongodb data: ' + clean);
if (gateway == '') {
    console.log('no gateway specified.');
    process.exit(0);
}

if ('ICE,MEXCOMM,MK,MMP,'.indexOf(gateway + ',') < 0) {
    console.log('no gateway specified.');
    process.exit(0);
}

//process.exit(0);

//Data Source=sit-engagement-db.database.windows.net;
//Initial Catalog=sit.boldlink;Persist Security Info=True;
//User ID=sitengageadmeen;Password=Atos@2005
/******************************************/
//"Server=WIN-0S1CKRDEL55\SQL2012;
//Database=SMS_TransactionReporting;
//User ID=sa;
//Password=Funnet123
var config = {
    user: mssql_user,
    password: mssql_password,
    server: mssql_server,
    database: mssql_database

    // options: {
    //     encrypt: true // Use this if you're on Windows Azure
    // }
};

var table = 'tblSubscriber';
if (gateway != 'MMP') {
    if (gateway == 'MEXCOMM') table += '_Mexcomm';
    else table += ('_' + gateway);
}
var query = 'select ' + (count != '0' ? 'top ' + count + ' ' : '') + '* from ' + table; //+ ' '+
//'order by msisdn ';
console.log(query);
sql.connect(config).then(pool => {
    return pool.request()
        //.input('input_parameter', sql.Int, 1)
        .query(query);

}).then(result => {
    if (clean) {
        db.delete('subscribers', { 'gateway': gateway }).then(deleted => {
            //console.log('deleted>' + deleted);
            var del = JSON.parse(deleted);
            console.log('deleted records>' + del.n);

            var count = result.recordset.length;
            var counter = 0;
            console.log('record to migrate: ' + count);
            var subscribers = [];
            result.recordset.forEach(rec => {
                var subscriber = {
                    "gateway": gateway,
                    "msisdn": rec.msisdn,
                    "shortCode": rec.shortcode,
                    //"keyword":  rec.Keyword.toUpperCase(),
                    "telcoId": rec.TelcoID.toUpperCase(),
                    //"service": rec.Reply.toUpperCase()
                    "subscribeOn": new Date(rec.DtCreated)
                }
                if (rec.Reply) subscriber.service = rec.Reply.toUpperCase(); //could be NULL
                if (rec.Keyword) subscriber.keyword = rec.Keyword.toUpperCase(); //could be NULL

                if (subscriber.gateway == 'MMP') {
                    if (subscriber.telcoId == '4') subscriber.telcoId = "MY_UMOBILE";
                }

                console.log('Preparing [' + subscriber.service + '] ' +
                    subscriber.msisdn + '/' +
                    subscriber.shortCode + '/' +
                    subscriber.keyword + '/' +
                    subscriber.telcoId + ' for migration.');

                subscribers.push(subscriber);
            });

            db.bulkSave('subscribers', subscribers).then(res => {
                console.log('migration of ' + subscribers.length + ' subscriber(' + gateway + ') are done.');
                process.exit(0);
            }).catch(err => {
                console.log('err bulkSave(): ' + err);
            });
        }).catch(err => {
            console.log('err delete(): ' + err);
        });
    } else {
        var count = result.recordset.length;
        var counter = 0;
        console.log('record to migrate: ' + count);
        var subscribers = [];
        result.recordset.forEach(rec => {
            var subscriber = {
                "gateway": gateway,
                "msisdn": rec.msisdn,
                "shortCode": rec.shortcode,
                //"keyword":  rec.Keyword.toUpperCase(),
                "telcoId": rec.TelcoID.toUpperCase(),
                //"service": rec.Reply.toUpperCase()
            }
            if (rec.Reply) subscriber.service = rec.Reply.toUpperCase(); //could be NULL
            if (rec.Keyword) subscriber.keyword = rec.Keyword.toUpperCase(); //could be NULL

            if (subscriber.gateway == 'MMP') {
                if (subscriber.telcoId == '4') subscriber.telcoId = "MY_UMOBILE";
            }

            console.log('Preparing [' + subscriber.service + '] ' +
                subscriber.msisdn + '/' +
                subscriber.shortCode + '/' +
                subscriber.keyword + '/' +
                subscriber.telcoId + ' for migration.');

            subscribers.push(subscriber);
        });

        db.bulkSave('subscribers', subscribers).then(res => {
            console.log('migration of ' + subscribers.length + ' subscriber(' + gateway + ') are done.');
            process.exit(0);
        }).catch(err => {
            console.log('err bulkSave(): ' + err);
        });
    }

}).catch(err => {
    console.log(err);
    process.exit(1);
});

sql.on('error', err => {
    console.log(err);
    process.exit(1);
});
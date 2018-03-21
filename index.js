const sql = require('mssql');
console.log('fun-mssql-mongo-migration');

console.log('args -> ');
var gateway = '';
var count = '*';
var clean = false;
process.argv.forEach(function(val, index, array) {
    if (index > 1) console.log(index + ': ' + val);
    if (index === 2) gateway = val;
    else if (index === 3) count = val;
    else if (index === 4) clean = val;
});

if ('ICE,MEXCOMM,MK,MMP,'.indexOf(gateway + ',') < 0) {
    console.log('no gateway specified.');
    process.exit(0);
}

//Data Source=sit-engagement-db.database.windows.net;
//Initial Catalog=sit.boldlink;Persist Security Info=True;
//User ID=sitengageadmeen;Password=Atos@2005
const config = {
    user: 'sitengageadmeen',
    password: 'Atos@2005',
    server: 'sit-engagement-db.database.windows.net', // You can use 'localhost\\instance' to connect to named instance
    database: 'sit.boldlink',

    options: {
        encrypt: true // Use this if you're on Windows Azure
    }
}

var table = 'tblSubscriber';
if (gateway != 'MMP') {
    if (gateway == 'MEXCOMM') table += '_Mexcomm';
    else table += ('_' + gateway);
}
var query = 'select ' + (count != '*' ? 'top ' + count + ' ' : '') + '* from ' + table;
console.log(query);
sql.connect(config).then(pool => {
    return pool.request()
        //.input('input_parameter', sql.Int, 1)
        .query(query);

}).then(result => {
    var count = result.recordset.length;
    var counter = 0;
    result.recordset.forEach(rec => {
        var subscriber = {
            "gateway": gateway,
            "msisdn": rec.msisdn,
            "shortCode": rec.shortcode,
            "keyword": rec.Keyword.toUpper(),
            "telcoId": rec.TelcoID.toUpper(),
            "service": rec.Reply.toUpper()
        }

        if (subscriber.gateway == 'MMP') {
            if (subscriber.telcoId == '4') subscriber.telcoId = "MY_UMOBILE";
        }
        db.save('subscribers', subscriber).then(res => {
            console.log('[' + subscriber.service + ']' +
                subscriber.msisdn + '/' +
                subscriber.shortCode + '/' +
                subscriber.keyword + '/' +
                subscriber.telcoId + '/' +
                ' migrated.');
            counter++;
            if (counter == count) {
                cosnole.log('migration of ' + count + ' subscriber(' + gateway + ') are done.')
                process.exit(0);
            }
        });
    });
}).catch(err => {
    console.log(err);
    process.exit(1);
});

sql.on('error', err => {
    console.log(err);
    process.exit(1);
})

//process.exit(0);
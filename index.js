const sql = require('mssql');
console.log('fun-mssql-mongo-migration');

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

sql.connect(config).then(pool => {
    return pool.request()
        .input('input_parameter', sql.Int, 1)
        .query('select * from Activities where ActivityId >= @input_parameter');
}).then(result => {
    result.recordset.forEach(rec => {
        console.log(rec);
    });
}).catch(err => {
    console.log(err);
});

sql.on('error', err => {
    console.log(err);
})
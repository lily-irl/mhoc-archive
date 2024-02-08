const mysql = require('mysql2')
const credentials = require('./credentials.json')

const database = module.exports

const connection = mysql.createConnection(credentials['DATABASE'])

database.alive = true

database.query = function (query, placeholders, callback) {
    if (!database.alive)
        return
    connection.query(query, placeholders, callback)
}

database.end = function () {
    database.alive = false
    connection.end()
}
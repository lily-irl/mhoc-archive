const express = require('express')
const path = require('path')
const session = require('express-session')
const app = express()
const PORT = process.env.PORT || 3300

const database = require('./database')
const api = require('./routes/api')
const auth = require('./routes/auth')

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views/'))

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: crypto.randomUUID(),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use(express.static(path.join(__dirname, 'public/')))
app.use('/css/icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font')))
app.use('/css/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')))
app.use('/js/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
app.use('/js/dompurify', express.static(path.join(__dirname, 'node_modules/dompurify/dist')))
app.use('/js/marked', express.static(path.join(__dirname, 'node_modules/marked')))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(auth.authenticator)

app.use('/api', api)
app.use('/', auth.router)

app.get('/', (req, res) => {
    database.query('SELECT id FROM bills', null, (errors, results, fields) => {
        if (errors)
            return res.render('index')

        const TOTAL_BILLS = 1657
        const TOTAL_LORD_BILLS = 277
        let counted_bills = 0, counted_lord_bills = 0
        
        for (let bill of results) {
            if (/B[0-9]{3,4}/.test(bill))
                ++counted_bills
            else if (/LB[0-9]{3,4}/.test(bill))
                ++counted_lord_bills
        }

        return res.render('index', { complete: { b: counted_bills / TOTAL_BILLS, lb: counted_lord_bills / TOTAL_LORD_BILLS } })
    })
    res.render('index')
})

app.get('/search', (req, res) => {
    res.render('search')
})

app.get('/data', (req, res) => {
    res.render('data')
})

app.get('/success', (req, res) => {
    res.render('index', { success: true })
})

app.listen(PORT, () => console.log('listening on ' + PORT))
const express = require('express')
const path = require('path')
const app = express()
const PORT = process.env.PORT || 3000

const api = require('./routes/api')

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views/'))

app.use(express.static(path.join(__dirname, 'public/')))
app.use('/css/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')))
app.use('/js/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
app.use('/js/dompurify', express.static(path.join(__dirname, 'node_modules/dompurify/dist')))
app.use('/js/marked', express.static(path.join(__dirname, 'node_modules/marked')))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api', api)

app.get('/', (req, res) => {
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
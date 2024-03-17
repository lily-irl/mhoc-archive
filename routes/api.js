const express = require('express')
const snoowrap = require('snoowrap')
const router = express.Router()
const credentials = require('../credentials.json')

const database = require('../database')
const r = new snoowrap(credentials['REDDIT'])

router.post('/search', (req, res) => {
    const bill = req.body['bill-type'] + req.body['bill-num']

    Promise.all([
        r.search({
            query: bill,
            subreddit: 'MHOC',
            sort: 'new'
        }),
        r.search({
            query: bill,
            subreddit: 'MHOCMP',
            sort: 'new'
        }),
        r.search({
            query: bill,
            subreddit: 'MHOL',
            sort: 'new'
        }),
        r.search({
            query: bill,
            subreddit: 'MHOLVote',
            sort: 'new'
        })
    ]).then(subreddits => {
        const mhoc = [...subreddits[0], ...subreddits[1]]
        const mhol = [...subreddits[2], ...subreddits[3]]

        mhoc.sort((a, b) => b.created_utc - a.created_utc)
        mhol.sort((a, b) => b.created_utc - a.created_utc)

        const truncateString = (string = '', maxLength = 50) => 
            string.length > maxLength 
            ? `${string.substring(0, maxLength)}…`
            : string

        const props = {
            bill: bill,
            found_results: {
                mhoc: mhoc.length !== 0,
                mhol: mhol.length !== 0
            },
            results: {
                mhoc: [],
                mhol: []
            }
        }

        for (let i = 0; i < mhoc.length; ++i) {
            if (i === 9) break

            props.results.mhoc.push({
                title: mhoc[i].title,
                body: truncateString(mhoc[i].selftext, 100),
                full_body: mhoc[i].selftext,
                timestamp: new Date(mhoc[i].created_utc * 1000).toUTCString(),
                id: mhoc[i].id
            })
        }

        for (let i = 0; i < mhol.length; ++i) {
            if (i === 9) break

            props.results.mhol.push({
                title: mhol[i].title,
                body: truncateString(mhol[i].selftext, 100),
                full_body: mhol[i].selftext,
                timestamp: new Date(mhol[i].created_utc * 1000).toUTCString(),
                id: mhol[i].id
            })
        }

        return res.render('searchResults', props)
    })
})

router.get('/archive/:bill/:submission', (req, res) => {
    const bill = req.params.bill
    const submission = req.params.submission

    r.getSubmission(submission).fetch().then(post => {
        res.render('data', {
            title: post.title,
            text: post.selftext,
            bill: bill
        })
    })
})

router.post('/archive/submit', (req, res) => {
    const bill = req.body['bill-num']
    const title = req.body['bill-title']
    const author = req.body['bill-author']
    const text = req.body['bill-text']
    const lengthIssue = req.body['too-long'] === 'on' ? true : false
    const otherIssue = req.body['problem'] === 'on' ? true : false

    // error condition checks
    // bill number formatting
    if (!/(B|LB)[0-9]{3,4}/.test(bill)) {
        return res.render('dataError', { err: 'The bill number was formatted incorrectly. The server received a value of "' + bill + '" but expected something like B1234, B004, or LB101.' })
    }

    // text too long
    if (text.length > 40000) {
        return res.render('dataError', { err: 'This bill text is too long (' + text.length + '/40000). Please tick the box indicating this Bill is too long and leave the text box empty, and try again.' })
    }

    database.query('INSERT INTO bills VALUES (?, ?, ?, ?, ?, ?)',
                    [bill, title, author, text, lengthIssue, otherIssue],
                    (err, results) => {
                        if (err)
                            return res.render('dataError', { err: err })
                        return res.redirect('/success')
                    })
})

router.get('/bill', (req, res) => {
    const bill = req.query['bill']

    if (!bill)
        return res.render('error', { err: 'No bill id was provided; please check the URL and try again.' })

    database.query('SELECT bill, title, author, text FROM bills WHERE bill = ?', [ bill ], (err, results) => {
        if (err)
            return res.render('dataError', { err: err })
        if (results.length === 0)
            return res.render('dataError', { err: 'No bills found with that id, double-check it?' })
        return res.render('bill', { bill: bill, title: results[0].title, author: results[0].author, text: results[0].text })
    })
})

module.exports = router
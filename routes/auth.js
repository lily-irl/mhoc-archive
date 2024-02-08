const jwt = require('jsonwebtoken')
const express = require('express')
const router = express.Router()
const axios = require('axios')

const { TOKEN_SECRET, REDDIT } = require('../credentials.json')

const AUTHORISED_USERS = [
    'lily-irl',
    'model-raymondo',
    'Sephronar',
    'Lady_Aya',
    'Frost_Walker2017'
]

router.generateToken = function (username) {
    return jwt.sign(username, TOKEN_SECRET, { expiresIn: '1800s' })
}

router.authenticateToken = function (req, res, next) {
    const EXCLUDED_ROUTES = ['/', '/login', '/callback']

    if (EXCLUDED_ROUTES.includes(req.path))
        return next()

    const token = req.session.token

    if (token == null) return res.redirect('/login')

    jwt.verify(token, TOKEN_SECRET, (err, user) => {
        if (err) return res.redirect('/login')
        req.user = user
        next()
    })
}

router.get('/login', (req, res) => {
    return res.render('login')
})

router.get('/callback', (req, res) => {
    if (req.query['error'])
        return res.render('error', { error: req.body['error'] })
    if (req.query['code']) {
        // step 1
        axios.post('https://www.reddit.com/api/v1/access_token', {
            'grant_type': 'authorization_code',
            'code': req.query['code'],
            'redirect_uri': 'https://archive.mhoc.lily-irl.com/callback'
        }, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(REDDIT.clientId + ':' + REDDIT.clientSecret).toString('base64'),
                'Content-Type': 'x-www-form-urlencoded'
            }
        }).then(auth_response => {
            if (auth_response.error)
                return res.render('error', { error: auth_response.error })
            // step 2: confirm identity
            axios.get('https://oauth.reddit.com/api/v1/me', {
                headers: {
                    'Authorization': 'Bearer ' + auth_response.access_token,
                    'Content-Type': 'application/json',
                    'User-Agent': 'mhoc-archive (/r/MHOC) (/u/lily-irl) (v1.0.0)'
                }
            }).then(user => {
                if (AUTHORISED_USERS.includes(user.name)) {
                    const token = this.generateToken(user.name)
                    req.session.token = token
                    return res.redirect('/')
                }
                return res.render('error', { error: 'Your account, ' + user.name + ', is not authorised to use the site. Please contact an admin if you believe this is in error.' })
            }).catch(error => console.error)
        }).catch(error => console.error)
    }
})

module.exports = router

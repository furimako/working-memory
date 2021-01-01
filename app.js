const express = require('express')
const hash = require('pbkdf2-password')()
const path = require('path')
const session = require('express-session')
const hbs = require('hbs')

const app = express()

app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'src/views'))
hbs.registerPartials(`${__dirname}/src/views/partials`)

app.use(express.static('public'))
app.use('/vue', express.static('node_modules/vue/dist'))
app.use(express.urlencoded({ extended: false }))
app.use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'shhhh, very secret'
}))

// Session-persisted message middleware

app.use((req, res, next) => {
    const err = req.session.error
    const msg = req.session.success
    delete req.session.error
    delete req.session.success
    res.locals.message = ''
    if (err) res.locals.message = `<p class="msg error">${err}</p>`
    if (msg) res.locals.message = `<p class="msg success">${msg}</p>`
    next()
})

// dummy database
const users = {
    'furimako@gmail.com': { name: 'furimako@gmail.com' }
}

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

hash({ password: 'foobar' }, (err, pass, salt, hash) => {
    if (err) {
        throw err
    }
    // store the salt & hash in the "db"
    users['furimako@gmail.com'].salt = salt
    users['furimako@gmail.com'].hash = hash
})

// Authenticate using our plain-object database of doom!

function authenticate(name, pass, fn) {
    if (!module.parent) {
        console.log('authenticating %s:%s', name, pass)
    }
    const user = users[name]
    if (!user) {
        return fn(new Error('cannot find user'))
    }
    hash({ password: pass, salt: user.salt }, (err, pass, salt, hash) => {
        if (err) return fn(err)
        if (hash === user.hash) return fn(null, user)
        fn(new Error('invalid password'))
    })
}

function restrict(req, res, next) {
    if (req.session.user) {
        next()
    } else {
        req.session.error = 'Access denied!'
        res.redirect('/login')
    }
}

app.get('/', (req, res) => {
    res.redirect('/login')
})

app.get('/restricted', restrict, (req, res) => {
    res.render('main')
})

app.get('/logout', (req, res) => {
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(() => {
        res.redirect('/')
    })
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', (req, res) => {
    console.log(`req.body.email: ${req.body.email}, req.body.password: ${req.body.password}`)
    authenticate(req.body.email, req.body.password, (err, user) => {
        if (user) {
            // Regenerate session when signing in
            // to prevent fixation
            req.session.regenerate(() => {
                // Store the user's primary key
                // in the session store to be retrieved,
                // or in this case the entire user object
                req.session.user = user
                req.session.success = `Authenticated as ${user.name} click to <a href="/logout">logout</a>. You may now access <a href="/restricted">/restricted</a>.`
                res.redirect('back')
            })
        } else {
            req.session.error = 'Authentication failed. (use "furimako@gmail.com" and "foobar")'
            res.redirect('/login')
        }
    })
})

/* istanbul ignore next */
if (!module.parent) {
    const port = 8128
    app.listen(port)
    console.log(`Express started on port ${port}`)
}

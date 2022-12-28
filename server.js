require('dotenv').config()
const multer = require('multer')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const File = require('./models/File')

const express = require('express')
const app = express()

// Config BodyParse (when req.body exist!)
app.use(express.urlencoded({ extended: true }))

// Config multer folder
const upload = multer({ dest: 'uploads' })

// Connect mongoDB 
mongoose.connect(process.env.DATABASE_URL)

// Config EJS (render ejs file from views folder)
app.set('view engine', 'ejs')
// app.set('views', 'views')

// Routes
app.get('/', (req, res) => {
    res.render('index', {
        pageTitle: 'File Sharing'
    })
})

// Upload file
app.post('/upload', upload.single('file'), async (req, res) => {
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname
    }
    if (req.body.password != null && req.body.password !== '') {
        fileData.password = await bcrypt.hash(req.body.password, 10)
    }

    const file = await File.create(fileData)
    res.render('index', {
        fileLink: `${req.headers.origin}/file/${file.id}`,
        pageTitle: 'File Sharing'
    })
    // console.log(uploads.headers)
})

// Download file with id (or +? password)

// app.get('/file/:id', handelDownload)
// app.post('/file/:id', handelDownload)
app.route('/file/:id').get(handelDownload).post(handelDownload)

async function handelDownload(req, res) {
    const file = await File.findById(req.params.id)

    if(file.password != null) {
        if(req.body.password == null) {
            res.render('password', {
                pageTitle: 'File Sharing - Password'
            })
            return
        }

        if(!await bcrypt.compare(req.body.password, file.password)) {
            res.render('password', { error: true, pageTitle: 'File Sharing' })
            return
        }
    }

    file.downloadCont++
    await file.save()
    console.log(file.downloadCont)

    res.download(file.path, file.originalName)
}

app.listen(process.env.PORT)
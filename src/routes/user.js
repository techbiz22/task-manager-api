const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')

const router = new express.Router()


//upload profile picture
const upload = multer({
    // dest:'avatar',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('Please upload [jpg,jpeg or png] images'))
        }
        cb(undefined, true)
    }
})
router.post('/user/me/avatar/', auth, upload.single('avatar'), async (req, res, next) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send({ message: 'Photo uploaded successfully' })
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

//delete avartar
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.status(200).send({ message: 'Photo deleted successfuly' })
})

// create new user
router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })

    } catch (e) {
        res.status(400).send(e)
    }
})

//login user
router.post('/users/login', async (req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()

        res.send({ user, token })
    } catch (e) {
        res.status(404).send(e)
    }
})

// logout
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

//logout all
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// read my profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

//update user
router.patch('/user/me', auth, async (req, res) => {

    const user = req.user

    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid update' })
    }

    try {

        if (!user) {
            return res.status(404).send({ error: 'No user found to update' })
        }

        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        res.send(user)

    } catch (e) {
        res.status(400).send(e)
    }
})

//read other user
// router.get('/user/:id', async (req, res) => {
//     const _id = req.params.id
//     try {
//         const user = await User.findById(_id)
//         if(!user){
//             return res.status(404).send()
//         }
//         res.send(user)
//     } catch (e) {
//         res.status(500).send(e)
//     }
// })

//delete user
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})



module.exports = router
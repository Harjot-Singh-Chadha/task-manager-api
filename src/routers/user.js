const express = require("express");
const auth = require("../middleware/auth")
const router = new express.Router()
const User = require("../models/user")
const multer = require("multer");
const sharp = require("sharp")

// Users

router.get("/users/me", auth, async (req, res) => {
    res.send(req.user)
});

router.get("/users/:id/avatar", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }
        res.set("Content-Type", "image/png")
        res.send(user.avatar)
    } catch (error) {
        res.status(404).send()
    }
});

router.patch('/users/me', auth, async (req, res) => {
    const update = Object.keys(req.body);
    const allowUpdate = ['name', 'age', 'email', 'password']
    const isValidOperation = update.every((update) => allowUpdate.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" })
    }
    try {
        const user = req.user
        update.forEach((update) => user[update] = req.body[update])

        await user.save()
        res.send(user)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    };
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send();
    };
});

router.post('/users/logout', auth, async (req, res) => {
    try {

        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        });
        await req.user.save()
        res.send();
    } catch (e) {
        res.status(500).send();
    };
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save()
        res.send();
    } catch (e) {
        res.status(500).send();
    };
});

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload an image in jpg, jpeg or png format"))
        }
        cb(undefined, true)
    }
});

router.post("/users/me/avatar", auth, upload.single("avatar"), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
});

router.delete("/users/me/avatar", auth, async (req, res) => {

    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        res.send(req.user)
    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router;
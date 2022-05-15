const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth")
const router = new express.Router()

// Tasks
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:asc

router.get("/tasks", auth, async (req, res) => {

    const sort = {};
    const match = { owner: req.user._id };

    req.query.completed && (match.completed = req.query.completed)

    if (req.query.sortBy) {
        const [sortBy, order] = req.query.sortBy.split(":")
        sort[sortBy] = order === "asc" ? 1 : -1
    }
    try {
        const tasks = await Task.find(match, null, {
            limit: req.query.limit,
            skip: req.query.skip,
            sort
        })
        res.send(tasks)
    } catch (error) {
        res.status(500).send()
    }
});

router.get("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (error) {
        res.status(500).send()
    }
});

router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    const update = Object.keys(req.body);
    const allowUpdate = ["description", "completed"]
    const isValidOperation = update.every((update) => allowUpdate.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" })
    }

    try {
        const task = await Task.findOne({ _id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()
        }

        update.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(e);
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router
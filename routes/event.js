const express = require('express')
const router = express.Router();
const Event = require('../model/event')
const User = require('../model/user')
const verifyRole = require('../middleware/verifyRole')
const verifyLogin = require('../middleware/verifyLogin')

router.use(verifyLogin);

//Event APIs

router.post('/', verifyRole('organizer'), async (req, res) => {
    try {
        const { title, description, category, mode, location, event_date, registration_deadline, max_participants } = req.body
        if (event_date <= registration_deadline) {
            let err = new Error("Event Date cannot be before Registration deadline")
            err.status = 400
            throw err
        }
        if (max_participants <= 0) {
            let err = new Error("Max Participants should be more than zero")
            err.status = 400
            throw err
        }
        const newEvent = new Event({
            title, description, category, mode, location, event_date, registration_deadline, max_participants, status: 'open', organizer: req.id
        })
        await newEvent.save();
        res.status(200).json({
            message: "New Event created",
            event: newEvent
        })
    } catch (e) {
        res.status(400).send(e.message)
        console.log(e)
    }
})
router.get('/', async (req, res) => {
    try {
        const allEvents = await Event.find();
        let i = 0
        while (i < allEvents.length) {
            const activeparti = allEvents[i].participants.filter(a => a.status == 'active');
            if (allEvents[i].event_date <= Date.now()) {
                allEvents[i].status = 'completed'
            }
            else if (allEvents[i].registration_deadline < Date.now()) {
                allEvents[i].status = 'closed'
            }
            else if (activeparti.length == allEvents[i].max_participants) {
                allEvents[i].status = 'full'
            }
            await allEvents[i].save()
            i += 1
        }
        //await allEvents.save();
        res.status(200).json({
            message: "All Events fetched",
            events: allEvents
        })
    } catch (e) {
        res.status(400).send(e.message)
        console.log(e)
    }
})
router.get('/:eventId', async (req, res) => {
    try {
        const foundEvent = await Event.findOne({ _id: req.params.eventId })
        if (!foundEvent) {
            const err = new Error('Event Not Found');
            err.status = 404;
            throw err
        }
        const organizer = await User.findOne({ _id: foundEvent.organizer }).select('-password');
        if (!organizer) {
            const err = new Error('Organizer Not Found');
            err.status = 404;
            throw err
        }
        let activeparti = foundEvent.participants.filter(a => a.status == 'active')
        if (foundEvent.event_date < Date.now()) {
            foundEvent.status = 'completed'
        }
        else if (foundEvent.registration_deadline < Date.now()) {
            foundEvent.status = 'closed'
        }
        else if (activeparti.length == foundEvent.max_participants) {
            foundEvent.status = 'full'
        }
        res.status(200).json({
            message: "Event fetched",
            event: foundEvent,
            organizer
        })
    } catch (e) {
        res.status(400).send(e.message)
        console.log(e)
    }
})
router.put('/:eventId', verifyRole('organizer'), async (req, res) => {
    try {
        const foundEvent = await Event.findOne({ _id: req.params.eventId });
        if (!foundEvent) {
            const err = new Error('Event Not Found');
            err.status = 404;
            throw err
        }
        if (foundEvent.organizer.toString() != req.id) {
            const err = new Error("You don't have access to this event");
            err.status = 400;
            throw err
        }
        const { title, description, category, mode, location, event_date, registration_deadline, max_participants } = req.body;
        if (title) {
            foundEvent.title = title;
        }
        if (description) {
            foundEvent.description = description;
        }
        if (category) {
            foundEvent.category = category;
        }
        if (mode) {
            foundEvent.mode = mode;
        }
        if (location) {
            foundEvent.location = location;
        }
        if (registration_deadline && event_date) {
            if (registration_deadline > event_date) {
                let err = new Error("Registration deadline should be before event date.")
                err.status = 400;
                throw err
            }
        }
        if (max_participants <= 0) {
            let err = new Error("Max Participants should be more than zero")
            err.status = 400
            throw err
        }
        if (max_participants < foundEvent.participants.length) {
            let err = new Error("Max Participants cannot be less than Joined Participants")
            err.status = 400
            throw err
        }
        if (event_date) {
            foundEvent.event_date = event_date;
        }
        if (registration_deadline) {
            foundEvent.registration_deadline = registration_deadline;
        }
        if (max_participants) {
            foundEvent.max_participants = max_participants;
        }
        await foundEvent.save();
        res.status(200).json({
            message: "Event Updated successfully",
            Event: foundEvent
        })
    } catch (e) {
        res.status(400).send(e.message)
        console.log(e)
    }
})
router.patch('/:eventId/close', verifyRole('organizer'), async (req, res) => {
    try {
        const foundEvent = await Event.findOne({ _id: req.params.eventId });
        if (!foundEvent) {
            const err = new Error('Event Not Found');
            err.status = 404;
            throw err
        }
        if (foundEvent.organizer.toString() != req.id) {
            const err = new Error("You don't have access to this event");
            err.status = 400;
            throw err
        }
        foundEvent.status = 'closed';
        await foundEvent.save();
        i = 0
        while(i<foundEvent.participants.length){
            let curr = await User.findById(foundEvent.participants[i].id);
            j = 0
            while(j<curr.events.length){
                if(curr.events[j].id==req.params.eventId){
                    curr.events[j].status='closed';
                    break
                }
                j+=1
            }
            foundEvent.participants[i].status = "closed";
            await curr.save();
            await foundEvent.save();
            i+=1
        }
        res.status(200).json({
            message: "Event Closed",
            eventId: req.params.eventId
        })
    } catch (e) {
        res.status(400).send(e.message)
        console.log(e)
    }
})

//Organizer APIs

router.get('/:eventId/participants', verifyRole('organizer'), async (req, res) => {
    try {
        const foundEvent = await Event.findOne({ _id: req.params.eventId });
        if (!foundEvent) {
            const err = new Error("Event Not Found");
            err.status = 404;
            throw err;
        }
        if (foundEvent.organizer.toString() != req.id) {
            const err = new Error("You don't have access to this event");
            err.status = 400;
            throw err
        }
        foundEvent.participants = foundEvent.participants.filter(a => a.status == 'active')
        res.status(200).json({
            message: "participants fetched",
            participants: foundEvent.participants
        })
    } catch (e) {
        res.status(400).send(e.message)
        console.log(e)
    }
})
router.patch('/:eventId/participants/:participantId/remove', verifyRole('organizer'), async (req, res) => {
    try {
        const foundEvent = await Event.findOne({ _id: req.params.eventId });
        if (!foundEvent) {
            const err = new Error("Event Not Found");
            err.status = 400;
            throw err
        }
        if (foundEvent.organizer.toString() != req.id) {
            const err = new Error("You don't have access to this event");
            err.status = 400;
            throw err
        }
        let i = 0
        let exist = false
        while (i < foundEvent.participants.length) {
            if (foundEvent.participants[i].id == req.params.participantId) {
                if (foundEvent.participants[i].status == 'removed' || foundEvent.participants[i].status == 'cancelled') {
                    const err = new Error("The User have left the event");
                    err.status = 400;
                    throw err
                }
                foundEvent.participants[i].status = 'removed';
                exist = true
                break
            }
            i++
        }
        if (!exist) {
            const err = new Error("This User haven't joined the Event");
            err.status = 400;
            throw err
        }
        await foundEvent.save();
        const foundUser = await User.findOne({ _id: req.params.participantId });
        if (!foundUser) {
            const err = new Error("User Not Found");
            err.status = 404;
            throw err;
        }
        i = 0;
        while (i < foundUser.events.length) {
            if (foundUser.events[i].id == req.params.eventId) {
                foundUser.events[i].status = 'removed'
                break
            }
            i++
        }
        await foundUser.save();
        res.status(200).json({
            message: 'Particpant Removed',
            id: req.params.participantId
        })
    } catch (e) {
        res.status(400).send(e.message)
        console.log(e)
    }
})

//Participants APIs

router.post('/:eventId/join', verifyRole('participant'), async (req, res) => {
    try {
        const foundEvent = await Event.findOne({ _id: req.params.eventId });
        if (foundEvent.status != 'open') {
            const err = new Error("The Event is not Open");
            err.status = 400;
            throw err
        }
        const foundUser = await User.findOne({ _id: req.id });
        let joined = false;
        let i = 0
        while (i < foundEvent.participants.length) {
            if (foundEvent.participants[i].id.toString() == req.id) {
                if (foundEvent.participants[i].status == 'active') {
                    const err = new Error("You have already joined the event");
                    err.status = 400;
                    throw err;
                }
                else if (foundEvent.participants[i].status == 'cancelled' || foundEvent.participants[i].status == 'removed') {
                    foundEvent.participants[i].status = 'active';
                    j = 0
                    while (j < foundUser.events.length) {
                        if (foundUser.events[j].id.toString() == foundEvent._id.toString()) {
                            foundUser.events[j].status = 'active';
                            break
                        }
                        j++
                    }
                    joined = true;
                    break;
                }
            }
            i++
        }
        if (Date.now() > foundEvent.registration_deadline) {
            let err = new Error("Registration date has passed")
            err.status = 400
            throw err
        }
        if (!joined) {
            foundEvent.participants.push({ id: req.id, status: 'active' });
            foundUser.events.push({ id: req.params.eventId, status: 'active' });

        }
        await foundEvent.save();
        await foundUser.save();
        res.status(200).json({
            message: 'Joined Event successfully',
            id: req.params.eventId
        })
    } catch (e) {
        res.status(400).send(e.message)
        console.log(e)
    }
})
router.patch('/:eventId/cancel-participation', verifyRole('participant'), async (req, res) => {
    try {
        const foundEvent = await Event.findOne({ _id: req.params.eventId });
        if (foundEvent.status == 'completed') {
            const err = new Error("The Event is completed");
            err.status = 400;
            throw err
        }
        let i = 0
        let exist = false
        while (i < foundEvent.participants.length) {
            if (foundEvent.participants[i].id.toString() == req.id) {
                foundEvent.participants[i].status = 'cancelled';
                exist = true
                break
            }
            i++
        }
        if (!exist) {
            const err = new Error("You haven't joined this Event");
            err.status = 400;
            throw err
        }
        await foundEvent.save()
        const foundUser = await User.findOne({ _id: req.id });
        i = 0;
        while (i < foundUser.events.length) {
            if (foundUser.events[i].id.toString() == req.params.eventId) {
                foundUser.events[i].status = 'cancelled'
                break
            }
            i++
        }
        await foundUser.save();
        res.status(200).json({
            message: "Cancelled Participation",
            eventId: req.params.eventId
        })
    } catch (e) {
        res.status(400).send(e.message)
        console.log(e)
    }
})

module.exports = router;
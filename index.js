require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

app.use(morgan('tiny'))

morgan.token('custom', (req) => {
    return JSON.stringify(req.body);
});

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    }

    next(error)
}

app.use(morgan(':custom'))


app.use(cors())
app.use(express.json())
app.use(express.static('build'))


app.get('/', (request, response) => {
    response.json('<h1>Hello world</h1>')
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(person => {

        response.json(person)
    })
})
app.get('/info', (request, response) => {

    response.json(`phonebook has info for ${Person.length} persons ${new Date()}`);

})
app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndRemove(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})


app.post('/api/persons', (request, response) => {

    const body = request.body

    if (!body.name) {
        return response.status(400).json({
            error: 'name missing'
        })
    }
    if (!body.number) {
        return response.status(400).json({
            error: 'number missing'
        })
    }

    // Verificar si el nombre ya existe en la base de datos
    Person.findOne({ name: body.name })
        .then(existingPerson => {
            if (existingPerson) {
                return response.status(400).json({
                    error: 'name must be unique'
                });
            }

            const person = new Person({
                name: body.name,
                number: body.number
            });

            person.save().then(savedPerson => {
                response.json(savedPerson);
            });
        })
        .catch(error => {
            console.log(error.message);
            response.status(500).json({ error: 'Internal Server Error' });
        });


})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    const person = {
        name: body.name,
        number: body.number,
    }

    Person.findByIdAndUpdate(request.params.id, person, { new: true })
        .then(updatedPerson => {
            response.json(updatedPerson)
        })
        .catch(error => next(error))
})

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
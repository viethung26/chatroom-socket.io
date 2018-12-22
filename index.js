const express = require('express')
let app = express()
const server = require('http').Server(app)
const PORT = process.env.PORT || 3000
const io = require('socket.io')(server)

let names = []
let msgs = []
app.use(express.static('public'))
app.set('view engine', 'pug')
app.set('views', './views')

io.on('connection', socket=> {
    socket.on('disconnect', ()=> {
        let index = names.indexOf(socket.name)
        if(index !== -1) {
            names.splice(index, 1)
            io.sockets.emit('online-list', names)            
        }
    })
    socket.on('new-name', name=> {
        if(names.indexOf(name)==-1 && socket.name === undefined) {
            names.push(name)
            socket.name = name
            socket.emit('accept')
            io.sockets.emit('online-list', names)
        } else {
            socket.emit('refuse')
        }
    })
    socket.on('is-typing', ()=> {
        socket.broadcast.emit('person-is-typing', socket.name)
    })
    socket.on('was-leaved', ()=> {
        socket.broadcast.emit('person-was-leaved', socket.name)
    })
    socket.on('chat', msg=> {
        let newchat = {name: socket.name, msg}
        msgs.push(newchat)
        io.sockets.emit('new-msg', newchat)
    })
})

app.get('/', (req, res)=> {
    res.render('index')
})
server.listen(PORT, ()=> {
    console.log(`server is running at port ${PORT}`)
})
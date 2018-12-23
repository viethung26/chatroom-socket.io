const express = require('express')
let app = express()
const server = require('http').Server(app)
const PORT = process.env.PORT || 3000
const io = require('socket.io')(server)

let names = []
let rooms = []
let msgs = []
app.use(express.static('public'))
app.set('view engine', 'pug')
app.set('views', './views')

const updateRoomMember = roomName => {
    let names = []
    if(io.sockets.adapter.rooms[`${roomName}`])
    // console.log(io.sockets.adapter.rooms[`${roomName}`])
        for(id in io.sockets.adapter.rooms[`${roomName}`].sockets) {
        {
            names.push(io.sockets.sockets[`${id}`].name)
        }
    }
    return names
}

io.on('connection', socket=> {
    socket.on('disconnect', ()=> {
        let index = names.indexOf(socket.name)
        if(index !== -1) {
            names.splice(index, 1)
        }
        index = rooms.findIndex(room=> room.name === socket.roomName)
        if(index!==-1) {
            let room = (socket.adapter.rooms[`${socket.roomName}`])
            if(room) {
                rooms[index].number = room.length
                rooms[index].members = updateRoomMember(socket.roomName)
                io.sockets.in(socket.roomName).emit('online-list', rooms[index].members)
            } else {
                rooms.splice(index,1)
            }
            io.sockets.emit('rooms', rooms)            
        }
    })
    socket.on('new-name', name=> {
        if(names.indexOf(name)==-1 && socket.name === undefined) {
            names.push(name)
            socket.name = name
            socket.emit('accept')
            io.sockets.emit('rooms', rooms)
        } else {
            socket.emit('refuse')
        }
    })
    socket.on('create-room', roomName=> {
        let isExisted = rooms.some(room=>{
            return room.name === roomName
        })
        if(!isExisted) {
            socket.join(roomName)
            socket.roomName = roomName
            let newRoom = {name: roomName, owner: socket.name, number: 1, members: [socket.name]}
            rooms.push(newRoom)
            io.sockets.emit('rooms', rooms)
            socket.emit('enter-room')
            io.sockets.in(roomName).emit('online-list', newRoom.members)
        } else io.sockets.emit('room-existed')
    })
    socket.on('join-room', roomName=> {
        let index = rooms.findIndex(room=> room.name === roomName)
        if(index!==-1) {
            socket.join(roomName)
            socket.roomName = roomName
            rooms[index].number = (socket.adapter.rooms[`${roomName}`].length)
            rooms[index].members = updateRoomMember(roomName)
            io.sockets.emit('rooms', rooms)
            socket.emit('enter-room')
            io.sockets.in(roomName).emit('online-list', rooms[index].members)
        }
    }) 
    socket.on('is-typing', ()=> {
        socket.in(socket.roomName).broadcast.emit('person-is-typing', socket.name)
    })
    socket.on('was-leaved', ()=> {
        socket.in(socket.roomName).broadcast.emit('person-was-leaved', socket.name)
    })
    socket.on('chat', msg=> {
        let newchat = {name: socket.name, msg}
        msgs.push(newchat)
        io.sockets.in(socket.roomName).emit('new-msg', newchat)
    })
})

app.get('/', (req, res)=> {
    res.render('index')
})
server.listen(PORT, ()=> {
    console.log(`server is running at port ${PORT}`)
})
var server = require('./server.js').startServer();
var io = require('socket.io')(server);
var connectCount = 0;

io.on('connection', function( socket ) {
    connectCount++
    console.log( "users connected:" + connectCount );

    socket.on('disconnect', function() {
        console.log("user disconnected");
        connectCount--;
    }).on('makeChange', function( todoArr ) {
        todoList = todoArr;
        io.emit( 'updatedDoc', {} );
    })

})

const mongo = require('mongodb').MongoClient;
const io = require('socket.io').listen(4000);

// connect to mongodb
mongo.connect('mongodb://127.0.0.1', function(err, client) {
    if(err) {
        throw err;
    }

    var db = client.db('mongochat');

    console.log('MongoDB connected...');

    io.on('connection', function(socket) {

        let chat = db.collection('chats');

        // chat.deleteMany();

        // send status to server
        sendStatus = function(s) {
            socket.emit('status', s);
        }

        // get chats mongo collections
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err) {
                throw err;
            }

            // emit the messages
            socket.emit('output', res);
        });

        // handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            // check for name and message
            if(name == '' || message == '') {
                // send err status
                sendStatus('Please enter a name and message');
            } else {
                chat.insertOne({name: name, message: message}, function(){
                    socket.emit('output', [data]);

                    // send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            
            //Remove all chats from collection
            chat.deleteMany({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });

        });

    });

});
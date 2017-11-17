var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

const valuesToStore = 10;
const coolTemperature = 90;
let previous = [];
let status = 'cool';

io.on('connection', function(socket){
  // Emit the current state
  io.emit('status', status);

  socket.on('pub', function(msg){
    // Only store the last X
    if (previous.length >= valuesToStore) {
      previous = previous.slice(1);
    } 
    previous.push(JSON.parse(msg));
    // Only do warming up / cooling if we have enough data points
    if (previous.length === valuesToStore) {
      const halfLength = valuesToStore / 2;
      const oldData = previous.slice(0, halfLength);
      const newData = previous.slice(halfLength);

      const oldAvg = oldData.reduce((total, data) => { return total + parseFloat(data.fahrenheit) }, 0) / halfLength;
      const newAvg = newData.reduce((total, data) => { return total + parseFloat(data.fahrenheit) }, 0) / halfLength;

      if (oldAvg < coolTemperature && newAvg < coolTemperature) {
        if (status !== 'cool') {
          status = 'cool';
          io.emit('status', status);
        }
      } else if (oldAvg > newAvg) {
        if (status !== 'cooling') {
          status = 'cooling';
          io.emit('status', status);
        }
      } else if (oldAvg < newAvg) {   if (status !== 'warming') {
          status = 'warming';
          io.emit('status', status);
        }
      }
    }
    io.emit('temperature', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});


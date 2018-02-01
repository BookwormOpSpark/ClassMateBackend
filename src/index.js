/* eslint-disable no-console */
const logger = require('winston');
const app = require('./app');
const port = app.get('port');
const server = app.listen(port);
const io = require('socket.io')(server, { 'pingInterval': 2000, pingTimeout: 30000 });

io.on('connection', (socket) => {
  // console.log('User connected');
  socket.on('disconnect', () => {
    // console.log('User disconnected');
  });
  socket.on('raise-hand', (data) => {
    console.log(data);
    io.emit('new-message', { message: data });
  });
});

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
);

server.on('listening', () =>
  logger.info('Feathers application started on http://%s:%d', app.get('host'), port)
);

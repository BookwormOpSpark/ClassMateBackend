/* eslint-disable no-console */
const logger = require('winston');
const app = require('./app');
const port = app.get('port');
const server = app.listen(port);
const io = require('socket.io')(server, { 'pingInterval': 2000, pingTimeout: 30000 });

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
  });
  socket.on('raise-hand', (data) => {
    console.log(data);
    io.emit(`${data.sessionID}`, { student: data.student, time: data.time });
  });
});

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
);

server.on('listening', () =>
  logger.info('Feathers application started on http://%s:%d', app.get('host'), port)
);

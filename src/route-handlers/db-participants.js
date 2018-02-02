const Sequelize = require('sequelize');
const db = require('../../app/seeders/db.js');


// Creation of Participant into session

const addParticipant = (info) => {
  // find session associated with info.joinCode. save sessionID and name of class
  // figure out what piece of data can be sent to determine whether or not the user in question is a teacher or student
  // possibly email? if info.email ? participantType = 2 | participantType = 1
  // use sessionID along with info.userID to create a participant in that particular session
  // send back participant info( which will include sessionID ), as well as the saved name of class
  const user = info.userId;
  const type = 1;
  return db.Session.findAll({
    where:{
      id: info.sessionId,
    },
  })
    .then(result => {
      const session = result[0].dataValues;
      const className = session.description;
      const classId = session.id;
      return db.Participant.findOrCreate({
        where:{
          id_user: user,
          id_session: classId
        },
        defaults:{
          id_user: user,
          id_session: classId,
          id_participant_type: type
        },
      })
        .then(result => {
          const participant = result[0].dataValues;
          const format = {
            participantId: participant.id,
            sessionId: classId,
            className: className,
          };
          return format;
        })
        .catch(err => {
          console.error(err, 'inner create participant error');
        });
    })
    .catch(err => {
      console.error(err, 'outer create participant error');
    });
};

const searchParticipants = (sessionId) => {
  return db.Participant.findAll({
    where:{
      id_session: sessionId
    },
  })
    .then(roster => {
      const userIds = [];
      roster.forEach(el => userIds.push(el.dataValues.id_user));
      return db.User.findAll({
        where:{
          id: userIds
        },
      })
        .then(user => {
          const format = [];
          user.forEach(usr => {
            roster.forEach(el => {
              // console.log(el, 'el from searchparticipants');
              // console.log(usr, 'user from searchParticipants');
              // console.log(el.dataValues.id, 'participantID');
              if (usr.id === el.id_user && !usr.email) {
                format.push({ id: usr.id, nameFirst: usr.nameFirst, nameLast: usr.nameLast, participantId: el.dataValues.id, photoUrl: el.dataValues.photoUrl });
              }
            });
          });
          return format;
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
};

module.exports.addParticipant = addParticipant;
module.exports.searchParticipants = searchParticipants;

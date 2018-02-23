const Sequelize = require('sequelize');
const db = require('../../app/seeders/db.js');

const uploadHomework = (participantId, assignmentId, photoUrl) => {
  // console.log(participantId, 'this is participantID in uploadHomework');
  return db.Homework.create({
    id_participant: participantId,
    id_assignment: assignmentId,
    photoUrl
  })
    .then(result => result)
    .catch(err => console.error(err));
};

const findHomework = (arr, assignmentId) => {
  // console.log(arr, 'arr from findHomework');
  // console.log(assignmentId, 'assignmentId from findHomework'); 
  return db.Homework.findAll({
    where: {
      id_participant: arr,
      id_assignment: assignmentId,
    },
  })
    .then(results => {
      // console.log(results, 'results from findHomework');
      return results;
    })
    .catch(err => console.error(err));
}


module.exports.uploadHomework = uploadHomework;
module.exports.findHomework = findHomework;

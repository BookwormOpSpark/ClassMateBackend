const Sequelize = require('sequelize');
const db = require('../../app/seeders/db.js');

// Create Badges
const createBadges = (badgeId, participantId) => {
  return db.Participant_Badge.create({
    id_participant: participantId,
    id_badge: badgeId,
  })
    .then(result => {
      return result;
      // console.log(result);
    })
    .catch(err => {
      console.error(err);
    });
};

const allBadges = () => {
  return db.Badge.findAll({
    where: {
      icon: 'null'
    }
  })
    .then(results => {
      // console.log(results, 'results from db.badge.findAll');
      return results;
    })
    .catch(err => console.error(err));
};

const findBadges = (id) => {
  return db.Participant_Badge.findAll({
    where: {
      id_participant: id,
    },
  })
    .then(results => {
      // console.log(results);
      return results;
    })
    .catch(err => console.error(err));
};

module.exports.createBadges = createBadges;
module.exports.allBadges = allBadges;
module.exports.findBadges = findBadges;

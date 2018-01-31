const Sequelize = require('sequelize');
const db = require('../../app/seeders/db.js');

const createToken = (userId, token) => {
  return db.user_notification.findAll({
    where: {
      id_user: userId
    }
  })
    .then(results => {
      if (!results.dataValues) {
        return db.user_notification.create({
          id_user: userId,
          pushToken: token
        })
          .then(result => result)
          .catch(err => console.error(err));
      } else {
        return 'Already Created';
      }
    })
    .catch(err => console.error(err))
};

const findToken = (userId) => {
  return db.user_notification.findAll({
    where:{
      id_user: userId
    }
  })
    .then(result => result[0].dataValues)
    .catch(err => console.error(err));
};

module.exports.createToken = createToken;
module.exports.findToken = findToken;

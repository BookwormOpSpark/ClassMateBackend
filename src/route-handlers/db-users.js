/* eslint-disable */

const Sequelize = require('sequelize');
const db = require('../../app/seeders/db.js');
const passport = require('passport');
const bcrypt = require('bcrypt');
const localStrategy = require('passport-local').Strategy;

// Teacher Creation/Find
const findOrCreateTeacher = (info) => {
  return db.User.findOrCreate({
    where:{
      email: info.email,
    },
    defaults: {
      nameFirst: info.given_name,
      nameLast: info.family_name,
      email: info.email,
      photoUrl: info.picture,
      id_emergencyContact: null,
    },
  })
    .spread(({ dataValues }) => {
      // console.log(dataValues, 'dataValues');
      if (dataValues.id_emergencyContact !== null) {
        return db.EmergencyContact.findAll({
          where: {
            id: dataValues.id_emergencyContact,
          },
        })
          .then(result => {
            const format = {
              user: dataValues,
              emergencyContact: result,
            };
            return format;
          })
          .catch(err => console.error(err));
      } else {
        const format = {
          user: dataValues,
        };
        return format;
      }
    })
    .catch(err => {
      console.error(err);
    });
};

// LOCAL AUTH
// ============================
const hashPassword = (password) => {
  let salt = bcrypt.genSaltSync(10);
  let hash = bcrypt.hashSync(password, salt);
  return hash;
};

const comparePassword = (studentPassword, hash) => {
  return bcrypt.compareSync(studentPassword, hash);
}
// =============================


// Student Creation/Find
const findOrCreateStudent = (student) => {
  student.password = hashPassword(student.password);
  return db.User.findOrCreate({
    where: {
      username: student.username,
      password: student.password,
    },
    defaults: {
      username: student.username,
      password: student.password,
      nameFirst: student.nameFirst,
      nameLast: student.nameLast,
      gradeLevel: student.gradeLevel,
      id_emergencyContact: null,
    },
  })
    .spread((found, created) => {
      if (found.dataValues.id_emergencyContact !== null) {
        return db.EmergencyContact.findAll({
          where: {
            id: found.dataValues.id_emergencyContact,
          },
        })
          .then(result => {
            const format = {
              user: found.dataValues,
              emergencyContact: result,
            };
            return format;
          })
          .catch(err => console.error(err));
      } else {
        const format = {
          user: found.dataValues,
        };
        return format;
      }
      
    })
    .catch(err => {
      console.error(err, 'findOrCreateStudent error');
    });
};

//Find Student
const findStudent = (student) => {
  return db.User.find({
    where:{
      username: student.username
    }, 
  })
  .then(result => {
    if(result === null){
      return 'user not found'
    }else if (comparePassword(student.password, result.password)) {
      if (result.dataValues.id_emergencyContact !== null) {
        return db.EmergencyContact.findAll({
          where: {
            id: result.dataValues.id_emergencyContact,
          },
        })
          .then(contact => {
            const format = {
              user: result.dataValues,
              emergencyContact: contact,
            };
            return format;
          })
          .catch(err => console.error(err));
      } else {
        const format = {
          user: result.dataValues,
        };
        return format;
      }
    } else {
      return 'incorrect password';
    }
  })
  .catch(err => console.error(err));
};

const findStudentInfo = (id) => {
  return db.User.find({
    where: {
      id: id
    },
  })
    .then(result => {
      const student = result.dataValues
      if (student.id_emergencyContact) {
        return db.EmergencyContact.find({
          where: {
            id: student.id_emergencyContact
          },
        })
        .then(emergencyContact => {
          const result = emergencyContact.dataValues
          const format = {
            nameFirst: student.nameFirst,
            nameLast: student.nameLast,
            photoUrl: student.photoUrl,
            emergencyContact: {
              nameFirst: result.nameFirst,
              nameLast: result.nameLast,
              address: result.address,
              phone: result.email
            }
          }
          return format;
        })
        .catch(err => console.error(err));
      } else {
        const format = {
          nameFirst: student.nameFirst,
          nameLast: student.nameLast,
          photoUrl: student.photoUrl
        }
        return format;
      }
    })
    .catch(err => console.error(err));
};

module.exports.findOrCreateTeacher = findOrCreateTeacher;
module.exports.findOrCreateStudent = findOrCreateStudent;
module.exports.findStudent = findStudent;
module.exports.findStudentInfo = findStudentInfo;
module.exports.hashPassword = hashPassword;
module.exports.comparePassword = comparePassword;

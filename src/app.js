const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('winston');
const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');
const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');
const google = require('googleapis');
const jwt = require('jsonwebtoken');
const db = require('../app/seeders/db.js');
const userDB = require('./route-handlers/db-users.js');
const assignmentDB = require('./route-handlers/db-assignments.js');
const sessionDB = require('./route-handlers/db-sessions.js');
const participantDB = require('./route-handlers/db-participants.js');
const homeworkDB = require('./route-handlers/db-homework.js');
const emergencyContactDB = require('./route-handlers/db-emergencyContact.js');
const funStuffDB = require('./route-handlers/db-funstuff.js');
const tokenDB = require('./route-handlers/db-notifications.js');
const badgesDB = require('./route-handlers/db-badges.js');
const calApi = require('./services/calendar.js'); 
const Expo = require('expo-server-sdk');

const OAuth2 = google.auth.OAuth2;
const app = express(feathers());
const aws = require('aws-sdk');

require('dotenv').load();

app.configure(configuration());

app.use(cors());
app.use(helmet());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));

app.use('/', express.static(app.get('public')));

app.configure(express.rest());
app.configure(socketio());
app.configure(middleware);
app.configure(services);
app.configure(channels);

app.use(express.errorHandler({ logger }));

app.hooks(appHooks);
/// ***************CLOUDINARY****************
const cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'fido',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const fileUpload = require('express-fileupload');
app.use(fileUpload());
///****************S3********************** */
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1',
});

// ===============================
// User login/creations ==========
// ===============================
app.post('/login', (req,res) => {
  const user = new OAuth2(process.env.GOOGLE_CALENDAR_CLIENT_ID, process.env.GOOGLE_CALENDAR_SECRET, '');
  let teacher;
  user.verifyIdToken(
    req.body.idtoken,
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    (err, login) =>{
      if (err) {
        console.error(err);
      }else{
        let userPayload = login.getPayload();
        let JWT = jwt.sign({
          user: user.id
        },
        'secret', {
          expiresIn: 24 * 60 * 60
        });
        userDB.findOrCreateTeacher(userPayload)
          .then((response) => res.status(201).send(response))
          .catch(err => console.error(err));
      }
    }
  );
});

app.post('/studentLogin', (req, res) => {
  const student = req.body;
  userDB.findStudent(student)
    .then(dbLoginResult => {
      if (dbLoginResult === 'user not found') {
        res.send('user not found');
      }else if(dbLoginResult === 'incorrect password'){
        res.send('incorrect password');
      }else{
        res.send(dbLoginResult.dataValues);
      }
    })
    .catch(err => {
      console.error('findStudent error: ', err);
    });
});

app.post('/studentCreate', (req, res) => {
  const student = req.body;
  userDB.findOrCreateStudent(student)
    .then(student => {
      res.status(201).send(student);
    })
    .catch(err => console.error(err));
});

app.get('/studentInformation', (req, res) => {
  const studentId = req.query.id;
  userDB.findStudentInfo(studentId)
    .then(result => res.status(201).send(result))
    .catch(err => console.error(err));
});

// ===============================

// ===============================
// Session Routes ================
// ===============================
app.post('/addClass', (req, res) => {
  const user = req.body.userId;
  const session = {
    description: req.body.description,
    joinCode: req.body.joinCod
  };
  sessionDB.findOrCreateSession(session, user)
    .then(result => res.status(201).send(result))
    .catch(err => console.error(err));
});
// ===============================

// ===============================
// Homework Route ================
// ===============================
app.post('/upload/:participantId/:assignmentID', (req, res) => {
  const { participantId, assignmentID } = req.params;
  const newPhoto = req.files['photo'].data.toString('base64');
  const type = req.files['photo'].mimetype;
  // Uploads to cloudinary
  cloudinary.v2.uploader.upload(`data:${type};base64,${newPhoto}`, (err, photo) => {
    if (err) {
      console.error(err);
      res.status(400).send(err);
    } else {
      const photoUrl = photo.url;
      homeworkDB.uploadHomework(participantId, assignmentID, photoUrl)
        .then(result => res.status(201).send(result))
        .catch(err => console.error(err));
    }
  });
});
// ===============================
// ===============================
// Fun Stuffs Route ================
// ===============================
app.post('/funStuff/:id', (req, res) => {
  const sessionID = req.params.id;
  if (req.body.link) {
    const { link, type } = req.body;
    funStuffDB.createFunStuff(sessionID, link, type)
      .then(result => result)
      .catch(err => console.error(err));
    res.send(link);
  } else {
    const uploadParams = { Bucket: process.env.AWS_BUCKET, Key: '', Body: '' };
    const { mimetype } = req.files.document;
    const typePart = mimetype.split('/');
    const type = typePart[typePart.length - 1];
    const typeFinal = ['gif', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(type) ? 'image' : 'video';

    uploadParams.Body = req.files.document.data;
    uploadParams.Key = req.files.document.name;
    s3.upload(uploadParams, function (err, data) {
      if (err) {
        console.error('Error in s3', err);
      } if (data) {
        const document = data.Location;
        funStuffDB.createFunStuff(sessionID, document, typeFinal)
          .then(result => result)
          .catch(err => console.error(err));
        res.send(data.location);
      }
    });
    
  }
});

app.get('/funStuff/:id', (req, res) => {
  const sessionID = req.params.id;
  funStuffDB.findFunStuff(sessionID)
    .then(results => res.status(200).send(results))
    .catch(err => console.error(err));
});

app.delete('/deleteFunStuff/:id', (req, res) => {
  const id = req.params.id;
  funStuffDB.deleteFunStuff(id)
    .then(result => res.status(200).send(result))
    .catch(err => console.error(err));
});

// ===============================

// ===============================
// Emergency Contact Routes ======
// ===============================

app.post('/createEmergencyContact', (req, res) => {
  const info = req.body.emergencyContact;
  const userId = req.body.userId;
  emergencyContactDB.createEmergencyContact(info, userId)
    .then(results => res.status(201).send(results))
    .catch(err => console.error(err));
});

// ===============================
// Assignment Routes =============
// ===============================
app.post('/createAssignment', (req, res) => {
  const info = {
    sessionId: req.body.sessionId,
    title: req.body.assignment.title,
    dueDate: req.body.assignment.dueDate
  };
  assignmentDB.findOrCreateAssignment(info)
    .then(result => res.status(201).send(result))
    .catch(err => console.error(err));
});

app.post('/getAssignment', (req, res) => {
  const {sessionId} = req.body;
  assignmentDB.findAssignment(sessionId)
    .then(result => res.status(201).send(result))
    .catch(err => console.error(err));
});

app.get('/checkAssignment', (req, res) => {
  const sessionId = req.query.sessionId;
  const assignmentId = req.query.assignmentId;
  return assignmentDB.specificAssignment(sessionId, assignmentId)
    .then(results => res.status(201).send(results))
    .catch(err => console.error(err));
});

// ===============================

// ===============================
// Participant Routes ============
// ===============================
app.post('/joinClass', (req, res) => {
  const participant = {
    userId: req.body.userId,
    joinCode: req.body.joinCode
  };
  participantDB.addParticipant(participant)
    .then(result => res.status(201).send(result))
    .catch(err => console.error(err));
});

app.post('/classRoster', (req, res) => {
  const sessionId = req.body.sessionId;
  participantDB.searchParticipants(sessionId)
    .then(roster => res.status(201).send(roster))
    .catch(err => console.error(err)); 
});
// ===============================

// ===============================
// Notification Routes ===========
// ===============================

let expo = new Expo();

app.post('/firstNotification', (req, res) => {
  const { token, userID } = req.body;
  if (!Expo.isExpoPushToken(token)) {
    console.error(`Push token ${token} is not a valid Expo push token`);
  }
  tokenDB.createToken(userID, token)
    .then(results => res.status(201).send(results))
    .catch(err => console.error(err));
});

// need the userid,= to retrive the token notification, query the databse
app.post('/badgeNotification', (req, res) => {
  const { userId, className, studentName, teacherName } = req.body;
  tokenDB.findToken(userId)
    .then(result => {
      const token = result.pushToken;
      if (!Expo.isExpoPushToken(token)) {
        console.error(`Push token ${token} is not a valid Expo push token`);
      }
    
      const message = {
        to: token,
        sound: 'default',
        body: `Congratulations ${studentName}, You Got A Badge in ${className} by teacher ${teacherName}`,
      };
      (async () => {
        try {
          let receipts = await expo.sendPushNotificationsAsync(message);
        } catch (error) {
          console.error(error);
        }
        res.send('receipts');
      })();
    })
    .catch(err => console.error(err)); 
});
// ===============================

// ===============================
// Badge Routes ==================
// ===============================
// take the student id and the bage type
app.post('/badges', (req, res) => {
  const { badgeId, studentId } = req.body;
  // console.log(req.body);
  badgesDB.createBadges(badgeId, studentId)
    .then(results => {
      res.status(201).send(results.dataValues);
    })
    .catch(err => console.error(err));
});

app.get('/badges', (req, res) => {
  const { studentID } = req.query;
  badgesDB.findBadges(studentID)
    .then(results => res.status(201).send(results))
    .catch(err => console.error(err));
});

app.get('/badgeInfo', (req, res) => {
  badgesDB.allBadges()
    .then(results => {
      res.status(200).send(results);
    })
    .catch(err => console.error(err));
});
// ===============================

// ===============================
// Large Routes ==================
// ===============================
app.get('/dashboard', (req, res) => {
  const userId = req.query.userId;
  sessionDB.getSessions(userId)
    .then((sessionInfo) => {
      calApi.getCalendar(sessionInfo)
        .then((formattedCalendar) => {
          const reformat = {
            sessionInfo,
            formattedCalendar
          };
          res.status(201).send(reformat);
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
});

app.get('/classInfo', (req, res) => {
  const sessionId = req.query.sessionId;
  assignmentDB.findAssignment(sessionId)
    .then(assignments => {
      participantDB.searchParticipants(sessionId)
        .then(participants => {
          const students = [];
          participants.forEach(el => {
            // console.log(el);
            if (!el.email) {
              students.push({ id: el.id, nameFirst: el.nameFirst, nameLast: el.nameLast, participantId: el.participantId });
            }
          });
          const format = {
            assignments,
            students
          };
          // console.log(format, 'format from /classInfo');
          res.status(201).send(format);
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
});
// ===============================

module.exports = app;

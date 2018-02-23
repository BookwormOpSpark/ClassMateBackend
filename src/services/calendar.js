/* eslint-disable */

const cronofy = require('cronofy');
require('dotenv').load();


const client = new cronofy({
    access_token: process.env.CRONOFY_ACCESS_TOKEN,
});

//Get today's current date
let now = new Date();
now = JSON.stringify(now);
let today = now.split('T')[0].slice(1, now.length-1);
let currentYear = today.slice(0, 4);
let monthDay = today.slice(5, today.length);
let currentDate = `${monthDay}-${currentYear}`;

const getCalendar = (sessionInfo) => {
    const calEvents = [];
    const returnEvents = [];
    let calendars = [];
    for(let i=0; i<sessionInfo.sessions.length; i++){
        calendars.push(sessionInfo.sessions[i].sessionName);
    }
    var options = {
        tzid: 'America/Chicago',
        from: now,
        // calendar_ids: 'cal_W15uIo2@zzUVAA4u_1e-xBTEfV1j1wWk-Zqk57w',
    };
    
    return client.readEvents(options)
    .then(function (events) {
        for(let j=0; j<calendars.length; j++){
            for(let i=0; i<events.events.length; i++){
                if(events.events[i].summary === calendars[j]){
                    calEvents.push(events.events[i]);
                }
            }
        }
        for(let i=0; i<calEvents.length; i++){
            let eventDate = convertTime(calEvents[i].start);
            if(eventDate.date === currentDate){
                let event = {
                    summary: '',
                    // description: '',
                    startTime: '',
                    endTime: '',
                    location: '',
                }
                event.summary = calEvents[i].summary;
                // event.description = calEvents[i].description;
                event.startTime = convertTime(calEvents[i].start);
                event.endTime = convertTime(calEvents[i].end);
                // event.location = calEvents[i].location.description;
                // console.log('event: ', event);
                returnEvents.push(event);
            }
        }
        // console.log('return Events: ', returnEvents);
        return returnEvents;
    })
    .catch(err => {
        console.error(err);
    });
};

// '2018-01-23T14:00:00Z'

const convertTime = (timeString) =>{
    const timeSplit = timeString.split('T');
    let date = timeSplit[0];
    let year = date.slice(0,5);
    year = year.slice(0,4);
    date = `${date.slice(5)}-${year}`;
    let time = timeSplit[1];
    time = time.slice(0,8);
    let hours = time.slice(0,2);
    hours = JSON.parse(hours);
    hours = hours - 6;
    if(hours > 12){
        hours = hours - 12;
    }
    hours = hours.toString();
    time = hours+time.slice(2);
    return {date: date, time: time}
}

module.exports.getCalendar = getCalendar;

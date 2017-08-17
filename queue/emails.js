'use strict';

// prevent MaxListenersExceededWarning
require('events').EventEmitter.defaultMaxListeners = 0;

const kue = require('kue');

// connect to redis
// kue will automatically look for redis as the default connection
let redisConfig;
if (process.env.NODE_ENV === 'production') {
  redisConfig = {
    redis: {
      port: process.env.REDIS_PORT,
      host: process.env.REDIS_HOST,
      auth: process.env.REDIS_PASS,
      options: {
        no_ready_check: false
      }
    }
  };
} else {
  redisConfig = {};
}

// start a queue
const queue = kue.createQueue(redisConfig);

// helps guard against stuck or stalled jobs
queue.watchStuckJobs(6000);

queue.on('ready', () => {
  // If you need to
  console.info('Queue is ready!');
});

queue.on('error', (err) => {
  // handle connection errors here
  console.error('There was an error in the main queue!');
  console.error(err);
  console.error(err.stack);
});

// set up UI
kue.app.listen(process.env.KUE_PORT);
kue.app.set('title', 'Kue');

// make some dummy data
const dummyData = (numberOfEmailsToCreate, index) => {
  const createdDummyData = [];
  for (var i = 0; i < numberOfEmailsToCreate; i++) {
    createdDummyData.push({
      title: `Email ${index + 1} was successfully fired!`,
      subject: "You've got mail!",
      to: `${index + 1}@tourconnect.com`,
      body: 'Foo bar',
      emailToken: `token - ${index + 1}`,
      received: true,
      receivedAt: new Date('August 17, 2017 00:00:00'),
      createdAt: new Date('August 17, 2017 00:00:00'),
      companyId: `${index + 1}`,
      templateVars: {
        firstName: 'John',
        lastName: 'Smith',
        contractingPeriod: '01/04/2018 - 30/03/2019',
        customMessage: 'Hello world!',
      },
    });
  }
  return createdDummyData;
};

// generate X number of data
const createDummyData = (i) => {
  if (i) return dummyData(30, i);
  return dummyData(30);
};

// add data to Redis to be processed
function addToQueue(data, done) {
  queue.create('email', data)
    .priority('critical') // create a email job with the highest priority,
    .attempts(8) // re-attempt up to 8 times
    .backoff(true) // use backoff timing - sets it to the job's original delay (if set) at each attempt - this is for job retries
    .removeOnComplete(false) // do not remove the job once complete - to see in the admin user interface
    .on('complete', function (){
      console.log('Email was successful');
    })
    .on('failed', function (){
      console.log('Email failed');
    })
    .save();
}

// func to actually do some stuff
function email(address, done) {
  if (!address) {
    return done(new Error('invalid to address'));
  }
  // email send stuff...
  console.log('Email Success!');
  done();
}

// This checks to see if there's anything in the Redis queue and if so, process it
// processes 50 at a time
queue.process('email', 50, function(job, done) {
  /* carry out all the job function here */
  email(job.data.to, done);
  done();
});

setInterval(function () {
  // this adds the job to the Redis queue
  createDummyData().map((data, i) => addToQueue(data));
}, 3000);

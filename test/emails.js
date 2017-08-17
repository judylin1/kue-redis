"use strict";

const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);
const queue = require('kue').createQueue();
const test = require('tape');

const dummyData = (numberOfEmailsToCreate, index) => {
  const createdDummyData = [];
  for (var i = 0; i < numberOfEmailsToCreate; i++) {
    createdDummyData.push({
      title: `Email ${index + 1} was successfully fired!`,
      subject: "You've got mail!",
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

const createDummyData = (i) => {
  if (i) return dummyData(30, i);
  return dummyData(30);
};

test('Receiving and processing emails', t => {
  createDummyData().map((dummy, i) => {
    api
      .post('/emails')
      .send(createDummyData(i)[i])
      .end((err, res) => {
        const emailData = res.body.emailData;

        // Check for response body
        t.ok(res.body, 'Should respond with a body');

        // Check for response meta properties
        t.equals(res.body.success, true, 'The success property should be true');
        t.equals(res.body.error, null, 'The error property should be null');
        t.ok(res.body.message, 'Should have a message property');

        // Check to see if the order is intact
        t.equals(emailData.received, true, 'Should have been received');
        t.equals(emailData.emailToken, createDummyData(i)[i].emailToken, 'Email token should be the same');
        t.equals(emailData.body, createDummyData(i)[i].body, 'Email body should be the same');
        t.deepEqual(emailData.templateVars, createDummyData(i)[i].templateVars, 'Template vars should be the same');
      });
  })
  t.end();
});

// test('Creating emails and processing items with the queue', t => {
//   queue.testMode.enter();
//
//   dummyData(createDummyData()).map((order, i) => {
//     queue.createJob('email', dummyData(createDummyData(), i)[i]).save();
//   });
//
//   t.equal(queue.testMode.jobs.length, createDummyData(), `There should be ${createDummyData()} jobs`);
//
//   queue.testMode.clear();
//   queue.testMode.exit()
//   t.end();
// });

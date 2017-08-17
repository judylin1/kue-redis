'use strict';

const router = require('express').Router();
const email = require('../queue/emails');

router.post('/', (req, res, next) => {
  const emailData = req.body;
  email.create(emailData, (err) => {
    if (err) {
      return res.json({
        error: err,
        success: false,
        message: 'Could not fire email',
      });
    } else {
      return res.json({
        error: null,
        success: true,
        message: 'Successfully fired email',
        emailData
      });
    }
  })
});

module.exports = router;

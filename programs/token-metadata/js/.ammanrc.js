'use strict';
// @ts-check
const base = require('../../.ammanrc.js');

const validator = { ...base.validator, programs: [base.programs.metadata] };
module.exports = { validator };

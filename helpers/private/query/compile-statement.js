/* eslint-disable no-use-before-define */
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Sync function that returns a friendly sql statement for easy manipulation in the OrientDb driver
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const _ = require('@sailshq/lodash');

module.exports = function compileStatement(options) {
  const { model, method } = options;

  const passedcriteria = options.criteria;

  // Hold the final query value
  const query = {};

  // Validate options
  if (!model) {
    throw new Error('Convert must contain a model to use to build the query.');
  }

  if (!method) {
    throw new Error('Convert must contain a method to use to build the query.');
  }

  // Validate Criteria Input is a dictionary
  if (passedcriteria && !_.isPlainObject(passedcriteria)) {
    throw new Error('Criteria must be a dictionary.');
  }

  // Validate Criteria Input contains a WHERE clause
  if (
    passedcriteria
    && _.keys(passedcriteria).length
    && !_.has(passedcriteria, 'where')
  ) {
    throw new Error('Criteria must contain a WHERE clause.');
  }

  const statement = passedcriteria.where;

  console.log('CRITERIA: ', passedcriteria);

  //   const statement = {
  //     FirstName: 'Ben',
  //     NickName: 'TBag',
  //     BORN: { $gte: 500 },
  //     $or: [{ LastName: 'Gaitho' }, { LastName: 'Kimondo' }],
  //     SecondName: { $in: ['James', 'John', 'Paul'] },
  //     DOB: { $nin: [2000, 2003, 1990] },
  //     YEAR: { $between: [1980, 2010] },
  //   };

  function getInStatement(arr) {
    let str = '';
    if (Array.isArray(arr) && arr.length > 1) {
      str = `IN [${arr.map(v => (Number(v) ? v : `'${v}'`))}]`;
    } else {
      throw new Error('the IN statement expects an array of values.');
    }

    return str;
  }

  function getNotInStatement(arr) {
    let str = '';
    if (Array.isArray(arr) && arr.length > 1) {
      str = `NOT IN [${arr.map(v => (Number(v) ? v : `'${v}'`))}]`;
    } else {
      throw new Error('the IN statement expects an array of values.');
    }

    return str;
  }

  function getBetweenStatement(arr) {
    const btwn = [];
    if (Array.isArray(arr) && arr.length === 2) {
      btwn.push(arr[0]);
      btwn.push(arr[1]);
    } else {
      throw new Error(
        'An array of two values is expected in the BETWEEN criteria',
      );
    }
    return `BETWEEN ${btwn.join(' AND ')}`;
  }

  function getComparison(obj) {
    let str = null;
    _.each(obj, (value, key) => {
      switch (key.toLowerCase()) {
        case '$gt':
          str = `> ${value}`;
          return;
        case '$gte':
          str = `>= ${value}`;
          return;
        case '$lt':
          str = `< ${value}`;
          return;
        case '$lte':
          str = `<= ${value}`;
          return;
        case '$ne':
          str = `<> ${value}`;
          return;

        case '>':
          str = `> ${value}`;
          return;
        case '>=':
          str = `>= ${value}`;
          return;
        case '<':
          str = `< ${value}`;
          return;
        case '<=':
          str = `<= ${value}`;
          return;
        case '<>':
          str = `<> ${value}`;
          return;
        case '!=':
          str = `<> ${value}`;
          return;
        case '$in':
          str = getInStatement(value);
          return;
        case '$nin':
          str = getNotInStatement(value);
          return;
        case '$between':
          str = getBetweenStatement(value);
          return;
        default:
          str = null;
      }
    });
    return str;
  }

  function getAndStatement(obj) {
    const criteria = [];
    const str = null;
    _.each(obj, (value, key) => {
      console.log('KEY: ', key.toLowerCase());
      if (key.toLowerCase() === '$or') {
        criteria.push(`(${getOrStatement(value)})`);
        return;
      }

      if (key.toLowerCase() === '$between') {
        criteria.push(`BETWEEN ${getAndStatement(value)}`);
        return;
      }

      if (_.isObject(value)) {
        criteria.push(`${key} ${getComparison(value)}`);
        return;
      }

      criteria.push(`${key} = ${Number(value) ? value : `'${value}'`}`);
    });

    if (str) {
      return str;
    }

    return criteria.join(' AND ');
  }

  function getOrStatement(arr) {
    const orst = [];
    if (Array.isArray(arr) && arr.length > 1) {
      _.each(arr, (obj) => {
        orst.push(getAndStatement(obj));
      });
    } else {
      throw new Error(
        'We expect an array of more than one objects on the OR criteria',
      );
    }
    return orst.join(' OR ');
  }

  function selectValues(values) {
    const vals = [...values] || [];
    return [...values, '@rid'];
  }

  const compiledcriteria = getAndStatement(statement);

  return {
    ...passedcriteria,
    select: selectValues(passedcriteria.select),
    selectClause: selectValues(passedcriteria.select).join(', '),
    whereClause: compiledcriteria,
  };
};

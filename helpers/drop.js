//  ██████╗ ██████╗  ██████╗ ██████╗
//  ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
//  ██║  ██║██████╔╝██║   ██║██████╔╝
//  ██║  ██║██╔══██╗██║   ██║██╔═══╝
//  ██████╔╝██║  ██║╚██████╔╝██║
//  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝
//

module.exports = require('machine').build({
  friendlyName: 'Drop',

  description: 'Remove a table from the database.',

  inputs: {
    datastore: {
      description: 'The datastore to use for connections.',
      extendedDescription:
        'Datastores represent the config and manager required to obtain an active database connection.',
      required: true,
      example: '===',
    },

    tableName: {
      description: 'The name of the table to destroy.',
      required: true,
      example: 'users',
    },

    meta: {
      friendlyName: 'Meta (custom)',
      description: 'Additional stuff to pass to the driver.',
      extendedDescription:
        'This is reserved for custom driver-specific extensions.',
      example: '===',
    },
  },

  exits: {
    success: {
      description: 'The table was destroyed successfully.',
    },

    badConnection: {
      friendlyName: 'Bad connection',
      description:
        'A connection either could not be obtained or there was an error using the connection.',
    },
  },

  fn: async function drop(inputs, exits) {
    // Dependencies
    const _ = require('@sailshq/lodash');
    const Helpers = require('./private');

    // Set a flag if a leased connection from outside the adapter was used or not.
    const leased = _.has(inputs.meta, 'leasedConnection');
    let tableName;

    let results;
    let session;
    try {
      session = await Helpers.connection.spawnOrLeaseConnection(
        inputs.datastore,
        inputs.meta,
      );
      //  ╔═╗╔═╗╔═╗╔═╗╔═╗╔═╗  ┌┬┐┌─┐┌┐ ┬  ┌─┐  ┌┐┌┌─┐┌┬┐┌─┐
      //  ║╣ ╚═╗║  ╠═╣╠═╝║╣    │ ├─┤├┴┐│  ├┤   │││├─┤│││├┤
      //  ╚═╝╚═╝╚═╝╩ ╩╩  ╚═╝   ┴ ┴ ┴└─┘┴─┘└─┘  ┘└┘┴ ┴┴ ┴└─┘

      tableName = Helpers.schema.escapeTableName(inputs.tableName);

      // Build native query
      const batch = `DROP CLASS ${tableName} UNSAFE`;

      try {
        results = await session.batch(batch).all();
        await Helpers.connection.releaseSession(session, leased);
      } catch (error) {
        if (error.code && (error.code === 5 || error.code === '5')) {
          // console.log(`Error while dropping ${tableName}`, error.code);
          await Helpers.connection.releaseSession(session, leased);
          return exits.success();
        }
        return exits.badConnection(`Error while dropping ${tableName}${error}`);
      }
      return exits.success(results);
    } catch (error) {
      if (session) {
        await Helpers.connection.releaseSession(session, leased);
      }
      return exits.badConnection(error);
    }
    //  ╔═╗╔═╗╔═╗╦ ╦╔╗╔  ┌─┐┌─┐┌┐┌┌┐┌┌─┐┌─┐┌┬┐┬┌─┐┌┐┌
    //  ╚═╗╠═╝╠═╣║║║║║║  │  │ │││││││├┤ │   │ ││ ││││
    //  ╚═╝╩  ╩ ╩╚╩╝╝╚╝  └─┘└─┘┘└┘┘└┘└─┘└─┘ ┴ ┴└─┘┘└┘
    // Spawn a new connection to run the queries on.
  },
});

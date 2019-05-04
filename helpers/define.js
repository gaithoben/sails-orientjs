//  ██████╗ ███████╗███████╗██╗███╗   ██╗███████╗
//  ██╔══██╗██╔════╝██╔════╝██║████╗  ██║██╔════╝
//  ██║  ██║█████╗  █████╗  ██║██╔██╗ ██║█████╗
//  ██║  ██║██╔══╝  ██╔══╝  ██║██║╚██╗██║██╔══╝
//  ██████╔╝███████╗██║     ██║██║ ╚████║███████╗
//  ╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝
//

module.exports = require('machine').build({
  friendlyName: 'Define',

  description: 'Create a new table in the database based on a given schema.',

  inputs: {
    datastore: {
      description: 'The datastore to use for connections.',
      extendedDescription:
        'Datastores represent the config and manager required to obtain an active database connection.',
      required: true,
      example: '===',
    },

    tableName: {
      description: 'The name of the table to describe.',
      required: true,
      example: 'users',
    },

    definition: {
      description: 'The definition of the schema to build.',
      required: true,
      example: {},
    },

    model: {
      description:
        'The model definition associated with the schema we want to build.',
      required: true,
      example: {},
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
      description: 'The table was created successfully.',
    },

    badConnection: {
      friendlyName: 'Bad connection',
      description:
        'A connection either could not be obtained or there was an error using the connection.',
    },
  },

  fn: async function define(inputs, exits) {
    // Dependencies
    const _ = require('@sailshq/lodash');
    const Helpers = require('./private');

    const { model } = inputs;

    if (!model.tableName) {
      return exits.error('TableName is not defined in the model.');
    }

    if (model.tableName !== inputs.tableName) {
      return exits.error(
        `Error in the definition of tableName property of the model associated with .${
          inputs.tableName
        }`,
      );
    }
    // Set a flag if a leased connection from outside the adapter was used or not.
    const leased = _.has(inputs.meta, 'leasedConnection');

    // Escape Table Name
    let tableName;
    let schema;
    let results;
    let session;
    try {
      //  ╔═╗╔═╗╔═╗╦ ╦╔╗╔  ┌─┐┌─┐┌┐┌┌┐┌┌─┐┌─┐┌┬┐┬┌─┐┌┐┌
      //  ╚═╗╠═╝╠═╣║║║║║║  │  │ │││││││├┤ │   │ ││ ││││
      //  ╚═╝╩  ╩ ╩╚╩╝╝╚╝  └─┘└─┘┘└┘┘└┘└─┘└─┘ ┴ ┴└─┘┘└┘
      // Spawn a new connection for running queries on.
      session = await Helpers.connection.spawnOrLeaseConnection(
        inputs.datastore,
        inputs.meta,
      );

      tableName = Helpers.schema.escapeTableName(inputs.tableName);
      schema = Helpers.schema.buildSchema(tableName, inputs.definition);

      // Build Query

      let batch = 'CREATE CLASS';
      // Determine whether we're creating Vertex, Edge or Just a document

      console.log(`Defining the model ${tableName} of type ${model.classType}`);

      switch (model.classType) {
        case 'Document':
          batch = `CREATE CLASS ${Helpers.query.capitalize(tableName)}`;
          break;
        case 'Vertex':
          batch = `CREATE CLASS ${Helpers.query.capitalize(
            tableName,
          )} EXTENDS V`;
          break;
        case 'Edge':
          batch = `CREATE CLASS ${Helpers.query.capitalize(
            tableName,
          )} EXTENDS E`;
          break;
        default:
          return exits.error(
            `The classtype associated with model ${tableName} is not known. Should be one of Document/Vertex/Edge`,
          );
      }

      batch = `${batch};\n ${schema};`;

      results = await session.batch(batch).all();

      await Helpers.connection.releaseSession(session, leased);

      return exits.success(results);
    } catch (error) {
      if (session) {
        await Helpers.connection.releaseSession(session, leased);
      }
      return exits.badConnection(error);
    }
  },
});

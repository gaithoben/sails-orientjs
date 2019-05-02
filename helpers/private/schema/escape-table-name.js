//  ███████╗███████╗ ██████╗ █████╗ ██████╗ ███████╗    ████████╗ █████╗ ██████╗ ██╗     ███████╗
//  ██╔════╝██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝    ╚══██╔══╝██╔══██╗██╔══██╗██║     ██╔════╝
//  █████╗  ███████╗██║     ███████║██████╔╝█████╗         ██║   ███████║██████╔╝██║     █████╗
//  ██╔══╝  ╚════██║██║     ██╔══██║██╔═══╝ ██╔══╝         ██║   ██╔══██║██╔══██╗██║     ██╔══╝
//  ███████╗███████║╚██████╗██║  ██║██║     ███████╗       ██║   ██║  ██║██████╔╝███████╗███████╗
//  ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚══════╝       ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝
//
//  ███╗   ██╗ █████╗ ███╗   ███╗███████╗
//  ████╗  ██║██╔══██╗████╗ ████║██╔════╝
//  ██╔██╗ ██║███████║██╔████╔██║█████╗
//  ██║╚██╗██║██╔══██║██║╚██╔╝██║██╔══╝
//  ██║ ╚████║██║  ██║██║ ╚═╝ ██║███████╗
//  ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝
//
// Given a table name, escape it for the database and add the postgres schema
// if needed.

const Capitalize = require('../query/capitalize');

module.exports = function escapeTableName(name) {
  name = `\`${Capitalize(name)}\``;
  return name;
};
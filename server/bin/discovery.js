'use strict';

const loopback = require('loopback');
const promisify = require('util').promisify;
const fs = require('fs');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdirp = promisify(require('mkdirp'));
const DATASOURCE_NAME = 'myDataSourceName';
const TABLE_NAME = 'myTableName';
const dataSourceConfig = require('../datasources.json');
const TABLE_NAME_LC = TABLE_NAME.toLowerCase();

const app = loopback();
const db = new loopback.DataSource(dataSourceConfig[DATASOURCE_NAME]);

discover().then(
  success => process.exit(),
  error => { console.error('UNHANDLED ERROR:\n', error); process.exit(1) },
);

async function discover() {

  const options = {relations: false};

  // Discover models and relations
  const mySchema = await db.discoverSchema(TABLE_NAME_LC, options);
  //We need this to set the modelname correctly in model-config, especially when we have complex table names
  console.log(mySchema.name);

  // Create model definition files
  await mkdirp('common/models');
  await writeFile(
    'common/models/'+TABLE_NAME_LC+'.json',
    JSON.stringify(mySchema, null, 2)
  );

  // Expose models via REST API
  const configJson = await readFile('server/model-config.json', 'utf-8');
  //console.log('MODEL CONFIG', configJson);
  const config = JSON.parse(configJson);
  config[mySchema.name] = {dataSource: DATASOURCE_NAME, public: true};
  await writeFile(
    'server/model-config.json',
    JSON.stringify(config, null, 2)
  );
}
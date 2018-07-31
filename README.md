# Loopback-discovery-example

This builds upon the basic [Hello-World](https://loopback.io/getting-started/) example adding a model discovery script using a MySQL datasource.

To use:

1.  Clone the repo: $git clone https://github.com/johnbarbic/loopback-discovery-example.git _YourDirectory_

2.  Run $nmp install - this example makes use of the loopback-connector-mysql, which you are installing as part of the repo.

3.  Edit /server/datasource.json replacing DATABASENAME, RDSHOST, RDSUSER, and RDSPASSWORD as appropriate (here we're assuming your db is hosted on AWS for example).

```
{
  "db": {
    "name": "db",
    "connector": "memory"
  },
  "DATABASENAME": {
    "host": "RDSHOST",
    "port": 3306,
    "database": "DATABASENAME",
    "password": "RDSPASSWORD",
    "name": "DATABASENAME",
    "user": "RDSUSER",
    "connector": "mysql"
  }
}
```

4.  Edit /server/bin/discovery.js replacing **myTableName** and **myDataSourceName** with appropriate values from your database.

```
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

// Create model definition files
await mkdirp('common/models');
await writeFile(
'common/models/'+TABLE_NAME_LC+'.json',
JSON.stringify(mySchema, null, 2)
);

// Expose models via REST API
const configJson = await readFile('server/model-config.json', 'utf-8');
console.log('MODEL CONFIG', configJson);
const config = JSON.parse(configJson);
config[TABLE_NAME] = {dataSource: DATASOURCE_NAME, public: true};
await writeFile(
'server/model-config.json',
JSON.stringify(config, null, 2)
);
}
```

5.  Run $ node . to see that the application comes up normally. Browsing the api would show the same endpoints from the Hello-World example.

6.  Run the discovery script:
    $ node ./server/bin/discovery.js

If all went well you should see log output along with a new or updated file in /common/models/TABLE.json, and there will also be a new entry in /server/model-config.json

7.  Run the app using $ node . and follow the instructions to the API explorer.

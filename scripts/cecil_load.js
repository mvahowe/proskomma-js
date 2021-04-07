const path = require('path');
const fse = require('fs-extra');
const { Proskomma } = require('..');

// create the instance
pk = new Proskomma();
// load the succinct file
const lstart = Date.now();
pk.loadSuccinctDocSet(fse.readJsonSync(process.argv[2]));
console.log("Load time:", Date.now() - lstart, 'msec');

const query = `{
    processor
    packageVersion
    documents(withBook: "JHN") {
        cv (chapter:"1" verses:["1"])
            { text }
    }
}`

const qstart = Date.now();
pk.gqlQuery(query)
    .then( (results) => {
        console.log("Query time:", Date.now() - qstart, 'msec');
        console.log("Query results:\n",JSON.stringify(results, null, 2));
    })
    .catch( err => console.log(err) )
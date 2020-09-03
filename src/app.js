const express = require('express');
const csv = require('csv-parser');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { json } = require('express');

const app = express();
//body-parser
app.use(bodyParser.urlencoded({ extended: true })); 
// if -> (a,bcd) => List((a,b),(a,c),(a,d))
// if -> decodeStructure(b,xyx) => List((a,b),(b,x), (b,y), (b,z), (a,c), (a,d))
/*   {
    job: 'PBILCP0029',
    nextJobs: 'PBILCP4039, PBILCP4074, PBILCP4001',
    prevJobs: 'PBILCP0021',
    jobExec: 'pbil-pe-spk-inm-closeanalyticalprocess-01',
    isBase: 'FALSE',
    path: './xmls/Local/PBIL/CR-PEBILDIA-T02.xml'
  } */

  /* {
      from : String,
      to : String
  } */

var hashMap = new Map();
var schmema = Array();
function hasNext(name) {
   return name != "#N/A" && name.split(",").length > 0;
}
function buildObj(from, to) {
    return {from: from, to: to.trim()}
}
function decodeStructure(name, next) {
    return next.split(",").map(n => buildObj(name,n));
}
function removeDuplicates(objects) {
    return Array.from(new Set(objects.map(JSON.stringify))).map(JSON.parse);
}
function decode(obj, result) {
    if(!hasNext(obj.nextJobs)) return result;
    else {
        var partialResult = decodeStructure(obj.job, obj.nextJobs)
        var semiResult = result.concat(partialResult);
        var recursiveResult = partialResult.reduceRight(function(acc, current){
            var newObj = hashMap.get(current.to);
            if(!newObj) {
                return acc;
            } else {
                return decode(newObj,acc); 
            }
        },semiResult);
        return recursiveResult;
    }
}
function buildSchema(jobname, schema) {
    var job = hashMap.get(jobname);
    var finalSchema = decode(job, schema);
    return finalSchema;
}

function storeMap(row) {
    hashMap.set(row.job, row)
}

fs.createReadStream('src/data/jobs.csv')
  .pipe(csv())
    .on('data', (row) => {
        storeMap(row);  
    })
    .on('end', () => {
        console.log('csv file successfuly processed');
    })
    
app.post('/schema', function(req, res){
    schema = Array();
    newschema = buildSchema(req.body.job_name, schema);
    res.send(removeDuplicates(newschema));
});

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
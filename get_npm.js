var util = require('util'),
    fs = require('fs'),
    path = require('path'),
    wget = require('./wget');

// https://github.com/npm/npm/tags
var NVMW_NPM_MIRROR = process.env.NVMW_NPM_MIRROR || 'https://github.com/npm/npm/archive';
var BASE_URL = NVMW_NPM_MIRROR + '/v%s.zip';

var targetDir = process.argv[2];
var versions = process.argv[3].split('/');
var binType = versions[0];
var binVersion = versions[1];

if (binType === 'iojs') {
  // detect npm version from https://iojs.org/dist/index.json
  var NVMW_IOJS_ORG_MIRROR = process.env.NVMW_IOJS_ORG_MIRROR || 'https://iojs.org/dist';
  processNewNodeAndIojs(NVMW_IOJS_ORG_MIRROR);
} else {
  // detect npm version from https://nodejs.org/dist/index.json
  var NVMW_NODEJS_ORG_MIRROR = process.env.NVMW_NODEJS_ORG_MIRROR || 'https://nodejs.org/dist';
  processNewNodeAndIojs(NVMW_NODEJS_ORG_MIRROR);
}

function processNewNodeAndIojs(mirror) {
  var pkgUri = mirror + '/index.json';
  wget(pkgUri, function (filename, content) {
    if (filename === null) {
      return noNpmAndExit();
    }
    var npmVersion;
    var items = JSON.parse(content);
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!npmVersion) {
        // make sure has a npm version
        npmVersion = item.npm;
      }
      if (item.version === binVersion && item.npm) {
        npmVersion = item.npm;
        break;
      }
    }

    if (!npmVersion) {
      return noNpmAndExit();
    }
    downloadNpmZip(npmVersion);
  });
}

function noNpmAndExit() {
  console.error('%s %s does not include npm', binType, binVersion);
  process.exit(1);
}

function downloadNpmZip(version) {
  var uri = util.format(BASE_URL, version);
  wget(uri, function (filename, data) {
    if (filename === null) {
        console.error('Can\'t get npm: ' + uri);
        process.exit(1);
    }
    fs.writeFile(path.join(targetDir, 'npm.zip'), data, function (err) {
      if (err) {
        return console.error(err.message);
      }
      console.log('Download npm %s is done', version);
    });
  });
}

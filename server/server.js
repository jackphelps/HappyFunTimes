/*
 * Copyright 2014, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

var g = {
  port: 8080,
  screenshotCount: 0,
  baseDir: "public",
  cwd: process.cwd(),
};

var http = require('http');
var debug = require('debug')('server');
var url = require('url');
var fs = require('fs');
var sys = require('sys');
var path = require('path');
var util = require('util');
var mime = require('mime');
var querystring = require('querystring');
var args = require('minimist')(process.argv.slice(2));

if (args.h || args.help) {
  sys.print(
      "--help: this message\n" +
      "--port: port. Default 8080\n");
  process.exit(0);
}

for (var prop in args) {
  g[prop] = args[prop];
}

function postHandler(request, callback) {
  var query_ = { };
  var content_ = '';

  request.addListener('data', function(chunk) {
    content_ += chunk;
  });

  request.addListener('end', function() {
    query_ = JSON.parse(content_);
    callback(query_);
  });
}

function sendJSONResponse(res, object) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.write(JSON.stringify(object), 'utf8');
  res.end();
}

function startsWith(str, start) {
  return (str.length >= start.length &&
          str.substr(0, start.length) == start);
}

function endsWith(str, end) {
  return (str.length >= end.length &&
          str.substring(str.length - end.length) == end);
}

function saveScreenshotFromDataURL(dataURL) {
  var EXPECTED_HEADER = "data:image/png;base64,";
  if (startsWith(dataURL, EXPECTED_HEADER)) {
    var filename = "screenshot-" + (g.screenshotCount++) + ".png";
    fs.writeFile(
        filename,
        dataURL.substr(
            EXPECTED_HEADER.length,
            dataURL.length - EXPECTED_HEADER.length),
        'base64');
    sys.print("Saved Screenshot: " + filename + "\n");
  }
}

var handleTimeRequest = function(query, res) {
  sendJSONResponse(res, { time: (new Date()).getTime() * 0.001 });
};

var handleScreenshotRequest = function(query, res) {
  saveScreenshotFromDataURL(query.dataURL);
  sendJSONResponse(res, { ok: true });
};

var handleListRunningGamesRequest = function(query, res) {
  var games = relayServer.getGames();
  sendJSONResponse(res, games);
};

var server = http.createServer(function() {

  var postCmdHandlers = {
    time: handleTimeRequest,
    screenshot: handleScreenshotRequest,
    listRunningGames: handleListRunningGamesRequest,
  };

  return function(req, res) {
    debug("req: " + req.method);
    // your normal server code
    if (req.method == "POST") {
      postHandler(req, function(query) {
        var cmd = query.cmd;
        debug("query: " + cmd);
        var handler = postCmdHandlers[cmd];
        if (!handler) {
          send404(res);
          return;
        }
        handler(query, res);
      });
    } else {
      sendRequestedFile(req, res);
    }
  };
}());

var isFolder = (function() {
  // Keep a cache of all paths because fs.statSync is sync
  // this should never be that big because we're only serving
  // a few files and are not online.... hopefully.
  var fileDB = { };
  return function(path) {
    var dir = fileDB[path];
    if (dir === undefined) {
      var stats;
      try {
        stats = fs.statSync(path);
        dir = stats.isDirectory();
      } catch (e) {
        dir = false;
      }
      fileDB[path] = dir;
    }
    return dir;
  };
}());

var sendRequestedFile = function(req, res) {
  var filePath = querystring.unescape(url.parse(req.url).pathname);
  var fullPath = path.normalize(path.join(g.cwd, g.baseDir, filePath));
  // I'm sure these checks are techincally wrong but it doesn't matter for our purposes AFAICT.
  var isQuery = filePath.indexOf('?') >= 0;
  var isAnchor = filePath.indexOf('#') >= 0;
  if (!isQuery && !isAnchor) {
    // Add "/" if it's a folder.
    if (!endsWith(filePath, "/") && isFolder(fullPath)) {
      filePath += "/";
      res.writeHead(302, {
        'Location': filePath
      });
      res.end();
      return;
    }
    // Add index.html if ends with "/"
    if (endsWith(fullPath, "/") || endsWith(fullPath, "\\")) {
      fullPath += "index.html";
    }
  }
  debug("path: " + fullPath);
  if (g.cwd != fullPath.substring(0, g.cwd.length)) {
    sys.print("forbidden: " + fullPath + "\n");
    return send403(res);
  }
  var mimeType = mime.lookup(fullPath);
  if (mimeType) {
    fs.readFile(fullPath, function(err, data){
      if (err) {
        sys.print("unknown file: " + fullPath + "\n");
        return send404(res);
      }
      if (startsWith(mimeType, "text")) {
        res.writeHead(200, {
          'Content-Type': mimeType + "; charset=utf-8"
        });
        res.write(data, "utf8");
      } else {
        res.writeHead(200, {
          'Content-Type': mimeType,
          'Content-Length': data.length});
        res.write(data);
      }
      res.end();
    });
  } else {
    send404(res);
  }
};

var send404 = function(res) {
  res.writeHead(404);
  res.write('404');
  res.end();
};

var send403 = function(res) {
  res.writeHead(403);
  res.write('403');
  res.end();
};

var rs = require('./relayserver.js');
var relayServer = new rs.RelayServer(server);
server.listen(g.port);
sys.print("Listening on port: " + g.port + "\n");



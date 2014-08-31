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

var asks         = require('asks');
var config       = require('../lib/config');
var debug        = require('debug')('release');
var events       = require('events');
var fs           = require('fs');
var gameDB       = require('../lib/gamedb');
var gameInfo     = require('../lib/gameinfo');
var games        = require('../management/games');
var GitHubApi    = require('github');
var http         = require('http');
var https        = require('https');
var io           = require('../lib/io');
var JSZip        = require('jszip');
var mkdirp       = require('mkdirp');
var path         = require('path');
var platformInfo = require('../lib/platform-info');
var Promise      = require('promise');
var readdirtree  = require('../lib/readdirtree');
var restUrl      = require('rest-url');
var releaseUtils = require('./release-utils');
var semver       = require('semver');
var strings      = require('../lib/strings');
var url          = require('url');
var utils        = require('../lib/utils');
var ZipWriter    = require("moxie-zip").ZipWriter;

var ReleaseManager = function() {

  this.register = require('./register').register;
  this.publish = require('./publish').publish;
  this.make = require('./make').make;
  this.install = require('./install').install;
  this.uninstall = require('./uninstall').uninstall;
  this.download = require('./download').download;
  this.downloadFile = require('./download').downloadFile;
};

module.exports = new ReleaseManager();


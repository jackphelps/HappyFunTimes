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

var GameClient = function() {
  var g_socket;
  var g_sendQueue = [];
  var eventListeners = {};

  this.addEventListener = function(eventType, listener) {
    eventListeners[eventType] = listener;
  };

  this.removeEventListener = function(eventType) {
    eventListeners[eventType] = undefined;
  };

  var sendEvent_ = function(eventType, args) {
    var fn = eventListeners[eventType];
    if (fn) {
      fn.apply(this, args);
    }
  }.bind(this);

  var connected_ = function() {
    for (var ii = 0; ii < g_sendQueue.length; ++ii) {
      g_socket.emit('message', g_sendQueue[ii]);
    }
    g_sendQueue = [];
    console.log("connected");
    sendEvent_('connect');
  }.bind(this);

  var disconnected_ = function() {
    console.log("disconnected");
    sendEvent_('disconnect');
  }.bind(this);

  var processMessage_ = function(msg) {
    sendEvent_(msg.cmd, [msg]);
  }.bind(this);

  var connect_ = function() {
    if (!window.io) {
      g_socket = {
        send: function() { }
      };
      return;
    }
    var url = "http://" + window.location.host;
    g_sendQueue = [];
    g_socket = io.connect(url);
    g_socket.on('connect', connected_.bind(this));
    g_socket.on('message', processMessage_.bind(this));
    g_socket.on('disconnect', disconnected_.bind(this));
  }.bind(this);

  this.sendCmd = function(data) {
    var msg = {
      cmd: "update",
      data: data
    };
    if (g_socket.readyState == WebSocket.CONNECTING) {
      g_sendQueue.push(msg);
    } else {
      g_socket.emit('message', msg);
    }
  };

  connect_();
};

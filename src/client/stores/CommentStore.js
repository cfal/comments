var _ = require('lodash');
var xhr = require('xhr');
var Dispatcher = require('../dispatcher');
var LoginStore = require('./LoginStore');

var index = { 0: { children: [] } };
var createIndex = function(cl, target) {    
    _.forEach(cl, function(c) {
        target[c._id] = c;
        if (c.children && c.children.length)
            createIndex(c.children, target);
    });
    return target;
};

var subscribers = {};
var dispatch = function(id) {
    if (!subscribers[id]) return;
    subscribers[id]();
};

var loadComments = function() {
    xhr({
        method: 'GET',
        uri: '/comments/load' + (LoginStore.getToken() ? '?token=' + LoginStore.getToken() : ''),
        responseType: 'json'
    }, function(err, resp, body) {
        if (err || !body) {
            return;
        }
        index = createIndex(body, {'0': { children: body }});
        dispatch('0');
    });
};

var CommentStore = {
    init: function() {
        loadComments();
    },
    subscribe: function(id, callback) {
        subscribers[id] = callback;
    },
    unsubscribe: function(id) {
        delete subscribers[id];
    },
    get: function(parent) {
          return (index[parent] || {}).children;
    }
};

Dispatcher.register(function(action) {
    switch (action.type) {
    case 'load':
        loadComments();
        break;
        
    case 'add':
        xhr({
            method: 'POST',
            uri: '/comments/add',
            json: {
                parent: action.parent,
                title: action.title,
                text: action.text,
                token: LoginStore.getToken()
            }
        }, function(err, resp, data) {
            if (err || data.error !== null || !data.result) {
                return;
            }
            var c = data.result;
            if (!(c.parent in index)) return;
            index[c.parent].children.unshift(c);
            index[c._id] = c;
            dispatch(c.parent);
        });
        break;
        
    case 'vote':
        xhr({
            method: 'POST',
            uri: '/comments/vote',
            json: {
                _id: action._id,
                delta: action.delta,
                vote: action.vote,
                token: LoginStore.getToken()
            }
        }, function(err, resp, data) {
            if (err || data.error !== null) return;
        });
        break;
        
    default:
        break;
    }
});

module.exports = CommentStore;



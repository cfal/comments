var _ = require('lodash');
var xhr = require('xhr');
var Dispatcher = require ('../dispatcher');
var CommentActions = require('../actions/CommentActions');

var hasLocalStorage = typeof localStorage !== 'undefined';

var subscribers = [];
var emit = function(data) {
    _.forEach(subscribers, function(fn) { fn(data); });
};

var user = '';
var token = '';

var LoginStore = {
    init: function() {
        if (hasLocalStorage) {
            var lastToken = localStorage.getItem('comments.lastToken');
            var lastUser = localStorage.getItem('comments.lastUser');
            if (lastToken && lastUser) {
                user = lastUser;
                token = lastToken;
                xhr({
                    method: 'POST',
                    uri: '/auth/verify',
                    json: {
                        user: user,
                        token: token
                    }
                }, function(err, resp, data) {
                    if (!err && data.error === null) {
                        // Use last token
                        return;
                    }
                    user = '';
                    token = '';
                    emit();
                });
            }
        }
    },
    subscribe: function(fn) {
        subscribers.push(fn);
    },
    unsubscribe: function(fn) {
        var i = subscribers.indexOf(fn);
        if (i < 0) return;
        subscribers.splice(i, 1);
    },
    getUser: function() {
        return user;
    },
    getToken: function() {
        return token;
    }
};

Dispatcher.register(function(action) {
    switch (action.type) {
    case 'login':
        xhr({
            method: 'POST',
            uri: '/auth/login',
            json: {
                user: action.user,
                pass: action.pass
            }
        }, function(err, resp, data) {
            if (err || data.error !== null || !data.token) {
                return;
            }
            user = data.user;
            token = data.token;
            if (hasLocalStorage) {
                localStorage.setItem('comments.lastToken', token);
                localStorage.setItem('comments.lastUser', user);
            }
            emit();
            CommentActions.loadComments();
        });
        break;
        
    case 'logout':
        xhr({
            method: 'POST',
            uri: '/auth/logout',
            json: {
                token: token
            }
        }, function(err, resp, data) {
            if (err || data.error !== null) {
                return;
            }
            user = '';
            token = '';
            if (hasLocalStorage) {
                localStorage.removeItem('comments.lastToken');
                localStorage.removeItem('comments.lastUser');
            }
            emit();
            CommentActions.loadComments();
        });
        break;    

    default:
        break;
    }
});

module.exports = LoginStore;


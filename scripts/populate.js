var request = require('request');
var loremIpsum = require('lorem-ipsum');

var host = 'http://localhost:8080';
if (process.argv.length > 2) {
    host = process.argv[2];
} else if (process.env.LISTEN_HOST && process.env.LISTEN_PORT) {
    host = 'http://' + (process.env.LISTEN_HOST === '0.0.0.0' ? 'localhost' : process.env.LISTEN_HOST) + ':' + process.env.LISTEN_PORT;
}

function rand(a, b) {
    a = a || 0;
    b = b || 1;
    return a + parseInt(Math.random() * (b - a + 1));
}

function createUser(user, pass, cb) {
    var data = { user: user, pass: pass };
    request.post({
        url: host + '/auth/adduser',
        form: data
    }, function(err, resp, body) {
        request.post({
            url: host + '/auth/login',
            form: data
        }, function(err, resp, body) {
            if (!err && body) {
                var obj = JSON.parse(body) || {};
                cb(null, obj.token);
            } else {
                cb(true);
            }
        });
    });
}       

function createThread(len, parent, token) {
    if (!len) return;
    request.post({
        url: host + '/comments/add',
        form: {
            parent: parent || '0',
            title: rand() ? loremIpsum() : '',
            text: loremIpsum(),
            token: token
        }
    }, function(err, resp, body) {
        if (err || !body) {
            console.error(err);
            return;
        }
        var obj = JSON.parse(body);
        if (!obj) {
            console.log("Could not read body");
            return;
        }
        setTimeout(function() {
            createThread(len - 1, rand() ? obj.result._id : parent, token);
            voteThread(obj.result._id, token);
            var votes = rand(10, 20);
            for (var v = 0; v < votes; v++) {
                setTimeout(function() {
                    voteThread(obj.result._id);
                }, rand(1,2) * 100);
            }
        }, rand(1,2) * 100);
    });
}

function voteThread(id, token) {
    var vote = rand() ? -1 : 1;
    request.post({
        url: host + '/comments/vote',
        form: {
            _id: id,
            token: token,
            delta: vote,
            vote: vote
        }
    });
}

for (var i = 0; i < 10; i++) {
    createUser('fakeUser' + i, 'abc', function(err, token) {
        createThread(rand(6, 12), '0', token);
    });
}

console.log("Comments populated.");
console.log("Users added, login with username 'fakeUser[1-9]', password 'abc'");


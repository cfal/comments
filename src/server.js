var path = require('path');
var crypto = require('crypto');
var _ = require('lodash');
var app = require('koa')();
var serve = require('koa-static');
var router = require('koa-router')();
var monk = require('monk');
var wrap = require('co-monk');
var parse = require('co-body');

var config = {
    db: process.env.MONGODB_ADDR || 'localhost/test',
    path: process.env.SERVE_PATH || path.join(__dirname, '../client/'),
    host: process.env.LISTEN_HOST || '0.0.0.0',
    port: process.env.LISTEN_PORT || 8080
};

var args = _.clone(process.argv);
while (args.length) {
    var m = /^\-\-(\S+)$/.exec(args.shift());
    if (!m) continue;
    var key = m[1].toLowerCase();
    if (key in config) {
        if (!args.length) throw 'No value provided for ' + key;
        config[key] = args.shift();
    } else {
        throw 'Invalid setting: ' + key;
    }
}

var clamp = function(x, a, b) {
    return Math.min(b, Math.max(a, x));
};

var createHash = function(pass) {
    return crypto.createHash('md5').update(pass).digest('hex');
};

var transformComment = function(c) {
    return {
        _id: c._id,
        slug: c.slug,
        full_slug: c.full_slug,
        parent: c.parent,
        created: c.created,
        author: c.author,
        title: c.title,
        text: c.text,
        upvotes: c.upvotes,
        children: []
    };
};

var createNewSlug = function(ts) {
    var tsStr = parseInt(ts / 100).toString(32);
    var randStr = Math.random().toString(32).slice(2);
    while (randStr.length < 2) randStr += '0';
    return tsStr + randStr;
};

var tokenCache = {};

var db = monk(config.db);
var users = wrap(db.get('users'));
var comments = wrap(db.get('comments'));

router.post('/auth/adduser', function *(next) {
    var data = yield parse(this);
    var user = yield users.find({ user: data.user });
    if (!data || !data.user || !data.pass) {
        this.status = 401;
        return;
    }
    if (user && user.length) {
        this.status = 401;
        return;
    }
    yield users.insert({
        user: data.user,
        hash: createHash(data.pass)
    });
    this.body = {
        error: null
    };
});

router.post('/auth/login', function *(next) {
    var data = yield parse(this);
    if (!data || !data.user) {
        this.status = 401;
        return;
    }
    var user = yield users.findOne({ user: data.user });
    if (!user || !user.user || !user.hash) {
        this.status = 401;
        return;
    }
    if (user.hash != createHash(data.pass)) {
        this.status = 401;
        return;
    }

    var loginTime = +new Date();
    var authToken = null;
    while (!authToken || authToken in tokenCache) {
        authToken = createHash(user.hash + loginTime.toString() + Math.random().toString());
    }
    tokenCache[authToken] = data.user;
    this.body = {
        error: null,
        user: data.user,
        token: authToken
    };  
});

router.post('/auth/logout', function *(next) {
    var data = yield parse(this);
    if (!data || !data.token) {
        this.status = 401;
        return;
    }
    if (data.token in tokenCache) {
        delete tokenCache[data.token];
    }

    this.body = {
        error: null
    };
});

router.post('/auth/verify', function *(next) {
    var data = yield parse(this);
    if (!data || !data.token) {
        this.status = 401;
        return;
    }
    this.body = {
        error: data.user === tokenCache[data.token] ? null : 'No such token'
    };
});

router.get('/comments/load', function *(next) {
    var data = this.request.query;
    var user = tokenCache[data.token];
    var commentList = yield comments.find({}, {sort: {upvotes: -1}});
    var res = {0: { children: [] }};
    _.forEach(commentList, function(comment) {
        c = transformComment(comment);
        if (user) {
            c.vote = comment.voters[user] || 0;
        }
        parent = res[c.parent];
        if (!parent) {
            res[c.parent] = {
                children: [c]
            };
        } else {
            res[c.parent].children.push(c);
        }

        var old = res[c._id];
        if (old) c.children = old.children;

        res[c._id] = c;
    }); 
    this.body = res[0].children;
});

router.post('/comments/add', function *(next) {
    var createTime = +new Date();
    var data = yield parse(this);

    if (!('parent' in data && 'text' in data)) {
        this.body = { error: 'Malformed request' };
        return;
    }

    var slug = createNewSlug(createTime);
    var obj = {
        created: createTime,
        author: 'anonymous',
        parent: data.parent,
        slug: slug,
        full_slug: data.parent + '/' + slug,
        title: data.title || '',
        text: data.text || '',
        upvotes: 1,
        voters: {}
    };

    if (data.token && data.token in tokenCache) {
        var user = tokenCache[data.token];
        obj.author = user;
        obj.voters[user] = 1;
    }   

    var doc = yield comments.insert(obj);

    if (!doc) {
        this.body = { error: 'Could not add comment' };
        return;
    }

    var res = transformComment(doc);
    res.vote = 1;
    
    this.body = {
        error: null,
        result: res
    };

});

router.post('/comments/vote', function *(next) {
    var data = yield parse(this);
    if (!('_id' in data && 'delta' in data && 'vote' in data)) {
        this.body = { error: 'Malformed request' };
        return;
    }

    var doc = yield comments.findOne({ _id: data._id });
    if (!doc) {
        this.status = 401;
        return;
    }

    var d = parseInt(data.delta) || 0;

    if (!data.token) {
        var doc = yield comments.update({ _id: data._id }, { $inc: { upvotes: d } });
        this.body = { error: null };
        return;
    }
    
    var name = tokenCache[data.token];
    var newVote = parseInt(data.vote) || 0;

    if (!name) {
        this.body = { error: 'Invalid token' };
        return;
    }   
    
    var update = {
        $inc: { upvotes: d }
    };
    if (newVote == 0) {
        update['$unset'] = {};
        update['$unset']['voters.' + name] = '';
    } else {
        update['$set'] = {};
        update['$set']['voters.' + name] = newVote;
    }
        
    var doc = yield comments.update({ _id: data._id }, update);

    if (!doc) {
        this.body = { error: 'Vote failed' };
        return;
    }

    this.body = {
        error: null
    };
});

app.use(serve(config.path));

app.use(router.routes())
   .use(router.allowedMethods());

app.listen(config.port, config.host);

users.index('user');
comments.index({upvotes:-1});

console.log('MongoDB: ' + config.db);
console.log('Serving path: ' + config.path);
console.log('Server running on ' + config.host + ':' + config.port);


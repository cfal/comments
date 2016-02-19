var Dispatcher = require('../dispatcher');
module.exports = {
    addComment: function(parent, title, text) {
        Dispatcher.dispatch({
            type: 'add',
            parent: parent,
            title: title,
            text: text
        });
    },
    loadComments: function() {
        Dispatcher.dispatch({
            type: 'load'
        });
    },
    vote: function(_id, delta, vote) {
        Dispatcher.dispatch({
            type: 'vote',
            _id: _id,
            delta: delta,
            vote: vote
        });
    }
};


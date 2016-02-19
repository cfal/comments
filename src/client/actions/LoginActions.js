var Dispatcher = require('../dispatcher');
module.exports = {
    login: function(user, pass) {
        Dispatcher.dispatch({
            type: 'login',
            user: user,
            pass: pass
        });
    },
    logout: function() {
        Dispatcher.dispatch({
            type: 'logout'
        });
    }
};

var React = require('react');
var LoginStore = require('../stores/LoginStore');
var LoginActions = require('../actions/LoginActions');

var CommentAuth = React.createClass({
    getInitialState: function() {
        return {
            user: LoginStore.getUser(),
            user_input: '',
            pass_input: ''
        };
    },

    componentWillMount: function() {
        LoginStore.subscribe(this.onChange);
    },

    componentWillUnmount: function() {
        LoginStore.unsubscribe(this.onChange);
    },

    onChange: function() {
        var user = LoginStore.getUser();
        if (!user) {
            this.setState({
                user: user,
                user_input: this.state.user,
                pass_input: ''
            });
        } else {        
            this.setState({
                user: LoginStore.getUser(),
                user_input: '',
                pass_input: ''
            });
        }
    },
    
    render: function() {
        if (!this.state.user) {
            return (
                <form className="comment-auth-login-container" onSubmit={this.onLogin}>
                    <div className="comment-auth-username">
                        <input type="text" onChange={this.onUserInput}
                               placeholder="username" defaultValue={this.state.user_input} />
                    </div>
                    <div className="comment-auth-password">
                        <input type="password" onChange={this.onPassInput}
                               placeholder="password" />
                    </div>
                    <div className="comment-auth-login">
                        <input type="submit" value="login" />
                    </div>
                </form>
            );
        } else {
            return (
                <div className="comment-auth-logout-container">
                    <div className="comment-auth-details">
                        Logged in as <span className="comment-auth-name">{this.state.user}</span>
                    </div>
                    <div className="comment-auth-logout">
                        <button onClick={this.onLogout}>logout</button>
                    </div>
                </div>
            );
        }
    },
    shouldComponentUpdate: function(nextProps, nextState) {
        return nextState.user !== this.state.user;
    },
    onUserInput: function(event) {
        this.setState({
            user_input: event.target.value
        });
    },
    onPassInput: function(event) {
        this.setState({
            pass_input: event.target.value
        });
    },
    onLogin: function(event) {
        var user = this.state.user_input, pass = this.state.pass_input;
        if (user && pass) {
            LoginActions.login(user, pass);
	}
        event.preventDefault();
        return false;
    },
    onLogout: function() {
        LoginActions.logout();
    }
});

module.exports = CommentAuth;

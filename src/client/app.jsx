var React = require('react');
var ReactDOM = require('react-dom');
var LoginStore = require('./stores/LoginStore');
var CommentStore = require('./stores/CommentStore');
var CommentActionBar = require('./components/CommentActionBar');
var CommentList = require('./components/CommentList');
var CommentAuth = require('./components/CommentAuth');

LoginStore.init();
CommentStore.init();

ReactDOM.render(
    <div class="comments-inner-holder">
        <CommentAuth />
        <CommentActionBar parent="0" />
        <CommentList parent="0" />
    </div>
,
    document.getElementById('comments-holder')
);


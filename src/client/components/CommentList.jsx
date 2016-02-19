var React = require('react');
var CommentActionBar = require('./CommentActionBar');
var CommentActions = require('../actions/CommentActions');
var LoginStore = require('../stores/LoginStore');
var CommentStore = require('../stores/CommentStore');

var Comment = null, CommentList = React.createClass({
    getInitialState: function() {
        return {
            comments: CommentStore.get(this.props.parent)
        };
    },
    
    componentWillMount: function() {
        CommentStore.subscribe(this.props.parent, this.onChange);
    },

    componentWillUnmount: function() {
        CommentStore.unsubscribe(this.props.parent, this.onChange);
    },
    
    onChange: function(info) {
        this.setState({
            comments: CommentStore.get(this.props.parent)
        });
    },

    componentWillReceiveProps: function(info) {
        this.setState({
            comments: CommentStore.get(this.props.parent)
        });
    },

    render: function() {
        var depth = this.props.depth || 0;
        var comments = _.map(this.state.comments, function(c) {
            return (
                <Comment key={c._id}
                         _id={c._id}
                         created={c.created}
                         author={c.author}
                         title={c.title}
                         body={c.text}
                         upvotes={c.upvotes}
                         depth={depth}
                         vote={c.vote || 0}
                         hasChildren={c.children.length > 0 ? '1' : '0'} />
            );
        });
            
        return (
            <div className="comment-list">
                {comments}
            </div>
        );
    }
});

Comment = React.createClass({
    getInitialState: function() {
        return {
            vote: this.props.vote,
            upvotes: this.props.upvotes
        };
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({
            vote: nextProps.vote
        });
    },
    render: function() {
        var score = this.state.upvotes;
        return (
            <div className="comment-container">
                <div className="comment-header">
                    <div className="comment-upvote-container">
                        <div className={'comment-upvote' + (this.state.vote == 1 ? '-selected' : '')} onClick={this.onUpvote}>
                            +1
                        </div>
                        <div className={'comment-downvote' + (this.state.vote == -1 ? '-selected' : '')} onClick={this.onDownvote}>
                            -1
                        </div>
                    </div>
                    <div className="comment-title" style={{display: this.props.title ? '' : 'none'}}>{this.props.title}</div>
                </div>
                <div className={score > 1 ? 'comment-score-pos' : score < 0 ? 'comment-score-neg' : 'comment-score'}>
                    {score} points
                </div>                
                <div className="comment-details">{this.props.author} at {new Date(this.props.created).toUTCString()}</div>
                <div className="comment-body">{this.props.body}</div>
                <CommentActionBar parent={this.props._id} />
                <CommentList parent={this.props._id} depth={this.props.depth + 1} />
            </div>
        );
    },
    onUpvote: function() {
        var vote = this.state.vote == 1 ? 0 : 1;
        var delta = vote - this.state.vote;
        this.setState({
            vote: vote,
            upvotes: this.props.upvotes + vote - this.props.vote
        }, function() {
            CommentActions.vote(this.props._id, delta, vote);
        }.bind(this));
    },
    onDownvote: function() {
        var vote = this.state.vote == -1 ? 0 : -1;
        var delta = vote - this.state.vote;
        this.setState({
            vote: vote,
            upvotes: this.props.upvotes + vote - this.props.vote
        }, function() {
            CommentActions.vote(this.props._id, delta, vote);
        }.bind(this));
    }
});

module.exports = CommentList;

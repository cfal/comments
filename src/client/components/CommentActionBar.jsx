var React = require('react');
var CommentActions = require('../actions/CommentActions');
var CommentActionBar = React.createClass({
    getInitialState: function() {
        return {
            type: 'closed',
            title: '',
            text: ''
        };
    },
    
    render: function() {
        var commentLabel = this.props.parent != '0' ? 'reply' : 'comment';
        switch (this.state.type) {
            case 'edit':
                return (
                    <div className="comment-action-container-expanded">
                        <div className="comment-action-title">
                            <input type="text" placeholder="title" onChange={this.onTitleChange} />
                        </div>
                        <div className="comment-action-text">
                            <textarea type="text" placeholder={commentLabel} onChange={this.onTextChange} />
                        </div>
                        <div className="comment-action-menu">
                            <button type="button" className="comment-action-button comment-link" onClick={this.onSave}>save</button>
                            &nbsp;
                            <button type="button" className="comment-action-button comment-link" onClick={this.onToggleReply}>cancel</button>
                        </div>
                    </div>
                );
            case 'saving':
                return (
                    <div className="comment-action-container-saving">
                        Saving {commentLabel}..
                    </div>
                );
            case 'closed':
            default:
                return (
                    <div className="comment-action-container">
                        <a className="comment-link" onClick={this.onToggleReply}>{commentLabel}</a>
                    </div>
                );
        }
    },
    
    shouldComponentUpdate: function(nextProps, nextState) {
        return nextState.type !== this.state.type;
    },

    onToggleReply: function() {
        this.setState({
            type: this.state.type == 'edit' ? 'closed' : 'edit'
        });
    },

    onTitleChange: function(event) {
        this.setState({
            title: event.target.value
        });
    },

    onTextChange: function(event) {
        this.setState({
            text: event.target.value
        });
    },

    onSave: function() {
        this.setState({
            type: 'saving'
        }, function() {
            CommentActions.addComment(this.props.parent, this.state.title, this.state.text);
            this.setState(this.getInitialState());
        });
    }
});

module.exports = CommentActionBar;

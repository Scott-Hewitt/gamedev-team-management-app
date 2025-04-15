import { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const TaskComments = ({ taskId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/comments/task/${taskId}`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const response = await api.post('/comments', {
        task_id: taskId,
        content: newComment
      });
      
      // Add new comment to the list
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const response = await api.put(`/comments/${commentId}`, {
        content: editContent
      });
      
      // Update comment in the list
      setComments(comments.map(c => 
        c.id === commentId ? response.data : c
      ));
      
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
      setError('Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      setError('');
      
      await api.delete(`/comments/${commentId}`);
      
      // Remove comment from the list
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="text-center my-3">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading comments...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Card>
      <Card.Header>Comments</Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit} className="mb-4">
          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
            />
          </Form.Group>
          <Button 
            type="submit" 
            variant="primary"
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Posting...
              </>
            ) : 'Post Comment'}
          </Button>
        </Form>
        
        {comments.length === 0 ? (
          <p className="text-center text-muted">No comments yet. Be the first to comment!</p>
        ) : (
          <ListGroup variant="flush">
            {comments.map(comment => (
              <ListGroup.Item key={comment.id} className="border-bottom py-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <strong>{comment.author?.username || 'Unknown User'}</strong>
                    <span className="text-muted ms-2">
                      {comment.author?.role && `(${comment.author.role})`}
                    </span>
                  </div>
                  <small className="text-muted">{formatDate(comment.createdAt)}</small>
                </div>
                
                {editingComment === comment.id ? (
                  <div>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="mb-2"
                    />
                    <div className="d-flex gap-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={!editContent.trim() || submitting}
                      >
                        {submitting ? 'Saving...' : 'Save'}
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mb-2">{comment.content}</p>
                    
                    {(user.id === comment.author?.id || user.role === 'admin' || user.role === 'manager') && (
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleEdit(comment)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(comment.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default TaskComments;

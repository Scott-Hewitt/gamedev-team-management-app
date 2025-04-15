import { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const TeamManagement = ({ projectId }) => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch project team members
        const teamResponse = await api.get(`/projects/${projectId}/team`);
        setTeamMembers(teamResponse.data);
        
        // Fetch available users (not in the team)
        const usersResponse = await api.get('/users');
        const teamMemberIds = teamResponse.data.map(member => member.id);
        const filteredUsers = usersResponse.data.filter(user => !teamMemberIds.includes(user.id));
        setAvailableUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching team data:', error);
        setError('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [projectId]);

  const handleAddMember = async () => {
    if (!selectedUser) return;
    
    try {
      setAddLoading(true);
      
      await api.post(`/projects/${projectId}/team`, {
        userId: selectedUser,
        role: selectedRole
      });
      
      // Refresh team data
      const teamResponse = await api.get(`/projects/${projectId}/team`);
      setTeamMembers(teamResponse.data);
      
      // Update available users
      const usersResponse = await api.get('/users');
      const teamMemberIds = teamResponse.data.map(member => member.id);
      const filteredUsers = usersResponse.data.filter(user => !teamMemberIds.includes(user.id));
      setAvailableUsers(filteredUsers);
      
      // Reset and close modal
      setSelectedUser('');
      setSelectedRole('member');
      setShowModal(false);
    } catch (error) {
      console.error('Error adding team member:', error);
      setError('Failed to add team member');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    
    try {
      await api.delete(`/projects/${projectId}/team/${userId}`);
      
      // Refresh team data
      const teamResponse = await api.get(`/projects/${projectId}/team`);
      setTeamMembers(teamResponse.data);
      
      // Update available users
      const usersResponse = await api.get('/users');
      const teamMemberIds = teamResponse.data.map(member => member.id);
      const filteredUsers = usersResponse.data.filter(user => !teamMemberIds.includes(user.id));
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error('Error removing team member:', error);
      setError('Failed to remove team member');
    }
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      'admin': 'danger',
      'manager': 'warning',
      'developer': 'primary',
      'designer': 'info',
      'tester': 'success',
      'member': 'secondary'
    };
    
    return (
      <Badge bg={roleMap[role] || 'secondary'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center my-3">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const canManageTeam = user.role === 'admin' || user.role === 'manager';

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Project Team</h5>
          {canManageTeam && (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => setShowModal(true)}
              disabled={availableUsers.length === 0}
            >
              Add Team Member
            </Button>
          )}
        </Card.Header>
        
        {teamMembers.length === 0 ? (
          <Card.Body>
            <p className="text-center mb-0">No team members assigned to this project yet.</p>
          </Card.Body>
        ) : (
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Project Role</th>
                <th>Tasks</th>
                {canManageTeam && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {teamMembers.map(member => (
                <tr key={member.id}>
                  <td>{member.username}</td>
                  <td>{getRoleBadge(member.role)}</td>
                  <td>{getRoleBadge(member.UserProject?.role || 'member')}</td>
                  <td>{member.tasks?.length || 0}</td>
                  {canManageTeam && (
                    <td>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      
      {/* Add Team Member Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Team Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select User</Form.Label>
              <Form.Select 
                value={selectedUser} 
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select a user...</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Project Role</Form.Label>
              <Form.Select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="lead">Lead</option>
                <option value="manager">Manager</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddMember}
            disabled={!selectedUser || addLoading}
          >
            {addLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Adding...
              </>
            ) : 'Add to Team'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TeamManagement;

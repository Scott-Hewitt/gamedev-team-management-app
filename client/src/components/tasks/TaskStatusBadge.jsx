import { Badge } from 'react-bootstrap';

const TaskStatusBadge = ({ status }) => {
  const statusMap = {
    'backlog': { bg: 'secondary', label: 'Backlog' },
    'todo': { bg: 'info', label: 'To Do' },
    'in_progress': { bg: 'primary', label: 'In Progress' },
    'review': { bg: 'warning', label: 'Review' },
    'done': { bg: 'success', label: 'Done' }
  };
  
  const { bg, label } = statusMap[status] || { bg: 'secondary', label: status };
  
  return (
    <Badge bg={bg}>
      {label}
    </Badge>
  );
};

export default TaskStatusBadge;

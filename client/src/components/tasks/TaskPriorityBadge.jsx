import { Badge } from 'react-bootstrap';

const TaskPriorityBadge = ({ priority }) => {
  const priorityMap = {
    'low': { bg: 'secondary', label: 'Low' },
    'medium': { bg: 'info', label: 'Medium' },
    'high': { bg: 'warning', label: 'High' },
    'critical': { bg: 'danger', label: 'Critical' }
  };
  
  const { bg, label } = priorityMap[priority] || { bg: 'secondary', label: priority };
  
  return (
    <Badge bg={bg}>
      {label}
    </Badge>
  );
};

export default TaskPriorityBadge;

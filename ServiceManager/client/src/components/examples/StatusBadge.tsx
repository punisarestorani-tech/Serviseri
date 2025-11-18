import StatusBadge from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="flex gap-4">
      <StatusBadge status="pending" />
      <StatusBadge status="in_progress" />
      <StatusBadge status="completed" />
    </div>
  );
}

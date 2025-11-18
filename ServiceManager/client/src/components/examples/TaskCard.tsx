import TaskCard from '../TaskCard';

export default function TaskCardExample() {
  return (
    <div className="space-y-4 max-w-2xl">
      <TaskCard
        taskId="1"
        description="Annual maintenance - Commercial Freezer"
        clientName="Grand Hotel Plaza"
        status="pending"
        createdAt={new Date('2024-01-15')}
        onClick={() => console.log('Task clicked')}
      />
      <TaskCard
        taskId="2"
        description="Repair ice maker - Kitchen Unit #3"
        clientName="Riverside Restaurant"
        status="in_progress"
        createdAt={new Date('2024-01-14')}
        onClick={() => console.log('Task clicked')}
      />
      <TaskCard
        taskId="3"
        description="Replace compressor - Walk-in cooler"
        clientName="Marina Bistro"
        status="completed"
        createdAt={new Date('2024-01-10')}
        onClick={() => console.log('Task clicked')}
      />
    </div>
  );
}

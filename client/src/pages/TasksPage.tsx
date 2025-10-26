import { useState } from "react";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import TaskCard from "@/components/TaskCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { useLocation } from "wouter";

//todo: remove mock functionality
const mockTasks = [
  {
    taskId: "1",
    description: "Annual maintenance - Commercial Freezer",
    clientName: "Grand Hotel Plaza",
    status: "pending" as const,
    createdAt: new Date('2024-01-15'),
  },
  {
    taskId: "2",
    description: "Repair ice maker - Kitchen Unit #3",
    clientName: "Riverside Restaurant",
    status: "in_progress" as const,
    createdAt: new Date('2024-01-14'),
  },
  {
    taskId: "3",
    description: "Replace compressor - Walk-in cooler",
    clientName: "Marina Bistro",
    status: "completed" as const,
    createdAt: new Date('2024-01-10'),
  },
  {
    taskId: "4",
    description: "Check refrigeration system - Bar area",
    clientName: "Grand Hotel Plaza",
    status: "pending" as const,
    createdAt: new Date('2024-01-12'),
  },
  {
    taskId: "5",
    description: "Install new dishwasher",
    clientName: "Coastal Café",
    status: "in_progress" as const,
    createdAt: new Date('2024-01-13'),
  },
];

export default function TasksPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskClient, setNewTaskClient] = useState("");
  const [newTaskAppliance, setNewTaskAppliance] = useState("");

  const handleAddTask = () => {
    console.log('New task created:', {
      description: newTaskDescription,
      client: newTaskClient,
      appliance: newTaskAppliance,
    });
    setNewTaskDescription("");
    setNewTaskClient("");
    setNewTaskAppliance("");
    setIsAddTaskOpen(false);
  };

  const filteredTasks = mockTasks.filter((task) => {
    const matchesSearch = task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header username="John Smith" onLogout={() => setLocation('/')} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton to="/dashboard" label="Back to Dashboard" />
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Tasks</h2>
          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-task">
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="task-description">
                    Task Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="task-description"
                    placeholder="Enter task description..."
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    data-testid="input-task-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-client">
                    Client <span className="text-destructive">*</span>
                  </Label>
                  <Select value={newTaskClient} onValueChange={setNewTaskClient}>
                    <SelectTrigger id="task-client" data-testid="select-task-client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Grand Hotel Plaza</SelectItem>
                      <SelectItem value="2">Riverside Restaurant</SelectItem>
                      <SelectItem value="3">Marina Bistro</SelectItem>
                      <SelectItem value="4">Coastal Café</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-appliance">
                    Appliance <span className="text-destructive">*</span>
                  </Label>
                  <Select value={newTaskAppliance} onValueChange={setNewTaskAppliance}>
                    <SelectTrigger id="task-appliance" data-testid="select-task-appliance">
                      <SelectValue placeholder="Select appliance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Commercial Freezer Unit</SelectItem>
                      <SelectItem value="2">Ice Maker - Kitchen</SelectItem>
                      <SelectItem value="3">Walk-in Cooler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddTaskOpen(false)}
                    className="flex-1"
                    data-testid="button-cancel-task"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddTask}
                    disabled={!newTaskDescription || !newTaskClient || !newTaskAppliance}
                    className="flex-1"
                    data-testid="button-create-task"
                  >
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-tasks"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.taskId}
              {...task}
              onClick={() => setLocation(`/tasks/${task.taskId}`)}
            />
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No tasks found matching your criteria
          </div>
        )}
      </main>
    </div>
  );
}

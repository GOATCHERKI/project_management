import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import api from "../configs/api";
import { updateTask } from "../features/workspaceSlice";

const statusConfig = {
  TODO: { label: "To Do", color: "bg-zinc-100 dark:bg-zinc-800", headerColor: "bg-zinc-200 dark:bg-zinc-700", borderColor: "border-zinc-300 dark:border-zinc-600" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 dark:bg-blue-900", headerColor: "bg-blue-200 dark:bg-blue-800", borderColor: "border-blue-300 dark:border-blue-700" },
  DONE: { label: "Done", color: "bg-green-100 dark:bg-green-900", headerColor: "bg-green-200 dark:bg-green-800", borderColor: "border-green-300 dark:border-green-700" },
};

const ProjectBoard = ({ tasks, project }) => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const [draggedTask, setDraggedTask] = useState(null);

  // Group tasks by status
  const groupedTasks = {
    TODO: tasks.filter((t) => t.status === "TODO") || [],
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS") || [],
    DONE: tasks.filter((t) => t.status === "DONE") || [],
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedTask) return;

    if (draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      toast.loading("Updating task status...");
      const { data } = await api.put(
        `/api/tasks/${draggedTask.id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      const updatedTask = { ...draggedTask, status: newStatus };
      dispatch(updateTask(updatedTask));

      toast.dismissAll();
      toast.success("Task moved successfully");
    } catch (error) {
      toast.dismissAll();
      toast.error(error?.response?.data?.message || "Failed to update task");
    } finally {
      setDraggedTask(null);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      toast.loading("Deleting task...");
      await api.post(
        `/api/tasks/delete`,
        { taskIds: [taskId] },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      toast.dismissAll();
      toast.success("Task deleted successfully");
      // Optionally dispatch delete action
    } catch (error) {
      toast.dismissAll();
      toast.error(error?.response?.data?.message || "Failed to delete task");
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Object.entries(statusConfig).map(([status, config]) => (
        <div
          key={status}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
          className={`flex-shrink-0 w-80 rounded-lg border-2 ${config.borderColor} overflow-hidden`}
        >
          {/* Column Header */}
          <div className={`${config.headerColor} p-4 sticky top-0`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {config.label}
                </h3>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-600 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {groupedTasks[status].length}
                </span>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className={`${config.color} min-h-96 p-3 space-y-2`}>
            {groupedTasks[status].length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
                No tasks
              </div>
            ) : (
              groupedTasks[status].map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  className={`p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-move hover:shadow-md dark:hover:shadow-xl transition-shadow group`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="size-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1 min-w-0">
                      {/* Task Title */}
                      <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate mb-1">
                        {task.title}
                      </h4>

                      {/* Task Type & Priority */}
                      <div className="flex gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          {task.type}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          task.priority === "HIGH"
                            ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                            : task.priority === "MEDIUM"
                            ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                            : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Assignee */}
                      {task.assignee && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <img
                            src={task.assignee.image}
                            alt={task.assignee.name}
                            className="size-5 rounded-full"
                          />
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                            {task.assignee.name}
                          </span>
                        </div>
                      )}

                      {/* Due Date */}
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400 flex-shrink-0"
                      title="Delete task"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Add Task Button */}
            <button className="w-full p-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors flex items-center gap-2 justify-center mt-4">
              <Plus className="size-4" />
              Add Task
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectBoard;

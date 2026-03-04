import { prisma } from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";

export const createTask = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {
      projectId,
      title,
      description,
      type,
      status,
      priority,
      assigneeId,
      due_date,
    } = req.body;
    const origin = req.get("origin");

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    } else if (project.team_lead !== userId) {
      return res
        .status(403)
        .json({ message: "Only team lead can create task" });
    } else if (
      assigneeId &&
      !project.members.find((member) => member.user.id === assigneeId)
    ) {
      return res
        .status(400)
        .json({ message: "Assignee must be a member of the project" });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        type,
        priority,
        assigneeId,
        status,
        due_date: new Date(due_date),
      },
    });

    const taskWithAssignee = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        assignee: true,
      },
    });

    await inngest.send({
      name: "app/task.assigned",
      data: {
        taskId: task.id,
        origin,
      },
    });

    res.json({ task: taskWithAssignee, message: "Task created successfully" });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: error.message || error.code });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { userId } = await req.auth();

    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Allow update if user is team lead or assignee
    const isTeamLead = project.team_lead === userId;
    const isAssignee = task.assigneeId === userId;

    if (!isTeamLead && !isAssignee) {
      return res
        .status(403)
        .json({ message: "Only team lead or assignee can update task" });
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ task: updatedTask, message: "Task Updated successfully" });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { taskIds } = req.body;
    const task = await prisma.task.findMany({
      where: { id: { in: taskIds } },
    });

    if (task.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await prisma.project.findUnique({
      where: { id: task[0].projectId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    } else if (project.team_lead !== userId) {
      return res
        .status(403)
        .json({ message: "Only team lead can create task" });
    }

    await prisma.task.deleteMany({
      where: { id: { in: taskIds } },
    });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};

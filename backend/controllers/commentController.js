import { prisma } from "../configs/prisma.js";

export const addComment = async (req, res) => {
  try {
    const { content, taskId } = req.body;
    const { userId } = await req.auth();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

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

    const member = project.members.find((member) => member.user.id === userId);

    if (!member) {
      return res
        .status(403)
        .json({ message: "Only project members can add comments" });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId,
      },
      include: {
        user: true,
      },
    });

    res.json({ comment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};

export const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: true,
      },
    });
    res.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};

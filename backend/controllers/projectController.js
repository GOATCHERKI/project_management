import { prisma } from "../configs/prisma.js";

export const createProject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {
      workspaceId,
      name,
      description,
      start_date,
      end_date,
      team_members,
      status,
      team_lead,
      progress,
      priority,
    } = req.body;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (
      !workspace.members.some(
        (member) => member.userId === userId && member.role === "ADMIN",
      )
    ) {
      return res
        .status(403)
        .json({ message: "Only workspace admins can create projects" });
    }

    const teamLead = await prisma.user.findUnique({
      where: { email: team_lead },
      select: { id: true },
    });

    if (!teamLead) {
      return res.status(404).json({ message: "Team lead user not found" });
    }

    const project = await prisma.project.create({
      data: {
        workspaceId,
        name,
        description,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        status,
        progress,
        priority,
        team_lead: teamLead.id,
      },
    });

    if (team_members?.length > 0) {
      const membersToAdd = [];
      workspace.members.forEach((member) => {
        if (team_members.includes(member.user.email)) {
          membersToAdd.push(member.user.id);
        }
      });
      await prisma.projectMember.createMany({
        data: membersToAdd.map((memberId) => ({
          projectId: project.id,
          userId: memberId,
        })),
      });
    }

    const projectWithMembers = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        members: { include: { user: true } },
        tasks: {
          include: { assignee: true, comments: { include: { user: true } } },
        },
        owner: true,
      },
    });

    res.json({
      project: projectWithMembers,
      message: "Project created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || error.code });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {
      id,
      workspaceId,
      name,
      description,
      start_date,
      end_date,
      status,
      progress,
      priority,
    } = req.body;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (
      !workspace.members.some(
        (member) => member.userId === userId && member.role === "ADMIN",
      )
    ) {
      const project = await prisma.project.findUnique({
        where: { id },
      });
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      } else {
        if (project.team_lead !== userId) {
          return res.status(403).json({
            message: "Only workspace admins or team leads can update projects",
          });
        }
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        workspaceId,
        name,
        description,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        status,
        progress,
        priority,
      },
    });

    res.json({
      project,
      message: "Project updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

export const addMember = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { projectId } = req.params;
    const { email } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.team_lead !== userId) {
      return res.status(403).json({
        message: "Only team leads can add members to projects",
      });
    }

    const existingMember = project.members.find(
      (member) => member.email === email,
    );

    if (existingMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
      },
    });

    res.json({ message: "Member added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

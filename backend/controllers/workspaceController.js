import { prisma } from "../configs/prisma.js";

export const getUserWorkspaces = async (req, res) => {
  try {
    const { userId } = req.auth();
    console.log("Fetching workspaces for userId:", userId);

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId: userId },
        },
      },
      include: {
        members: {
          include: { user: true },
        },
        projects: {
          include: {
            tasks: {
              include: {
                assignee: true,
                comments: { include: { user: true } },
              },
            },
            members: {
              include: { user: true },
            },
            owner: true,
          },
        },
        owner: true,
      },
    });

    console.log("Found workspaces:", workspaces.length);
    // Return workspaces in an object to match frontend expectations
    res.json({ workspaces });
  } catch (error) {
    console.error("Error fetching user workspaces:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to fetch user workspaces",
      details: error.message,
    });
  }
};

export const addUserToWorkspace = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { email, role, workspaceId, message } = req.body;

    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!workspaceId || !role) {
      return res
        .status(400)
        .json({ error: "Workspace ID and role are required" });
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    if (
      !workspace.members.find(
        (member) => member.userId === userId && member.role === "ADMIN",
      )
    ) {
      return res.status(401).json({ error: "Only admins can add members" });
    }

    const existingMembership = workspace.members.find(
      (member) => member.userId === userToAdd.id,
    );

    if (existingMembership) {
      return res
        .status(400)
        .json({ error: "User is already a member of the workspace" });
    }

    const workspaceMember = await prisma.workspaceMember.create({
      data: {
        userId: userToAdd.id,
        workspaceId,
        role,
        message,
      },
    });

    res.json({
      workspaceMember,
      message: "User added to workspace successfully",
    });
  } catch (error) {
    console.error("Error adding user to workspace:", error);
    res.status(500).json({ error: "Failed to add user to workspace" });
  }
};

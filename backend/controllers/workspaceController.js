import { prisma } from "../configs/prisma.js";
import { createClerkClient } from "@clerk/backend";
import sendEmail from "../configs/nodemailer.js";
import { generateInvitationEmail } from "../templates/invitationEmail.js";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

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

export const sendInvitation = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { email, role, workspaceId, redirectUrl } = req.body;
    const normalizedRole =
      role === "org:admin" ? "ADMIN" : role === "org:member" ? "MEMBER" : role;
    const clerkRole = normalizedRole === "ADMIN" ? "org:admin" : "org:member";

    // Redirect to accept-invitation page where we programmatically accept
    const finalRedirectUrl =
      redirectUrl ||
      process.env.CLERK_INVITATION_REDIRECT_URL ||
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/accept-invitation`;

    if (!workspaceId || !normalizedRole || !email) {
      return res
        .status(400)
        .json({ error: "Workspace ID, role, and email are required" });
    }

    if (!["ADMIN", "MEMBER"].includes(normalizedRole)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true, owner: true },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    // Check if requester is admin
    const isAdmin = workspace.members.find(
      (member) => member.userId === userId && member.role === "ADMIN",
    );

    if (!isAdmin && workspace.ownerId !== userId) {
      return res.status(401).json({ error: "Only admins can invite members" });
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingMembership = workspace.members.find(
        (member) => member.userId === existingUser.id,
      );

      if (existingMembership) {
        return res
          .status(400)
          .json({ error: "User is already a member of the workspace" });
      }
    }

    // Get inviter's name
    const inviter = await prisma.user.findUnique({
      where: { id: userId },
    });

    const clerkInvitation =
      await clerkClient.organizations.createOrganizationInvitation({
        organizationId: workspaceId,
        emailAddress: email,
        role: clerkRole,
        inviterUserId: userId,
        redirectUrl: finalRedirectUrl,
      });

    console.log("=== Clerk Invitation Created ===");
    console.log("Invitation ID:", clerkInvitation.id);
    console.log("Invitation URL:", clerkInvitation.url);
    console.log("Redirect URL:", finalRedirectUrl);
    console.log("================================");

    if (!clerkInvitation?.url) {
      return res.status(500).json({
        error: "Failed to generate Clerk invitation link",
      });
    }

    // Generate invitation email
    const inviteeName = email.split("@")[0]; // Use email prefix as name if we don't have full name
    const emailContent = generateInvitationEmail(
      inviteeName,
      workspace.name,
      inviter?.name || "Workspace Admin",
      clerkInvitation.url,
    );

    // Send email
    await sendEmail({
      to: email,
      subject: `You're invited to join ${workspace.name}`,
      body: emailContent,
    });

    res.json({
      success: true,
      message: "Invitation email sent successfully",
      invitedEmail: email,
      workspaceId,
      role: normalizedRole,
      invitationId: clerkInvitation.id,
    });
  } catch (error) {
    console.error("Error sending invitation:", error.message);
    console.error("Full error details:", error);
    res.status(500).json({
      error: "Failed to send invitation email",
      details: error.message,
    });
  }
};

export const getInvitationStatus = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const invitations =
      await clerkClient.organizations.getOrganizationInvitationList({
        organizationId: workspaceId,
      });

    res.json({
      invitations: invitations.data,
      totalCount: invitations.totalCount,
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
};

export const syncMember = async (req, res) => {
  try {
    console.log("\n=== SYNC MEMBER CALLED ===");
    const { userId } = req.auth();
    const { organizationId, role } = req.body;

    console.log("User ID:", userId);
    console.log("Organization ID:", organizationId);
    console.log("Role:", role);

    if (!organizationId) {
      console.error("Missing organization ID");
      return res.status(400).json({ error: "Organization ID is required" });
    }

    // The organizationId is the workspace ID in our system
    const workspaceId = organizationId;

    // Get the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      console.error(`Workspace not found: ${workspaceId}`);
      return res.status(404).json({ error: "Workspace not found" });
    }

    console.log("Found workspace:", workspace.name);

    // Check if already a member
    const existingMembership = workspace.members.find(
      (member) => member.userId === userId,
    );

    if (existingMembership) {
      console.log(
        `✓ User ${userId} already member of workspace ${workspaceId}`,
      );
      return res.json({
        success: true,
        message: "User is already a member of this workspace",
        workspaceMember: existingMembership,
      });
    }

    // Ensure user exists in database - create if not found
    console.log(`Checking if user ${userId} exists in database...`);
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log(
        `User ${userId} not found in database, creating from Clerk...`,
      );
      try {
        // Fetch user data from Clerk
        const clerkUser = await clerkClient.users.getUser(userId);
        console.log(
          `Got Clerk user data:`,
          clerkUser.emailAddresses[0]?.emailAddress,
        );

        // Create user in database
        user = await prisma.user.create({
          data: {
            id: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            name:
              `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
              "User",
          },
        });
        console.log(`✓ User created in database:`, user.id);
      } catch (clerkError) {
        console.error(`Failed to create user from Clerk:`, clerkError);
        return res.status(500).json({
          error: "Failed to create user in database",
          details: clerkError.message,
        });
      }
    } else {
      console.log(`✓ User ${userId} already exists in database`);
    }

    // Add user to workspace
    console.log(
      `Creating workspace member for user ${userId} in workspace ${workspaceId}`,
    );
    const workspaceMember = await prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId,
        role: role || "MEMBER",
      },
    });

    console.log(`✓✓✓ User ${userId} synced to workspace ${workspaceId}`);
    console.log("Workspace member created:", workspaceMember);
    console.log("========================\n");

    res.json({
      success: true,
      message: "Successfully synced member to workspace",
      workspaceMember,
    });
  } catch (error) {
    console.error("Error syncing member:", error);
    console.error("Error details:", error.message);
    res.status(500).json({
      error: "Failed to sync member",
      details: error.message,
    });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { workspaceId, role } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID is required" });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    // Check if already a member
    const existingMembership = workspace.members.find(
      (member) => member.userId === userId,
    );

    if (existingMembership) {
      return res
        .status(400)
        .json({ error: "User is already a member of this workspace" });
    }

    // Add user to workspace
    const workspaceMember = await prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId,
        role: role || "MEMBER",
      },
    });

    res.json({
      success: true,
      message: "Successfully joined the workspace",
      workspaceMember,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ error: "Failed to accept invitation" });
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

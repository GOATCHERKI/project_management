import { Inngest } from "inngest";
import { prisma } from "../configs/prisma.js";
import sendEmail from "../configs/nodemailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk", name: "Sync User Creation" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.create({
      data: {
        id: data.id,
        email: data?.email_addresses[0]?.email_address,
        name: data?.first_name + " " + data?.last_name,
        image: data?.image_url,
      },
    });
  },
);

const syncUserDeletion = inngest.createFunction(
  { id: "user-deletion-from-clerk", name: "Sync User Deletion" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.delete({
      where: {
        id: data.id,
      },
    });
  },
);

const syncUserUpdate = inngest.createFunction(
  { id: "user-update-from-clerk", name: "Sync User Update" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        email: data?.email_addresses[0]?.email_address,
        name: data?.first_name + " " + data?.last_name,
        image: data?.image_url,
      },
    });
  },
);

const syncOrgCreation = inngest.createFunction(
  { id: "sync-org-creation", name: "Sync Organization Creation" },
  { event: "clerk/organization.created" },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url ?? null,
      },
    });
    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: "ADMIN",
      },
    });
  },
);

const syncOrgUpdate = inngest.createFunction(
  { id: "sync-org-update", name: "Sync Organization Update" },
  { event: "clerk/organization.updated" },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url ?? null,
      },
    });
  },
);

const syncOrgDeletion = inngest.createFunction(
  { id: "sync-org-deletion", name: "Sync Organization Deletion" },
  { event: "clerk/organization.deleted" },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.delete({
      where: { id: data.id },
    });
  },
);

const syncOrgMemberAdded = inngest.createFunction(
  { id: "sync-org-member-added", name: "Sync Organization Member Added" },
  { event: "clerk/organizationMembership.created" },
  async ({ event }) => {
    const { data } = event;
    console.log("=== Organization Member Added ===");
    console.log("User ID:", data.public_user_data.user_id);
    console.log("Organization ID:", data.organization.id);
    console.log("Role:", data.role);

    try {
      const role = data.role === "org:admin" ? "ADMIN" : "MEMBER";

      // Check if membership already exists
      const existing = await prisma.workspaceMember.findFirst({
        where: {
          userId: data.public_user_data.user_id,
          workspaceId: data.organization.id,
        },
      });

      if (existing) {
        console.log("Workspace member already exists, updating role...");
        await prisma.workspaceMember.update({
          where: { id: existing.id },
          data: { role },
        });
      } else {
        await prisma.workspaceMember.create({
          data: {
            userId: data.public_user_data.user_id,
            workspaceId: data.organization.id,
            role,
          },
        });
      }

      console.log("Workspace member synced successfully");
    } catch (error) {
      console.error("Error syncing workspace member:", error);
      throw error;
    }
  },
);

const syncOrgMemberRemoved = inngest.createFunction(
  { id: "sync-org-member-removed", name: "Sync Organization Member Removed" },
  { event: "clerk/organizationMembership.deleted" },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspaceMember.deleteMany({
      where: {
        userId: data.public_user_data.user_id,
        workspaceId: data.organization.id,
      },
    });
  },
);

const sendTaskAssignmentEmail = inngest.createFunction(
  { id: "send-task-assignment-email", name: "Send Task Assignment Email" },
  { event: "app/task.assigned" },
  async ({ event, step }) => {
    const { taskId, origin } = event.data;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        project: true,
      },
    });
    await sendEmail({
      to: task.assignee.email,
      subject: `New Task Assigned in Project ${task.project.name}: ${task.title}`,
      body: `<p>Hello ${task.assignee.name},</p>
            <p>You have been assigned a new task in project <strong>${task.project.name}</strong>.</p>
             <p><strong>Task Title:</strong> ${task.title}</p>
             <p><strong>Description:</strong> ${task.description}</p>
              <p><strong>Due Date:</strong> ${task.due_date.toDateString()}</p>
              <p><a href="${origin}/projects/${task.projectId}/tasks/${task.id}">View Task</a></p>`,
    });

    if (
      new Date(task.due_date).toLocaleDateString() !==
      new Date().toLocaleDateString()
    ) {
      await step.sleep("wait-for-due-date", new Date(task.due_date)); // Sleep for 24 hours
    }

    if (!task || !task.assignee) {
      console.error("Task or assignee not found for task ID:", taskId);

      await step.run("check-if-task-is-completed", async () => {
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          include: {
            assignee: true,
            project: true,
          },
        });
        if (!task) return;

        if (task.status !== "DONE") {
          await step.run("send-task-completion-email", async () => {
            await sendEmail({
              to: task.assignee.email,
              subject: `Reminder: Task "${task.title}" is due today!`,
              body: `<p>Hello ${task.assignee.name},</p>
                    <p>This is a reminder that the task <strong>${task.title}</strong> in project <strong>${task.project.name}</strong> is due today.</p>
                    <p><strong>Description:</strong> ${task.description}</p>
                    <p><a href="${origin}/projects/${task.projectId}/tasks/${task.id}">View Task</a></p>`,
            });
          });
        }
      });
    }
  },
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdate,
  syncOrgCreation,
  syncOrgUpdate,
  syncOrgDeletion,
  syncOrgMemberAdded,
  syncOrgMemberRemoved,
  sendTaskAssignmentEmail,
];

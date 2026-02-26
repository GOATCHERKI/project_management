import { Inngest } from "inngest";
import { prisma } from "../configs/prisma.js";

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
    const role = data.role === "org:admin" ? "ADMIN" : "MEMBER";
    await prisma.workspaceMember.create({
      data: {
        userId: data.public_user_data.user_id,
        workspaceId: data.organization.id,
        role,
      },
    });
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

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdate,
  syncOrgCreation,
  syncOrgUpdate,
  syncOrgDeletion,
  syncOrgMemberAdded,
  syncOrgMemberRemoved,
];

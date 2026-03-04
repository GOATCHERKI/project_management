import express from "express";
import {
  addUserToWorkspace,
  getUserWorkspaces,
  sendInvitation,
  acceptInvitation,
  getInvitationStatus,
  syncMember,
} from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getUserWorkspaces);
workspaceRouter.get("/:workspaceId/invitations", getInvitationStatus);
workspaceRouter.post("/add-member", addUserToWorkspace);
workspaceRouter.post("/send-invitation", sendInvitation);
workspaceRouter.post("/accept-invitation", acceptInvitation);
workspaceRouter.post("/sync-member", syncMember);

export default workspaceRouter;

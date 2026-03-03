import express from "express";
import {
  addUserToWorkspace,
  getUserWorkspaces,
  sendWorkspaceInviteEmail,
} from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getUserWorkspaces);
workspaceRouter.post("/add-member", addUserToWorkspace);
workspaceRouter.post("/send-invite", sendWorkspaceInviteEmail);

export default workspaceRouter;

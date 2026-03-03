import express from "express";
import {
  addUserToWorkspace,
  getUserWorkspaces,
} from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getUserWorkspaces);
workspaceRouter.post("/add-member", addUserToWorkspace);

export default workspaceRouter;

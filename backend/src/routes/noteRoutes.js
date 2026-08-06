import express from "express";
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  togglePin,
  toggleArchive,
  trashNote,
  restoreNote,
  deleteNotePermanently,
} from "../controllers/noteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // every route below requires a logged-in user

router.route("/").post(createNote).get(getNotes);

router.route("/:id").get(getNoteById).put(updateNote).delete(trashNote);

router.patch("/:id/pin", togglePin);
router.patch("/:id/archive", toggleArchive);
router.patch("/:id/restore", restoreNote);
router.delete("/:id/permanent", deleteNotePermanently);

export default router;

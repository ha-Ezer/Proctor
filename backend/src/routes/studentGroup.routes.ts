import { Router } from 'express';
import * as studentGroupController from '../controllers/studentGroup.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

/**
 * Group Management
 */
router.get('/groups', studentGroupController.getGroups);
router.get('/groups/:groupId', studentGroupController.getGroupById);
router.post('/groups', studentGroupController.createGroup);
router.patch('/groups/:groupId', studentGroupController.updateGroup);
router.delete('/groups/:groupId', studentGroupController.deleteGroup);

/**
 * Group Membership
 */
router.get('/groups/:groupId/members', studentGroupController.getGroupMembers);
router.post('/groups/:groupId/members', studentGroupController.addStudentToGroup);
router.post('/groups/:groupId/members/bulk', studentGroupController.addStudentsByEmail);
router.delete('/groups/:groupId/members/:studentId', studentGroupController.removeStudentFromGroup);

/**
 * Student Groups
 */
router.get('/students/:studentId/groups', studentGroupController.getStudentGroups);

/**
 * Exam-Group Assignments
 */
router.get('/exams/:examId/groups', studentGroupController.getExamGroups);
router.post('/exams/:examId/groups', studentGroupController.assignGroupToExam);
router.delete('/exams/:examId/groups/:groupId', studentGroupController.removeGroupFromExam);

export default router;

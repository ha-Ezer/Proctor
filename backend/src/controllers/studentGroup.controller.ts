import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { studentGroupService } from '../services/studentGroup.service';

/**
 * Get All Groups
 * GET /api/admin/groups
 */
export const getGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const groups = await studentGroupService.getGroups();

    res.json({
      success: true,
      message: 'Groups retrieved successfully',
      data: { groups, count: groups.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Group By ID
 * GET /api/admin/groups/:groupId
 */
export const getGroupById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    const group = await studentGroupService.getGroupById(groupId);

    res.json({
      success: true,
      message: 'Group retrieved successfully',
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Group
 * POST /api/admin/groups
 */
export const createGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const createdBy = req.user?.email;

    const group = await studentGroupService.createGroup({ name, description, createdBy });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Group
 * PATCH /api/admin/groups/:groupId
 */
export const updateGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;

    const group = await studentGroupService.updateGroup(groupId, { name, description });

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Group
 * DELETE /api/admin/groups/:groupId
 */
export const deleteGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    const result = await studentGroupService.deleteGroup(groupId);

    res.json({
      success: true,
      message: `Group "${result.groupName}" deleted successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Group Members
 * GET /api/admin/groups/:groupId/members
 */
export const getGroupMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    const members = await studentGroupService.getGroupMembers(groupId);

    res.json({
      success: true,
      message: 'Group members retrieved successfully',
      data: { members, count: members.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Student to Group
 * POST /api/admin/groups/:groupId/members
 */
export const addStudentToGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    const { studentId } = req.body;
    const addedBy = req.user?.email;

    const member = await studentGroupService.addStudentToGroup(groupId, studentId, addedBy);

    res.status(201).json({
      success: true,
      message: 'Student added to group successfully',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Multiple Students to Group by Email
 * POST /api/admin/groups/:groupId/members/bulk
 */
export const addStudentsByEmail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    const { emails } = req.body;
    const addedBy = req.user?.email;

    const result = await studentGroupService.addStudentsByEmail(groupId, emails, addedBy);

    res.json({
      success: true,
      message: `Added ${result.added} student(s) to group`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove Student from Group
 * DELETE /api/admin/groups/:groupId/members/:studentId
 */
export const removeStudentFromGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId, studentId } = req.params;
    const result = await studentGroupService.removeStudentFromGroup(groupId, studentId);

    res.json({
      success: true,
      message: 'Student removed from group successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Student's Groups
 * GET /api/admin/students/:studentId/groups
 */
export const getStudentGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const groups = await studentGroupService.getStudentGroups(studentId);

    res.json({
      success: true,
      message: 'Student groups retrieved successfully',
      data: { groups, count: groups.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign Group to Exam
 * POST /api/admin/exams/:examId/groups
 */
export const assignGroupToExam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const { groupId } = req.body;
    const createdBy = req.user?.email;

    const access = await studentGroupService.assignGroupToExam(examId, groupId, createdBy);

    res.status(201).json({
      success: true,
      message: 'Group assigned to exam successfully',
      data: access,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove Group from Exam
 * DELETE /api/admin/exams/:examId/groups/:groupId
 */
export const removeGroupFromExam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId, groupId } = req.params;
    const result = await studentGroupService.removeGroupFromExam(examId, groupId);

    res.json({
      success: true,
      message: 'Group removed from exam successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Exam Groups
 * GET /api/admin/exams/:examId/groups
 */
export const getExamGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const groups = await studentGroupService.getExamGroups(examId);

    res.json({
      success: true,
      message: 'Exam groups retrieved successfully',
      data: { groups, count: groups.length },
    });
  } catch (error) {
    next(error);
  }
};

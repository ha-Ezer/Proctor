"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExamGroups = exports.removeGroupFromExam = exports.assignGroupToExam = exports.getStudentGroups = exports.removeStudentFromGroup = exports.addStudentsByEmail = exports.addStudentToGroup = exports.getGroupMembers = exports.deleteGroup = exports.updateGroup = exports.createGroup = exports.getGroupById = exports.getGroups = void 0;
const studentGroup_service_1 = require("../services/studentGroup.service");
/**
 * Get All Groups
 * GET /api/admin/groups
 */
const getGroups = async (req, res, next) => {
    try {
        const groups = await studentGroup_service_1.studentGroupService.getGroups();
        res.json({
            success: true,
            message: 'Groups retrieved successfully',
            data: { groups, count: groups.length },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getGroups = getGroups;
/**
 * Get Group By ID
 * GET /api/admin/groups/:groupId
 */
const getGroupById = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const group = await studentGroup_service_1.studentGroupService.getGroupById(groupId);
        res.json({
            success: true,
            message: 'Group retrieved successfully',
            data: group,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getGroupById = getGroupById;
/**
 * Create Group
 * POST /api/admin/groups
 */
const createGroup = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const createdBy = req.user?.email;
        const group = await studentGroup_service_1.studentGroupService.createGroup({ name, description, createdBy });
        res.status(201).json({
            success: true,
            message: 'Group created successfully',
            data: group,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createGroup = createGroup;
/**
 * Update Group
 * PATCH /api/admin/groups/:groupId
 */
const updateGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { name, description } = req.body;
        const group = await studentGroup_service_1.studentGroupService.updateGroup(groupId, { name, description });
        res.json({
            success: true,
            message: 'Group updated successfully',
            data: group,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateGroup = updateGroup;
/**
 * Delete Group
 * DELETE /api/admin/groups/:groupId
 */
const deleteGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const result = await studentGroup_service_1.studentGroupService.deleteGroup(groupId);
        res.json({
            success: true,
            message: `Group "${result.groupName}" deleted successfully`,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteGroup = deleteGroup;
/**
 * Get Group Members
 * GET /api/admin/groups/:groupId/members
 */
const getGroupMembers = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const members = await studentGroup_service_1.studentGroupService.getGroupMembers(groupId);
        res.json({
            success: true,
            message: 'Group members retrieved successfully',
            data: { members, count: members.length },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getGroupMembers = getGroupMembers;
/**
 * Add Student to Group
 * POST /api/admin/groups/:groupId/members
 */
const addStudentToGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { studentId } = req.body;
        const addedBy = req.user?.email;
        const member = await studentGroup_service_1.studentGroupService.addStudentToGroup(groupId, studentId, addedBy);
        res.status(201).json({
            success: true,
            message: 'Student added to group successfully',
            data: member,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addStudentToGroup = addStudentToGroup;
/**
 * Add Multiple Students to Group by Email
 * POST /api/admin/groups/:groupId/members/bulk
 */
const addStudentsByEmail = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { emails } = req.body;
        const addedBy = req.user?.email;
        const result = await studentGroup_service_1.studentGroupService.addStudentsByEmail(groupId, emails, addedBy);
        res.json({
            success: true,
            message: `Added ${result.added} student(s) to group`,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addStudentsByEmail = addStudentsByEmail;
/**
 * Remove Student from Group
 * DELETE /api/admin/groups/:groupId/members/:studentId
 */
const removeStudentFromGroup = async (req, res, next) => {
    try {
        const { groupId, studentId } = req.params;
        const result = await studentGroup_service_1.studentGroupService.removeStudentFromGroup(groupId, studentId);
        res.json({
            success: true,
            message: 'Student removed from group successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.removeStudentFromGroup = removeStudentFromGroup;
/**
 * Get Student's Groups
 * GET /api/admin/students/:studentId/groups
 */
const getStudentGroups = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const groups = await studentGroup_service_1.studentGroupService.getStudentGroups(studentId);
        res.json({
            success: true,
            message: 'Student groups retrieved successfully',
            data: { groups, count: groups.length },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentGroups = getStudentGroups;
/**
 * Assign Group to Exam
 * POST /api/admin/exams/:examId/groups
 */
const assignGroupToExam = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const { groupId } = req.body;
        const createdBy = req.user?.email;
        const access = await studentGroup_service_1.studentGroupService.assignGroupToExam(examId, groupId, createdBy);
        res.status(201).json({
            success: true,
            message: 'Group assigned to exam successfully',
            data: access,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.assignGroupToExam = assignGroupToExam;
/**
 * Remove Group from Exam
 * DELETE /api/admin/exams/:examId/groups/:groupId
 */
const removeGroupFromExam = async (req, res, next) => {
    try {
        const { examId, groupId } = req.params;
        const result = await studentGroup_service_1.studentGroupService.removeGroupFromExam(examId, groupId);
        res.json({
            success: true,
            message: 'Group removed from exam successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.removeGroupFromExam = removeGroupFromExam;
/**
 * Get Exam Groups
 * GET /api/admin/exams/:examId/groups
 */
const getExamGroups = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const groups = await studentGroup_service_1.studentGroupService.getExamGroups(examId);
        res.json({
            success: true,
            message: 'Exam groups retrieved successfully',
            data: { groups, count: groups.length },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getExamGroups = getExamGroups;
//# sourceMappingURL=studentGroup.controller.js.map
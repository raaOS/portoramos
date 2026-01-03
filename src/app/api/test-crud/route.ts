
import { NextResponse } from 'next/server';
import { projectService } from '@/lib/services/projectService';
import { CreateProjectData, UpdateProjectData, Project } from '@/types/projects';

export async function GET() {
    const logs: string[] = [];
    const log = (msg: string) => logs.push(`[${new Date().toISOString()}] ${msg}`);

    try {
        log('Starting CRUD Verification...');

        // 1. CREATE
        const newProjectData: CreateProjectData = {
            title: 'Test CRUD Project',
            client: 'Antigravity Tester',
            description: 'A temporary project for testing CRUD operations.',
            year: 2025,
            tags: ['Test', 'Debugging'],
            cover: 'https://via.placeholder.com/800x600',
            initialCommentCount: 0,
            status: 'draft'
        };

        log('1. Attempting to CREATE project...');
        const createdProject = await projectService.createProject(newProjectData);
        if (!createdProject || !createdProject.id) throw new Error('Create failed: No project returned');
        log(`   ✅ Created Project ID: ${createdProject.id}, Slug: ${createdProject.slug}`);

        // 2. READ
        log('2. Attempting to READ (Get All)...');
        const { projects } = await projectService.getProjects('draft', true); // Check drafts
        const found = projects.find((p: Project) => p.id === createdProject.id);
        if (!found) throw new Error('Read failed: Created project not found in list');
        log(`   ✅ Found project in list: ${found.title}`);

        // 3. UPDATE
        log('3. Attempting to UPDATE project...');
        const updateData: UpdateProjectData = {
            id: createdProject.id,
            description: 'Updated description for testing.',
            likes: 999
        };
        const updatedProject = await projectService.updateProject(createdProject.id, updateData);
        if (!updatedProject || updatedProject.description !== updateData.description) throw new Error('Update failed: Data mismatch');
        log(`   ✅ Updated project description: ${updatedProject.description}`);

        // 4. DELETE
        log('4. Attempting to DELETE project...');
        const deleteSuccess = await projectService.deleteProject(createdProject.id);
        if (!deleteSuccess) throw new Error('Delete failed: Service returned false');

        // Verify deletion
        const { projects: remainingProjects } = await projectService.getProjects('draft', true);
        if (remainingProjects.find((p: Project) => p.id === createdProject.id)) throw new Error('Delete failed: Project still exists in list');
        log('   ✅ Deleted project successfully');

        log('🎉 All CRUD operations verified successfully!');

        return NextResponse.json({ success: true, logs });

    } catch (error: any) {
        log(`❌ ERROR: ${error.message}`);
        console.error(error);
        return NextResponse.json({ success: false, logs, error: error.message }, { status: 500 });
    }
}

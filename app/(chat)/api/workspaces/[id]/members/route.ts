import { auth } from '@/app/(auth)/auth';
import {
  getWorkspaceMember,
  getWorkspaceMembers,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return new ChatSDKError('unauthorized:workspace').toResponse();
  }

  const { id: workspaceId } = await params;

  try {
    // Ensure the requester is a member of the workspace
    const member = await getWorkspaceMember({
      workspaceId,
      userId: session.user.id,
    });

    if (!member) {
      return new ChatSDKError(
        'forbidden:workspace',
        'Not a member of this workspace',
      ).toResponse();
    }

    const members = await getWorkspaceMembers({ workspaceId });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('[Workspace Members API] Failed to fetch members', error);
    return new ChatSDKError(
      'bad_request:database',
      'Failed to fetch workspace members',
    ).toResponse();
  }
}


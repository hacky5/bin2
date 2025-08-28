import {NextRequest, NextResponse} from 'next/server';
import {redis} from '@/lib/redis';
import {roleRequired, getCurrentUser} from '@/lib/auth';
import {addLogEntry} from '@/lib/utils';

async function updateIssueHandler(
  req: NextRequest,
  {params}: {params: {issue_id: string}}
) {
  const {issue_id} = params;
  const {status} = await req.json();
  if (!status) {
    return NextResponse.json({error: 'Status is required'}, {status: 400});
  }
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({message: 'Unauthorized'}, {status: 401});
  }

  let issues: any[] = (await redis.get('issues')) || [];
  if (typeof issues === 'string') {
    issues = JSON.parse(issues);
  }
  let issueFound = false;

  issues = issues.map(issue => {
    if (issue.id === issue_id) {
      issueFound = true;
      return {...issue, status};
    }
    return issue;
  });

  if (!issueFound) {
    return NextResponse.json({error: 'Issue not found'}, {status: 404});
  }

  await redis.set('issues', JSON.stringify(issues));
  await addLogEntry(
    user.email,
    `Issue status for ${issue_id} updated to '${status}'`
  );
  return NextResponse.json({message: 'Issue status updated successfully'});
}

export const PUT = roleRequired(['superuser', 'editor'], updateIssueHandler);

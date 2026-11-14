import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';
import { v4 as uuidv4 } from 'uuid';
import { imageCache, getMimeTypeFromFilename } from '@/lib/imageCache';

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_USER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error('GitHub configuration is missing in environment variables.');
  }

  return {
    octokit: new Octokit({ auth: token }),
    owner,
    repo
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const { octokit, owner, repo } = getOctokit();

    // Get repo info to find default branch
    const repoInfo = await octokit.rest.repos.get({ owner, repo });
    const defaultBranch = repoInfo.data.default_branch;

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawExt = file.name?.includes('.') ? file.name.split('.').pop() : '';
    const mimeExt = file.type?.split('/')[1]?.split('+')[0];
    const extension = (rawExt || mimeExt || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const fileName = `${uuidv4()}.${extension}`;
    const path = `images/${fileName}`;

    // Store in memory cache immediately so /images/${fileName} resolves in 0ms
    const contentType = file.type || getMimeTypeFromFilename(fileName);
    imageCache.set(path, { buffer, contentType });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Upload image ${fileName}`,
      content: buffer.toString('base64'),
      branch: defaultBranch
    });

    // Return root-relative path /images/${fileName}
    // This works both in our app (via /app/images/[...path]/route.ts with GITHUB_TOKEN)
    // AND natively inside .md files viewed on GitHub.com (even in private repositories!)
    const url = `/images/${fileName}`;

    return NextResponse.json({ url, path });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

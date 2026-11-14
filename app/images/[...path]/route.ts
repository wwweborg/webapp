import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';
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
    repo,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params;
    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: 'Image path required' }, { status: 400 });
    }

    const relativePath = pathSegments.join('/').replace(/^\/+/, '');
    const repoPath = `images/${relativePath}`;

    // 1. Serve immediately from in-memory cache if available
    const cached = imageCache.get(repoPath);
    if (cached) {
      return new NextResponse(new Uint8Array(cached.buffer), {
        status: 200,
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. Fetch from private/public GitHub repo using authenticated Octokit
    const { octokit, owner, repo } = getOctokit();
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: repoPath,
    });

    if (Array.isArray(response.data) || response.data.type !== 'file') {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    let base64Content = response.data.content;
    if (!base64Content && response.data.sha) {
      // Fallback for images > 1MB via Git Blob API
      const blobRes = await octokit.rest.git.getBlob({
        owner,
        repo,
        file_sha: response.data.sha,
      });
      base64Content = blobRes.data.content;
    }

    if (!base64Content) {
      return NextResponse.json({ error: 'Empty image content' }, { status: 404 });
    }

    const buffer = Buffer.from(base64Content.replace(/\s/g, ''), 'base64');
    const contentType = getMimeTypeFromFilename(relativePath);

    // Cache in memory for fast subsequent loads
    imageCache.set(repoPath, { buffer, contentType });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving image from GitHub:', error?.message || error);
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}

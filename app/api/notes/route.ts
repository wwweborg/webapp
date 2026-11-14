import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';

// Helper to get configured Octokit instance
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

function resolveNotePath(searchParams: URLSearchParams): string | null {
  const rawPath = searchParams.get('path');
  if (rawPath !== null) return rawPath;
  const encodedP = searchParams.get('p');
  if (encodedP) {
    try {
      return decodeURIComponent(Buffer.from(encodedP, 'base64').toString('utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPath = resolveNotePath(searchParams);
    const { octokit, owner, repo } = getOctokit();

    if (rawPath) {
      const cleanPath = rawPath.replace(/^\/+/, '').replace(/\/+/g, '/').trim();
      if (!cleanPath) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
      }

      // Get specific file
      const response = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: cleanPath,
      });

      if (Array.isArray(response.data)) {
        return NextResponse.json({ error: 'Path is a directory' }, { status: 400 });
      }

      if (response.data.type !== 'file') {
        return NextResponse.json({ error: 'Not a file' }, { status: 400 });
      }

      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return NextResponse.json({
        content,
        sha: response.data.sha,
        path: response.data.path
      });
    }

    // List all markdown files and folders recursively
    const repoInfo = await octokit.rest.repos.get({ owner, repo });
    const defaultBranch = repoInfo.data.default_branch;

    let items: any[] = [];
    try {
      const treeResponse = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: defaultBranch,
        recursive: 'true',
      });

      items = treeResponse.data.tree
        .filter(item => 
          item.path !== 'images' &&
          !item.path?.startsWith('images/') &&
          ((item.type === 'blob' && item.path?.endsWith('.md')) || 
          item.type === 'tree')
        )
        .map(item => ({
          name: item.path?.split('/').pop() || '',
          path: item.path || '',
          sha: item.sha || '',
          type: item.type === 'tree' ? 'dir' : 'file'
        }));
    } catch (treeError: any) {
      if (treeError.status === 409 || treeError.message?.includes('is empty')) {
        // Repository is empty, which is fine. Just return empty notes list.
        items = [];
      } else {
        throw treeError;
      }
    }

    return NextResponse.json({ notes: items });
  } catch (error: any) {
    console.error('GitHub API Error:', error);
    if (error.message && error.message.includes('missing in environment')) {
       return NextResponse.json({ error: error.message, isConfigError: true }, { status: 500 });
    }
    if (error.status === 404) {
      return NextResponse.json({ error: 'Not found', isConfigError: true }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: rawPath, content, sha, message } = body;

    if (!rawPath || content === undefined) {
      return NextResponse.json({ error: 'Path and content are required' }, { status: 400 });
    }

    const cleanPath = rawPath.replace(/^\/+/, '').replace(/\/+/g, '/').trim();
    if (!cleanPath) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const { octokit, owner, repo } = getOctokit();

    // Auto-fetch current file SHA if not explicitly provided
    let fileSha = sha || undefined;
    if (!fileSha) {
      try {
        const existing = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: cleanPath,
        });
        if (!Array.isArray(existing.data) && existing.data.sha) {
          fileSha = existing.data.sha;
        }
      } catch (e) {
        // File does not exist yet; safe for creation
      }
    }

    const commitMessage = message || (fileSha ? `Update ${cleanPath}` : `Create ${cleanPath}`);

    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: cleanPath,
      message: commitMessage,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      sha: fileSha,
    });

    return NextResponse.json({
      success: true,
      content: response.data.content,
      commit: response.data.commit
    });

  } catch (error: any) {
    console.error('GitHub API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPath = resolveNotePath(searchParams);

    if (!rawPath) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    const cleanPath = rawPath.replace(/^\/+/, '').replace(/\/+/g, '/').trim();
    if (!cleanPath) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const { octokit, owner, repo } = getOctokit();

    // Check if it's a directory or try directory deletion first
    try {
      const res = await octokit.rest.repos.getContent({ owner, repo, path: cleanPath });
      if (Array.isArray(res.data)) {
        const repoInfo = await octokit.rest.repos.get({ owner, repo });
        const defaultBranch = repoInfo.data.default_branch;
        const treeResponse = await octokit.rest.git.getTree({
          owner,
          repo,
          tree_sha: defaultBranch,
          recursive: 'true',
        });

        const prefix = cleanPath.endsWith('/') ? cleanPath : cleanPath + '/';
        const filesToDelete = treeResponse.data.tree.filter(
          item => item.type === 'blob' && item.path && item.path.startsWith(prefix)
        );

        for (const file of filesToDelete) {
          if (file.path) {
            try {
              const fileRes = await octokit.rest.repos.getContent({ owner, repo, path: file.path });
              if (!Array.isArray(fileRes.data) && fileRes.data.sha) {
                await octokit.rest.repos.deleteFile({
                  owner,
                  repo,
                  path: file.path,
                  message: `Delete ${file.path}`,
                  sha: fileRes.data.sha,
                });
              }
            } catch (err) {
              // ignore individual delete errors if already deleted
            }
          }
        }
        return NextResponse.json({ success: true, deletedFolder: cleanPath });
      }
    } catch (e) {
      // Not a directory or error fetching content as dir
    }

    // Single file deletion: always fetch fresh sha via getContent
    let fileSha = '';
    try {
      const fileRes = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: cleanPath,
      });
      if (!Array.isArray(fileRes.data) && fileRes.data.sha) {
        fileSha = fileRes.data.sha;
      }
    } catch (e: any) {
      console.error('Error getting file content for delete:', e);
    }

    if (!fileSha) {
      return NextResponse.json({ error: 'File not found or SHA could not be retrieved' }, { status: 404 });
    }

    const response = await octokit.rest.repos.deleteFile({
      owner,
      repo,
      path: cleanPath,
      message: `Delete ${cleanPath}`,
      sha: fileSha,
    });

    return NextResponse.json({ success: true, commit: response.data.commit });

  } catch (error: any) {
    console.error('GitHub API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

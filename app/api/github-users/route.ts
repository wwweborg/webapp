import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';

export interface GitHubUserSuggestion {
  login: string;
  avatar_url: string;
  html_url: string;
  name?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim().replace(/^@/, '');

  try {
    const token = process.env.GITHUB_TOKEN;
    const octokit = token ? new Octokit({ auth: token }) : new Octokit();

    // If user typed a search query (e.g. @torvalds), search GitHub Users (only People / type:user)
    if (query.length > 0) {
      const searchRes = await octokit.rest.search.users({
        q: `${query} type:user in:login,name`,
        per_page: 8,
      });

      const users: GitHubUserSuggestion[] = (searchRes.data.items || []).map((u) => ({
        login: u.login,
        avatar_url: u.avatar_url,
        html_url: u.html_url || `https://github.com/${u.login}`,
      }));

      return NextResponse.json({ users });
    }

    // If query is empty (just typed '@'), return authenticated user + people they follow / followers
    if (token) {
      const results: GitHubUserSuggestion[] = [];
      const seen = new Set<string>();

      try {
        const authUser = await octokit.rest.users.getAuthenticated();
        if (authUser.data?.login) {
          seen.add(authUser.data.login.toLowerCase());
          results.push({
            login: authUser.data.login,
            name: authUser.data.name || undefined,
            avatar_url: authUser.data.avatar_url,
            html_url: authUser.data.html_url || `https://github.com/${authUser.data.login}`,
          });
        }

        const [followingRes, followersRes] = await Promise.allSettled([
          octokit.rest.users.listFollowedByAuthenticatedUser({ per_page: 6 }),
          octokit.rest.users.listFollowersForAuthenticatedUser({ per_page: 6 }),
        ]);

        if (followingRes.status === 'fulfilled') {
          for (const u of followingRes.value.data) {
            if (!seen.has(u.login.toLowerCase())) {
              seen.add(u.login.toLowerCase());
              results.push({
                login: u.login,
                avatar_url: u.avatar_url,
                html_url: u.html_url || `https://github.com/${u.login}`,
              });
            }
          }
        }

        if (followersRes.status === 'fulfilled') {
          for (const u of followersRes.value.data) {
            if (!seen.has(u.login.toLowerCase()) && results.length < 8) {
              seen.add(u.login.toLowerCase());
              results.push({
                login: u.login,
                avatar_url: u.avatar_url,
                html_url: u.html_url || `https://github.com/${u.login}`,
              });
            }
          }
        }
      } catch {
        // Fallback if token lacks user scope
      }

      if (results.length > 0) {
        return NextResponse.json({ users: results.slice(0, 8) });
      }
    }

    // Public fallback suggestions when query is empty
    const defaultRes = await octokit.rest.search.users({
      q: 'type:user followers:>10000',
      per_page: 6,
    });

    const users: GitHubUserSuggestion[] = (defaultRes.data.items || []).map((u) => ({
      login: u.login,
      avatar_url: u.avatar_url,
      html_url: u.html_url || `https://github.com/${u.login}`,
    }));

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ users: [], error: error?.message || 'Error' }, { status: 200 });
  }
}

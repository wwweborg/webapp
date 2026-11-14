import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';

export async function GET(request: NextRequest) {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }
    const octokit = new Octokit({ auth: token });
    const response = await octokit.rest.users.getAuthenticated();
    
    return NextResponse.json({
      login: response.data.login,
      name: response.data.name,
      avatar_url: response.data.avatar_url,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

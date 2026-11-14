/**
 * Single source of truth for public site information.
 *
 * `APP_URL` is read at build time so a self-hosted deployment can set its own
 * canonical URL. It falls back to the official deployment.
 */
export const SITE_URL = (process.env.APP_URL ?? 'https://webapp.microtecn.xyz').replace(/\/+$/, '');

export const SITE_NAME = 'Webapp';

export const SITE_DESCRIPTION =
  'Aplicación de notas Markdown minimalista con sincronización en GitHub, IA multimodelo y cifrado de extremo a extremo. Parte del ecosistema wwwOS.';

export const SITE_TITLE = 'Webapp — Notas Markdown con GitHub e IA';

export const GITHUB_URL = 'https://github.com/wwweborg/webapp';
export const GITHUB_ORG_URL = 'https://github.com/wwweborg';
export const DISCUSSIONS_URL = `${GITHUB_URL}/discussions`;
export const ISSUES_URL = `${GITHUB_URL}/issues`;

export const OG_IMAGE_ALT = 'Webapp: notas Markdown privadas con sincronización en GitHub e IA';

"""Unpublish only the approved Pages site; PASS requires API and HTTP evidence."""
import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone
from urllib.error import HTTPError
from urllib.request import Request, urlopen

EXPECTED_REPO = 'twk0672005/ta-writing-lab'
API = 'https://api.github.com/repos/' + EXPECTED_REPO
SITE = 'https://twk0672005.github.io/ta-writing-lab/'
EXPIRY = datetime.fromisoformat('2026-10-05T15:00:00+00:00')
PATHS = ('', 'index.html', 'app.js', 'core.js', 'content.json', 'styles.css', 'favicon.svg')


def emit(**values):
    print(json.dumps({'checked_at_utc': datetime.now(timezone.utc).isoformat(), **values}), flush=True)


def request(url, method='GET', token=None):
    headers = {'User-Agent': 'Writing-Notes-Expiry', 'Cache-Control': 'no-cache'}
    if token:
        headers.update({'Authorization': 'Bearer ' + token,
                        'Accept': 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28'})
    try:
        response = urlopen(Request(url, method=method, headers=headers), timeout=15)
    except HTTPError as error:
        response = error
    with response:
        body = response.read()
        # Never log request headers, cookies or credentials. Keep server diagnostics.
        info = {'url': url, 'method': method, 'http_status': response.status,
                'final_url': response.geturl(), 'sha256': hashlib.sha256(body).hexdigest(),
                'request_id': response.headers.get('X-GitHub-Request-Id'),
                'accepted_permissions': response.headers.get('X-Accepted-GitHub-Permissions'),
                'rate_limit_remaining': response.headers.get('X-RateLimit-Remaining')}
        return info, body


def api(path, token, method='GET', allowed=(200,)):
    info, body = request(API + path, method, token)
    data = json.loads(body) if body else None
    if isinstance(data, dict):
        # GitHub's message is sufficient; do not echo arbitrary response data.
        message = data.get('message')
        if isinstance(message, str):
            info['message'] = message.replace(token, '[REDACTED]')
    emit(kind='api', **info)
    if info['http_status'] not in allowed:
        raise RuntimeError('HOLD: ' + method + ' ' + path + ' HTTP ' + str(info['http_status']))
    return info['http_status'], data


def verify(token, before_sha):
    status, _ = api('/pages', token, allowed=(200, 404))
    web = []
    nonce = str(time.time_ns())
    for path in PATHS:
        info, _ = request(SITE + path + '?expiry-check=' + nonce)
        emit(kind='website', **info)
        web.append(info)
    _, commit = api('/commits/main', token)
    preserved = commit['sha'] == before_sha
    _, repo = api('', token)
    preserved = preserved and repo['full_name'] == EXPECTED_REPO
    passed = status == 404 and all(x['http_status'] == 404 and
        x['final_url'].startswith(SITE) for x in web) and preserved
    emit(result='PASS' if passed else 'HOLD', pages_api_status=status,
         website_statuses=[x['http_status'] for x in web],
         before_main_sha=before_sha, after_main_sha=commit['sha'], source_preserved=preserved)
    return passed


def main():
    if os.environ.get('GITHUB_REPOSITORY') != EXPECTED_REPO:
        raise RuntimeError('HOLD: repository scope mismatch')
    mode = os.environ.get('DRY_RUN', 'true').lower()
    if mode not in ('true', 'false'):
        raise RuntimeError('HOLD: DRY_RUN must be true or false')
    verify_only = os.environ.get('VERIFY_ONLY', 'false').lower() == 'true'
    read_token = os.environ.get('GH_TOKEN', '')
    if not read_token:
        raise RuntimeError('HOLD: authenticated Pages read token required; anonymous 404 is not proof')
    _, repo = api('', read_token)
    if repo['full_name'] != EXPECTED_REPO:
        raise RuntimeError('HOLD: repository identity mismatch')
    _, commit = api('/commits/main', read_token)
    before_sha = commit['sha']
    status, site = api('/pages', read_token, allowed=(200, 404))
    if status == 200 and (site.get('html_url') != SITE or site.get('cname')):
        raise RuntimeError('HOLD: changed Pages URL/custom domain requires explicit verification scope')
    if verify_only:
        if not verify(read_token, before_sha):
            raise RuntimeError('HOLD: public website or Pages API is still active')
        return
    if mode == 'true':
        emit(result='DRY_RUN', changed=False, pages_api_status=status, main_sha=before_sha)
        return
    if datetime.now(timezone.utc) < EXPIRY:
        raise RuntimeError('HOLD: refusing to unpublish before the authorized deadline')
    if status == 200:
        admin_token = os.environ.get('PAGES_EXPIRY_TOKEN', '')
        if not admin_token:
            raise RuntimeError('HOLD: PAGES_EXPIRY_TOKEN required with Pages:write AND Administration:write; GITHUB_TOKEN cannot supply Administration')
        # Check visibility with the deletion credential, then delete only /pages.
        admin_status, _ = api('/pages', admin_token, allowed=(200, 404))
        if admin_status == 200:
            api('/pages', admin_token, 'DELETE', allowed=(204,))
    for attempt in range(3):
        if verify(read_token, before_sha):
            return
        if attempt < 2:
            time.sleep(10)
    raise RuntimeError('HOLD: unpublish not proven; rerun VERIFY_ONLY after CDN propagation')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        emit(result='HOLD', error=str(error))
        sys.exit(1)

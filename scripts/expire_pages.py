"""Repo-scoped, one-time GitHub Pages expiry. Repository code is retained."""
import json
import os
import time
from datetime import datetime, timezone
from urllib.error import HTTPError
from urllib.request import Request, urlopen

EXPECTED_REPO = 'twk0672005/ta-writing-lab'
EXPIRY = datetime.fromisoformat('2026-10-05T15:00:00+00:00')

def api(method, token):
    req = Request('https://api.github.com/repos/' + EXPECTED_REPO + '/pages', method=method, headers={
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'TA-Writing-Lab-Expiry',
    })
    try:
        with urlopen(req, timeout=30) as response:
            body = response.read()
            return response.status, json.loads(body) if body else None
    except HTTPError as error:
        if error.code == 404:
            return 404, None
        raise RuntimeError('Pages API failed with HTTP ' + str(error.code)) from None

def main():
    if os.environ.get('GITHUB_REPOSITORY') != EXPECTED_REPO:
        raise RuntimeError('Refusing to act outside the approved repository')
    dry_run = os.environ.get('DRY_RUN', 'true').lower() == 'true'
    now = datetime.now(timezone.utc)
    if os.environ.get('GITHUB_EVENT_NAME') == 'schedule' and now.year != 2026:
        print('One-time 2026 schedule: no action in another year')
        return
    token = os.environ['GH_TOKEN']
    status, site = api('GET', token)
    if status == 404:
        print('Pages is already unpublished; repository is untouched')
        return
    if dry_run:
        print(json.dumps({'dry_run': True, 'repository': EXPECTED_REPO, 'expiry_utc': EXPIRY.isoformat(), 'pages_url': site.get('html_url'), 'changed': False}))
        return
    if now < EXPIRY:
        raise RuntimeError('Refusing to unpublish before the approved deadline')
    status, _ = api('DELETE', token)
    if status != 204:
        raise RuntimeError('Unpublish did not return HTTP 204')
    for attempt in range(6):
        status, _ = api('GET', token)
        if status == 404:
            print('Verified: GitHub Pages is unpublished; source repository is retained')
            return
        if attempt < 5:
            time.sleep(2)
    raise RuntimeError('Unpublish was requested but final readback is not yet 404')

if __name__ == '__main__':
    main()

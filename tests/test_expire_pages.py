import importlib.util
import io
import os
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location('expire', 'scripts/expire_pages.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class ExpiryTest(unittest.TestCase):
    def test_api_404_cannot_pass_while_website_is_live(self):
        with patch.object(m, 'api', side_effect=[(404, None), (200, {'sha':'old'}),
                (200, {'full_name':m.EXPECTED_REPO})]), patch.object(m, 'request',
                return_value=({'http_status':200, 'final_url':m.SITE}, b'live')), redirect_stdout(io.StringIO()):
            self.assertFalse(m.verify('read-token', 'old'))

    def test_404_web_and_preserved_source_pass(self):
        with patch.object(m, 'api', side_effect=[(404, None), (200, {'sha':'old'}),
                (200, {'full_name':m.EXPECTED_REPO})]), patch.object(m, 'request',
                return_value=({'http_status':404, 'final_url':m.SITE}, b'404')), redirect_stdout(io.StringIO()):
            self.assertTrue(m.verify('read-token', 'old'))

    def test_redirect_to_other_site_cannot_pass(self):
        with patch.object(m, 'api', side_effect=[(404, None), (200, {'sha':'old'}),
                (200, {'full_name':m.EXPECTED_REPO})]), patch.object(m, 'request',
                return_value=({'http_status':404, 'final_url':'https://elsewhere.example/'}, b'404')), redirect_stdout(io.StringIO()):
            self.assertFalse(m.verify('read-token', 'old'))

    def test_source_change_is_hold(self):
        with patch.object(m, 'api', side_effect=[(404, None), (200, {'sha':'new'}),
                (200, {'full_name':m.EXPECTED_REPO})]), patch.object(m, 'request',
                return_value=({'http_status':404, 'final_url':m.SITE}, b'404')), redirect_stdout(io.StringIO()):
            self.assertFalse(m.verify('read-token', 'old'))

    def test_missing_admin_token_never_deletes(self):
        with patch.dict(os.environ, {'GITHUB_REPOSITORY':m.EXPECTED_REPO, 'GH_TOKEN':'read',
                'DRY_RUN':'false'}, clear=True), patch.object(m, 'api', side_effect=[
                (200, {'full_name':m.EXPECTED_REPO}), (200, {'sha':'old'}),
                (200, {'html_url':m.SITE})]) as api:
            with self.assertRaisesRegex(RuntimeError, 'PAGES_EXPIRY_TOKEN required'):
                m.main()
            self.assertTrue(all(c.kwargs.get('method', 'GET') == 'GET' and len(c.args) < 3
                                for c in api.call_args_list))

    def test_403_diagnostics_are_retained_and_token_redacted(self):
        output = io.StringIO()
        with patch.object(m, 'request', return_value=({'http_status':403,
                'accepted_permissions':'pages=write;administration=write', 'request_id':'req'},
                b'{"message":"Resource not accessible token-value"}')), redirect_stdout(output):
            with self.assertRaisesRegex(RuntimeError, 'HTTP 403'):
                m.api('/pages', 'token-value', 'DELETE', allowed=(204,))
        self.assertIn('administration=write', output.getvalue())
        self.assertIn('req', output.getvalue())
        self.assertNotIn('token-value', output.getvalue())

if __name__ == '__main__':
    unittest.main()

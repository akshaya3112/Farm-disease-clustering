from app import app
with app.test_client() as c:
    r = c.get('/')
    print('Status:', r.status_code)
    html = r.data.decode()
    print('Has FARM_PROFILES_DATA:', 'FARM_PROFILES_DATA' in html)
    has_profiles_json = '"profiles"' in html
    print('Has profiles JSON:', has_profiles_json)
    count = html.count('FARM_PROFILES_DATA')
    print('FARM_PROFILES_DATA occurrences in rendered HTML:', count)
    # Find the scripts block
    idx = html.find('FARM_PROFILES_DATA')
    if idx > 0:
        print('Context:', html[idx-30:idx+80])
    assert r.status_code == 200, f'FAIL: status {r.status_code}'
    assert 'FARM_PROFILES_DATA' in html, 'FAIL: inline data not in HTML'
    print('ALL CHECKS PASSED')
